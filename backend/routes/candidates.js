const express = require('express');
const Candidate = require('../models/Candidate');
const { auth, optionalAuth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/fileUpload');
const { uploadLimiter } = require('../middleware/rateLimiting');
const { parseResume } = require('../utils/resumeParser');
const { 
  validateEmail, 
  validatePhone, 
  formatPhone, 
  sanitizeInput, 
  generateInterviewSummary,
  isValidObjectId,
  paginate,
  buildSortQuery
} = require('../utils/helpers');

const router = express.Router();

// @route   POST /api/candidates
// @desc    Create a new candidate (upload resume)
// @access  Public
router.post('/', uploadLimiter, upload.single('resume'), handleMulterError, async (req, res) => {
  try {
    console.log('Upload request received:', {
      hasFile: !!req.file,
      headers: req.headers['content-type'],
      fileInfo: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      } : null
    });

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Please upload a resume file' 
      });
    }

    // Parse the resume
    const resumeData = await parseResume(req.file.path, req.file.mimetype);

    // Create candidate with parsed data
    const candidate = new Candidate({
      name: resumeData.name || '',
      email: resumeData.email || '',
      phone: resumeData.phone || '',
      resumeFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      },
      extractedResumeData: {
        skills: resumeData.skills || [],
        experience: resumeData.experience || [],
        education: resumeData.education || [],
        certifications: resumeData.certifications || []
      },
      chatHistory: []
    });

    await candidate.save();

    // Clean up temporary file in production
    if (process.env.NODE_ENV === 'production') {
      try {
        const fs = require('fs').promises;
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temporary file:', cleanupError.message);
      }
    }

    // Determine missing fields
    const missingFields = [];
    if (!candidate.name) missingFields.push('name');
    if (!candidate.email) missingFields.push('email');
    if (!candidate.phone) missingFields.push('phone');

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        status: candidate.status,
        extractedData: candidate.extractedResumeData,
        chatHistory: candidate.chatHistory,
        answers: candidate.answers,
        currentQuestionIndex: candidate.currentQuestionIndex,
        createdAt: candidate.createdAt
      },
      missingFields,
      requiresInfoCollection: missingFields.length > 0
    });

  } catch (error) {
    console.error('Create candidate error:', error);
    
    // Clean up uploaded file if there's an error
    if (req.file && req.file.path) {
      try {
        const fs = require('fs').promises;
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup file after error:', cleanupError.message);
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error creating candidate', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/candidates
// @desc    Get all candidates
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const { skip, limit: pageLimit } = paginate(parseInt(page), parseInt(limit));
    const sort = buildSortQuery(sortBy, sortOrder);

    const candidates = await Candidate.find(query)
      .select('-chatHistory -resumeFile.path')
      .sort(sort)
      .skip(skip)
      .limit(pageLimit);

    const total = await Candidate.countDocuments(query);

    res.json({
      candidates,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / pageLimit),
        total,
        limit: pageLimit
      }
    });

  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ message: 'Error fetching candidates' });
  }
});

// @route   GET /api/candidates/:id
// @desc    Get candidate by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid candidate ID' });
    }

    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({ candidate });

  } catch (error) {
    console.error('Get candidate error:', error);
    res.status(500).json({ message: 'Error fetching candidate' });
  }
});

// @route   PUT /api/candidates/:id
// @desc    Update candidate information
// @access  Public (for chat interface) / Private (for admin)
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid candidate ID' });
    }

    const { name, email, phone, status } = req.body;
    const updates = {};

    // Validate and sanitize inputs
    if (name) {
      const sanitizedName = sanitizeInput(name);
      if (sanitizedName.length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters long' });
      }
      updates.name = sanitizedName;
    }

    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
      }
      updates.email = email.toLowerCase();
    }

    if (phone) {
      if (!validatePhone(phone)) {
        return res.status(400).json({ message: 'Please provide a valid phone number' });
      }
      updates.phone = formatPhone(phone);
    }

    // Only authenticated users can update status
    if (status && req.user) {
      if (['pending', 'ready-for-interview', 'in-progress', 'completed', 'cancelled'].includes(status)) {
        updates.status = status;
        
        if (status === 'in-progress' && !updates.interviewStartedAt) {
          updates.interviewStartedAt = new Date();
        }
        
        if (status === 'completed') {
          updates.interviewCompletedAt = new Date();
        }
      }
    }

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({
      message: 'Candidate updated successfully',
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        status: candidate.status,
        interviewStartedAt: candidate.interviewStartedAt,
        interviewCompletedAt: candidate.interviewCompletedAt
      }
    });

  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ message: 'Error updating candidate' });
  }
});

