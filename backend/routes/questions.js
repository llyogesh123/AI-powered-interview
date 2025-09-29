const express = require('express');
const Question = require('../models/Question');
const { auth } = require('../middleware/auth');
const { 
  sanitizeInput, 
  isValidObjectId,
  paginate,
  buildSortQuery
} = require('../utils/helpers');

const router = express.Router();

// @route   GET /api/questions
// @desc    Get all questions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      difficulty, 
      category, 
      search,
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      active = 'true'
    } = req.query;

    // Build query
    const query = {};
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (active === 'true') {
      query.isActive = true;
    } else if (active === 'false') {
      query.isActive = false;
    }

    const { skip, limit: pageLimit } = paginate(parseInt(page), parseInt(limit));
    const sort = buildSortQuery(sortBy, sortOrder);

    const questions = await Question.find(query)
      .sort(sort)
      .skip(skip)
      .limit(pageLimit);

    const total = await Question.countDocuments(query);

    res.json({
      questions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / pageLimit),
        total,
        limit: pageLimit
      }
    });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Error fetching questions' });
  }
});

// @route   GET /api/questions/random
// @desc    Get random questions for interview
// @access  Public
router.get('/random', async (req, res) => {
  try {
    const {
      easyCount = 2,
      mediumCount = 2,
      hardCount = 2,
      category = null
    } = req.query;

    // Get random questions for each difficulty
    const easyQuestions = await Question.getRandomQuestions('easy', category, parseInt(easyCount));
    const mediumQuestions = await Question.getRandomQuestions('medium', category, parseInt(mediumCount));
    const hardQuestions = await Question.getRandomQuestions('hard', category, parseInt(hardCount));

    // Combine and format questions
    const questions = [
      ...easyQuestions.map((q, index) => ({
        ...q,
        order: index + 1,
        timeLimit: 20 // Easy questions: 20 seconds
      })),
      ...mediumQuestions.map((q, index) => ({
        ...q,
        order: index + easyQuestions.length + 1,
        timeLimit: 60 // Medium questions: 60 seconds
      })),
      ...hardQuestions.map((q, index) => ({
        ...q,
        order: index + easyQuestions.length + mediumQuestions.length + 1,
        timeLimit: 120 // Hard questions: 120 seconds
      }))
    ];

    res.json({
      questions,
      totalQuestions: questions.length,
      breakdown: {
        easy: easyQuestions.length,
        medium: mediumQuestions.length,
        hard: hardQuestions.length
      }
    });

  } catch (error) {
    console.error('Get random questions error:', error);
    res.status(500).json({ message: 'Error fetching random questions' });
  }
});

// @route   GET /api/questions/:id
// @desc    Get question by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ question });

  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ message: 'Error fetching question' });
  }
});

// @route   POST /api/questions
// @desc    Create new question
// @access  Private (Admin/Interviewer)
router.post('/', auth, async (req, res) => {
  try {
    const {
      text,
      difficulty,
      category,
      keywords,
      sampleAnswer,
      scoringCriteria
    } = req.body;

    // Validate required fields
    if (!text || !difficulty || !category) {
      return res.status(400).json({
        message: 'Please provide text, difficulty, and category'
      });
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({
        message: 'Difficulty must be easy, medium, or hard'
      });
    }

    // Validate category
    const validCategories = ['javascript', 'react', 'nodejs', 'database', 'general', 'algorithms', 'system-design'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        message: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    // Set time limit based on difficulty
    const timeLimits = {
      easy: 20,
      medium: 60,
      hard: 120
    };

    const question = new Question({
      text: sanitizeInput(text),
      difficulty,
      category,
      timeLimit: timeLimits[difficulty],
      keywords: keywords ? keywords.map(k => sanitizeInput(k)) : [],
      sampleAnswer: sampleAnswer ? sanitizeInput(sampleAnswer) : undefined,
      scoringCriteria: scoringCriteria || []
    });

    await question.save();

    res.status(201).json({
      message: 'Question created successfully',
      question
    });

  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ message: 'Error creating question' });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update question
// @access  Private (Admin/Interviewer)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    const {
      text,
      difficulty,
      category,
      keywords,
      sampleAnswer,
      scoringCriteria,
      isActive
    } = req.body;

    const updates = {};

    if (text) updates.text = sanitizeInput(text);
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      updates.difficulty = difficulty;
      // Update time limit based on new difficulty
      const timeLimits = { easy: 20, medium: 60, hard: 120 };
      updates.timeLimit = timeLimits[difficulty];
    }
    if (category) {
      const validCategories = ['javascript', 'react', 'nodejs', 'database', 'general', 'algorithms', 'system-design'];
      if (validCategories.includes(category)) {
        updates.category = category;
      }
    }
    if (keywords) updates.keywords = keywords.map(k => sanitizeInput(k));
    if (sampleAnswer) updates.sampleAnswer = sanitizeInput(sampleAnswer);
    if (scoringCriteria) updates.scoringCriteria = scoringCriteria;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({
      message: 'Question updated successfully',
      question
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ message: 'Error updating question' });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete question
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const question = await Question.findByIdAndDelete(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Error deleting question' });
  }
});

// @route   POST /api/questions/:id/increment-usage
// @desc    Increment question usage count
// @access  Public
router.post('/:id/increment-usage', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    await question.incrementUsage();

    res.json({ message: 'Usage count updated successfully' });

  } catch (error) {
    console.error('Increment usage error:', error);
    res.status(500).json({ message: 'Error updating usage count' });
  }
});

// @route   GET /api/questions/stats/overview
// @desc    Get questions statistics
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Question.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
          easyCount: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
          mediumCount: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
          hardCount: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } },
          totalUsage: { $sum: '$usageCount' },
          avgUsage: { $avg: '$usageCount' }
        }
      }
    ]);

    const categoryStats = await Question.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          usage: { $sum: '$usageCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      overview: stats[0] || {
        total: 0,
        active: 0,
        inactive: 0,
        easyCount: 0,
        mediumCount: 0,
        hardCount: 0,
        totalUsage: 0,
        avgUsage: 0
      },
      byCategory: categoryStats
    });

  } catch (error) {
    console.error('Get questions stats error:', error);
    res.status(500).json({ message: 'Error fetching questions statistics' });
  }
});

module.exports = router;