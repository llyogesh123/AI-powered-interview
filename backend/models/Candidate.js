const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  timeLimit: {
    type: Number, // in seconds
    required: true
  },
  timeTaken: {
    type: Number, // in seconds
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  },
  answeredAt: {
    type: Date,
    default: Date.now
  }
});

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: false,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    default: ''
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  resumeFile: {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  },
  extractedResumeData: {
    skills: [String],
    experience: [String],
    education: [String],
    certifications: [String]
  },
  score: {
    overall: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    breakdown: {
      easy: { type: Number, min: 0, max: 100, default: null },
      medium: { type: Number, min: 0, max: 100, default: null },
      hard: { type: Number, min: 0, max: 100, default: null }
    }
  },
  summary: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'ready-for-interview', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  chatHistory: [chatMessageSchema],
  answers: [answerSchema],
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  interviewStartedAt: {
    type: Date,
    default: null
  },
  interviewCompletedAt: {
    type: Date,
    default: null
  },
  totalInterviewTime: {
    type: Number, // in minutes
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
candidateSchema.index({ email: 1 });
candidateSchema.index({ status: 1 });
candidateSchema.index({ createdAt: -1 });

// Virtual for interview duration
candidateSchema.virtual('interviewDuration').get(function() {
  if (this.interviewStartedAt && this.interviewCompletedAt) {
    return Math.round((this.interviewCompletedAt - this.interviewStartedAt) / (1000 * 60)); // in minutes
  }
  return null;
});

// Method to calculate overall score
candidateSchema.methods.calculateScore = function() {
  if (this.answers.length === 0) return 0;
  
  const scores = this.answers.filter(answer => answer.score !== null);
  if (scores.length === 0) return 0;
  
  const totalScore = scores.reduce((sum, answer) => sum + answer.score, 0);
  return Math.round((totalScore / scores.length) * 10); // Convert to 0-100 scale
};

// Method to get score breakdown by difficulty
candidateSchema.methods.getScoreBreakdown = function() {
  const breakdown = { easy: [], medium: [], hard: [] };
  
  this.answers.forEach(answer => {
    if (answer.score !== null) {
      breakdown[answer.difficulty].push(answer.score);
    }
  });
  
  return {
    easy: breakdown.easy.length > 0 ? 
      Math.round(breakdown.easy.reduce((sum, score) => sum + score, 0) / breakdown.easy.length * 10) : null,
    medium: breakdown.medium.length > 0 ? 
      Math.round(breakdown.medium.reduce((sum, score) => sum + score, 0) / breakdown.medium.length * 10) : null,
    hard: breakdown.hard.length > 0 ? 
      Math.round(breakdown.hard.reduce((sum, score) => sum + score, 0) / breakdown.hard.length * 10) : null
  };
};

module.exports = mongoose.model('Candidate', candidateSchema);