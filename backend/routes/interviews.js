const express = require('express');
const InterviewSession = require('../models/InterviewSession');
const Question = require('../models/Question');
const Candidate = require('../models/Candidate');
const { auth } = require('../middleware/auth');
const { 
  isValidObjectId,
  paginate,
  buildSortQuery,
  sanitizeInput
} = require('../utils/helpers');

const router = express.Router();

// @route   GET /api/interviews
// @desc    Get all interview sessions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    const { skip, limit: pageLimit } = paginate(parseInt(page), parseInt(limit));
    const sort = buildSortQuery(sortBy, sortOrder);

    const interviews = await InterviewSession.find(query)
      .populate('candidateId', 'name email phone status score')
      .populate('questions.questionId', 'text difficulty category')
      .sort(sort)
      .skip(skip)
      .limit(pageLimit);

    const total = await InterviewSession.countDocuments(query);

    res.json({
      interviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / pageLimit),
        total,
        limit: pageLimit
      }
    });

  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ message: 'Error fetching interviews' });
  }
});

// @route   GET /api/interviews/:id
// @desc    Get interview session by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }

    const interview = await InterviewSession.findById(req.params.id)
      .populate('candidateId')
      .populate('questions.questionId');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json({ interview });

  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({ message: 'Error fetching interview' });
  }
});

// @route   POST /api/interviews
// @desc    Create new interview session
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { 
      candidateId, 
      configuration = {},
      customQuestions = []
    } = req.body;

    if (!candidateId || !isValidObjectId(candidateId)) {
      return res.status(400).json({ message: 'Valid candidate ID is required' });
    }

    // Check if candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check if there's already an active interview for this candidate
    const existingInterview = await InterviewSession.findOne({
      candidateId,
      status: { $in: ['scheduled', 'in-progress', 'paused'] }
    });

    if (existingInterview) {
      return res.status(400).json({ 
        message: 'Candidate already has an active interview session' 
      });
    }

    // Default configuration
    const defaultConfig = {
      easyQuestions: 2,
      mediumQuestions: 2,
      hardQuestions: 2,
      easyTimeLimit: 20,
      mediumTimeLimit: 60,
      hardTimeLimit: 120
    };

    const config = { ...defaultConfig, ...configuration };

    // Generate questions
    let questions = [];

    if (customQuestions.length > 0) {
      // Use custom questions if provided
      questions = customQuestions.map((q, index) => ({
        questionId: q.questionId || q._id,
        order: index + 1,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit
      }));
    } else {
      // Generate random questions
      const easyQuestions = await Question.getRandomQuestions('easy', null, config.easyQuestions);
      const mediumQuestions = await Question.getRandomQuestions('medium', null, config.mediumQuestions);
      const hardQuestions = await Question.getRandomQuestions('hard', null, config.hardQuestions);

      questions = [
        ...easyQuestions.map((q, index) => ({
          questionId: q._id,
          order: index + 1,
          difficulty: 'easy',
          timeLimit: config.easyTimeLimit
        })),
        ...mediumQuestions.map((q, index) => ({
          questionId: q._id,
          order: index + easyQuestions.length + 1,
          difficulty: 'medium',
          timeLimit: config.mediumTimeLimit
        })),
        ...hardQuestions.map((q, index) => ({
          questionId: q._id,
          order: index + easyQuestions.length + mediumQuestions.length + 1,
          difficulty: 'hard',
          timeLimit: config.hardTimeLimit
        }))
      ];
    }

    const interview = new InterviewSession({
      candidateId,
      questions,
      configuration: config
    });

    await interview.save();

    // Update candidate status
    await Candidate.findByIdAndUpdate(candidateId, {
      status: 'ready-for-interview'
    });

    const populatedInterview = await InterviewSession.findById(interview._id)
      .populate('candidateId', 'name email phone')
      .populate('questions.questionId', 'text difficulty category');

    res.status(201).json({
      message: 'Interview session created successfully',
      interview: populatedInterview
    });

  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ message: 'Error creating interview session' });
  }
});

// @route   PUT /api/interviews/:id/start
// @desc    Start interview session
// @access  Private
router.put('/:id/start', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }

    const interview = await InterviewSession.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status !== 'scheduled') {
      return res.status(400).json({ message: 'Interview cannot be started in its current status' });
    }

    await interview.start();

    // Update candidate status
    await Candidate.findByIdAndUpdate(interview.candidateId, {
      status: 'in-progress',
      interviewStartedAt: new Date()
    });

    res.json({
      message: 'Interview started successfully',
      interview: {
        id: interview._id,
        status: interview.status,
        startTime: interview.startTime,
        currentQuestionIndex: interview.currentQuestionIndex
      }
    });

  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ message: 'Error starting interview' });
  }
});

