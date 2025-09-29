const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();

// Simple CORS and JSON middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-interview', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Simple Candidate Model
const candidateSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  resumeFile: {
    filename: String,
    originalName: String,
    size: Number
  },
  chatHistory: [{
    id: String,
    type: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  answers: [{
    questionId: String,
    questionText: String,
    difficulty: String,
    answer: String,
    timeLimit: Number,
    timeTaken: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  currentQuestionIndex: { type: Number, default: 0 },
  score: {
    overall: Number,
    breakdown: {
      easy: Number,
      medium: Number,
      hard: Number
    }
  }
}, { timestamps: true });

const Candidate = mongoose.model('Candidate', candidateSchema);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Sample questions for interviews
const sampleQuestions = [
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

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Upload resume and create candidate
app.post('/api/candidates', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file'
      });
    }

    // Create candidate with basic info
    const candidate = new Candidate({
      name: '',
      email: '',
      phone: '',
      status: 'pending',
      resumeFile: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      },
      chatHistory: [],
      answers: [],
      currentQuestionIndex: 0
    });

    await candidate.save();

    // Determine missing fields (for demo, we'll assume they're all missing)
    const missingFields = ['name', 'email', 'phone'];

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        status: candidate.status,
        chatHistory: candidate.chatHistory,
        answers: candidate.answers,
        currentQuestionIndex: candidate.currentQuestionIndex,
        createdAt: candidate.createdAt
      },
      missingFields,
      requiresInfoCollection: missingFields.length > 0
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading resume',
      error: error.message
    });
  }
});

// Get candidate by ID
app.get('/api/candidates/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    res.json({ candidate });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching candidate'
    });
  }
});

// Update candidate
app.put('/api/candidates/:id', async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (status) updates.status = status;

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.json({
      success: true,
      message: 'Candidate updated successfully',
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        status: candidate.status
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating candidate'
    });
  }
});

// Add chat message
app.post('/api/candidates/:id/chat', async (req, res) => {
  try {
    const { type, content } = req.body;
    
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
      content,
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
    res.status(500).json({
      success: false,
      message: 'Error adding chat message'
    });
  }
});

// Start interview
app.post('/api/candidates/:id/start-interview', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    candidate.status = 'in-progress';
    await candidate.save();

    res.json({
      success: true,
      message: 'Interview started successfully',
      interview: {
        candidateId: candidate._id,
        questions: sampleQuestions,
        isActive: true,
        currentQuestionIndex: 0,
        currentQuestion: sampleQuestions[0],
        timeRemaining: sampleQuestions[0].timeLimit,
        startTime: new Date()
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting interview'
    });
  }
});

// Add interview answer
app.post('/api/candidates/:id/answers', async (req, res) => {
  try {
    const { questionId, questionText, difficulty, answer, timeLimit, timeTaken } = req.body;
    
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const answerData = {
      questionId,
      questionText,
      difficulty,
      answer,
      timeLimit,
      timeTaken,
      timestamp: new Date()
    };

    candidate.answers.push(answerData);
    await candidate.save();

    res.status(201).json({
      success: true,
      message: 'Answer recorded successfully',
      answer: answerData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording answer'
    });
  }
});

// Complete interview
app.post('/api/candidates/:id/complete', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Simple scoring logic
    const totalAnswers = candidate.answers.length;
    const score = Math.floor(Math.random() * 30) + 70; // Random score between 70-100

    candidate.status = 'completed';
    candidate.score = {
      overall: score,
      breakdown: {
        easy: Math.floor(Math.random() * 20) + 80,
        medium: Math.floor(Math.random() * 30) + 70,
        hard: Math.floor(Math.random() * 40) + 60
      }
    };

    await candidate.save();

    res.json({
      success: true,
      message: 'Interview completed successfully',
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        status: candidate.status,
        score: candidate.score,
        summary: `Completed ${totalAnswers} questions with an overall score of ${score}/100`
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing interview'
    });
  }
});

// Get all candidates
app.get('/api/candidates', async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.json({
      candidates,
      pagination: {
        current: 1,
        pages: 1,
        total: candidates.length,
        limit: 10
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching candidates'
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;