// @route   POST /api/candidates/:id/chat
// @desc    Add chat message
// @access  Public
router.post('/:id/chat', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid candidate ID' 
      });
    }

    const { type, content } = req.body;

    if (!type || !content) {
      return res.status(400).json({ 
        success: false,
        message: 'Message type and content are required' 
      });
    }

    if (!['user', 'bot'].includes(type)) {
      return res.status(400).json({ 
        success: false,
        message: 'Message type must be "user" or "bot"' 
      });
    }

    const sanitizedContent = sanitizeInput(content);

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ 
        success: false,
        message: 'Candidate not found' 
      });
    }

    const message = {
      id: Date.now().toString(),
      type,
      content: sanitizedContent,
      timestamp: new Date()
    };

    candidate.chatHistory.push(message);
    await candidate.save();

    res.status(201).json({
      success: true,
      message: 'Chat message added successfully',
      chatMessage: message
    });

  } catch (error) {
    console.error('Add chat message error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error adding chat message' 
    });
  }
});

// @route   POST /api/candidates/:id/answers
// @desc    Add interview answer
// @access  Public
router.post('/:id/answers', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid candidate ID' });
    }

    const { 
      questionId, 
      questionText, 
      difficulty, 
      answer, 
      timeLimit, 
      timeTaken 
    } = req.body;

    // Validate required fields
    if (!questionId || !questionText || !difficulty || !answer || !timeLimit || timeTaken === undefined) {
      return res.status(400).json({ 
        message: 'All fields are required: questionId, questionText, difficulty, answer, timeLimit, timeTaken' 
      });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ message: 'Difficulty must be easy, medium, or hard' });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    const answerData = {
      questionId,
      questionText: sanitizeInput(questionText),
      difficulty,
      answer: sanitizeInput(answer),
      timeLimit: parseInt(timeLimit),
      timeTaken: parseInt(timeTaken),
      answeredAt: new Date()
    };

    candidate.answers.push(answerData);
    await candidate.save();

    res.status(201).json({
      message: 'Answer recorded successfully',
      answer: answerData
    });

  } catch (error) {
    console.error('Add answer error:', error);
    res.status(500).json({ message: 'Error recording answer' });
  }
});

// @route   POST /api/candidates/:id/complete
// @desc    Complete interview and calculate score
// @access  Private
router.post('/:id/complete', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid candidate ID' });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Calculate score (you can implement your own scoring logic here)
    const overallScore = candidate.calculateScore();
    const scoreBreakdown = candidate.getScoreBreakdown();
    const summary = generateInterviewSummary(candidate);

    const updates = {
      status: 'completed',
      'score.overall': overallScore,
      'score.breakdown': scoreBreakdown,
      summary,
      interviewCompletedAt: new Date()
    };

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.json({
      message: 'Interview completed successfully',
      candidate: {
        id: updatedCandidate._id,
        name: updatedCandidate.name,
        email: updatedCandidate.email,
        status: updatedCandidate.status,
        score: updatedCandidate.score,
        summary: updatedCandidate.summary,
        interviewCompletedAt: updatedCandidate.interviewCompletedAt
      }
    });

  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({ message: 'Error completing interview' });
  }
});

// @route   POST /api/candidates/:id/start-interview
// @desc    Start interview for candidate
// @access  Public
router.post('/:id/start-interview', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid candidate ID' 
      });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ 
        success: false,
        message: 'Candidate not found' 
      });
    }

    // Update candidate status to in-progress
    candidate.status = 'in-progress';
    candidate.interviewStartedAt = new Date();
    await candidate.save();

    // Generate random questions for interview (2 easy, 2 medium, 2 hard)
    const questions = [
      {
        id: 1,
        text: "What is the difference between let, const, and var in JavaScript?",
        difficulty: "easy",
        timeLimit: 20
      },
      {
        id: 2,
        text: "What is the purpose of the useState hook in React?",
        difficulty: "easy", 
        timeLimit: 20
      },
      {
        id: 3,
        text: "Explain the concept of closures in JavaScript with an example.",
        difficulty: "medium",
        timeLimit: 60
      },
      {
        id: 4,
        text: "What is the Virtual DOM in React and why is it useful?",
        difficulty: "medium",
        timeLimit: 60
      },
      {
        id: 5,
        text: "Implement a debounce function in JavaScript and explain when you would use it.",
        difficulty: "hard",
        timeLimit: 120
      },
      {
        id: 6,
        text: "How would you optimize a React application for performance?",
        difficulty: "hard",
        timeLimit: 120
      }
    ];

    res.json({
      success: true,
      message: 'Interview started successfully',
      interview: {
        candidateId: candidate._id,
        questions,
        isActive: true,
        currentQuestionIndex: 0,
        currentQuestion: questions[0],
        timeRemaining: questions[0].timeLimit,
        startTime: candidate.interviewStartedAt
      }
    });

  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error starting interview' 
    });
  }
});

// @route   DELETE /api/candidates/:id
// @desc    Delete candidate
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid candidate ID' 
      });
    }

    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ 
        success: false,
        message: 'Candidate not found' 
      });
    }

    // TODO: Delete resume file from filesystem
    // fs.unlink(candidate.resumeFile.path)

    res.json({ 
      success: true,
      message: 'Candidate deleted successfully' 
    });

  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting candidate' 
    });
  }
});

module.exports = router;