// @route   PUT /api/interviews/:id/pause
// @desc    Pause interview session
// @access  Private
router.put('/:id/pause', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }

    const interview = await InterviewSession.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status !== 'in-progress') {
      return res.status(400).json({ message: 'Only active interviews can be paused' });
    }

    await interview.pause();

    res.json({
      message: 'Interview paused successfully',
      interview: {
        id: interview._id,
        status: interview.status
      }
    });

  } catch (error) {
    console.error('Pause interview error:', error);
    res.status(500).json({ message: 'Error pausing interview' });
  }
});

// @route   PUT /api/interviews/:id/resume
// @desc    Resume interview session
// @access  Private
router.put('/:id/resume', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }

    const interview = await InterviewSession.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status !== 'paused') {
      return res.status(400).json({ message: 'Only paused interviews can be resumed' });
    }

    await interview.resume();

    res.json({
      message: 'Interview resumed successfully',
      interview: {
        id: interview._id,
        status: interview.status
      }
    });

  } catch (error) {
    console.error('Resume interview error:', error);
    res.status(500).json({ message: 'Error resuming interview' });
  }
});

// @route   PUT /api/interviews/:id/complete
// @desc    Complete interview session
// @access  Private
router.put('/:id/complete', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }

    const { 
      interviewerNotes, 
      technicalScore, 
      communicationScore, 
      overallRating, 
      recommendation 
    } = req.body;

    const interview = await InterviewSession.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ message: 'Interview is already completed' });
    }

    // Update interview session
    const updates = {
      status: 'completed',
      endTime: new Date()
    };

    if (interviewerNotes) updates.interviewerNotes = sanitizeInput(interviewerNotes);
    if (technicalScore) updates.technicalScore = Math.min(Math.max(technicalScore, 0), 100);
    if (communicationScore) updates.communicationScore = Math.min(Math.max(communicationScore, 0), 100);
    if (overallRating) updates.overallRating = overallRating;
    if (recommendation) updates.recommendation = recommendation;

    const updatedInterview = await InterviewSession.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    // Update candidate status
    await Candidate.findByIdAndUpdate(interview.candidateId, {
      status: 'completed',
      interviewCompletedAt: new Date()
    });

    res.json({
      message: 'Interview completed successfully',
      interview: updatedInterview
    });

  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({ message: 'Error completing interview' });
  }
});

// @route   PUT /api/interviews/:id/next-question
// @desc    Move to next question
// @access  Public
router.put('/:id/next-question', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }

    const interview = await InterviewSession.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status !== 'in-progress') {
      return res.status(400).json({ message: 'Interview must be in progress to advance questions' });
    }

    // Check if there are more questions
    if (interview.currentQuestionIndex >= interview.questions.length - 1) {
      // No more questions, complete the interview
      await interview.complete();
      
      await Candidate.findByIdAndUpdate(interview.candidateId, {
        status: 'completed',
        interviewCompletedAt: new Date()
      });

      return res.json({
        message: 'Interview completed - no more questions',
        interview: {
          id: interview._id,
          status: 'completed',
          currentQuestionIndex: interview.currentQuestionIndex,
          completed: true
        }
      });
    }

    // Move to next question
    interview.currentQuestionIndex += 1;
    await interview.save();

    const currentQuestion = interview.questions[interview.currentQuestionIndex];

    res.json({
      message: 'Moved to next question',
      interview: {
        id: interview._id,
        currentQuestionIndex: interview.currentQuestionIndex,
        currentQuestion,
        remainingQuestions: interview.questions.length - interview.currentQuestionIndex - 1,
        completed: false
      }
    });

  } catch (error) {
    console.error('Next question error:', error);
    res.status(500).json({ message: 'Error moving to next question' });
  }
});

// @route   GET /api/interviews/stats/overview
// @desc    Get interview statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await InterviewSession.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          paused: { $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          avgTechnicalScore: { $avg: '$technicalScore' },
          avgCommunicationScore: { $avg: '$communicationScore' }
        }
      }
    ]);

    // Get recent interviews
    const recentInterviews = await InterviewSession.find()
      .populate('candidateId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('candidateId status startTime endTime technicalScore communicationScore');

    res.json({
      overview: stats[0] || {
        total: 0,
        scheduled: 0,
        inProgress: 0,
        paused: 0,
        completed: 0,
        cancelled: 0,
        avgTechnicalScore: 0,
        avgCommunicationScore: 0
      },
      recent: recentInterviews
    });

  } catch (error) {
    console.error('Get interview stats error:', error);
    res.status(500).json({ message: 'Error fetching interview statistics' });
  }
});

module.exports = router;