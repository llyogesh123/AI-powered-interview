const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    order: Number,
    difficulty: String,
    timeLimit: Number
  }],
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'paused', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  pausedDuration: {
    type: Number, // in seconds
    default: 0
  },
  configuration: {
    easyQuestions: { type: Number, default: 2 },
    mediumQuestions: { type: Number, default: 2 },
    hardQuestions: { type: Number, default: 2 },
    easyTimeLimit: { type: Number, default: 20 },
    mediumTimeLimit: { type: Number, default: 60 },
    hardTimeLimit: { type: Number, default: 120 }
  },
  interviewerNotes: {
    type: String,
    default: ''
  },
  technicalScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  communicationScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  overallRating: {
    type: String,
    enum: ['excellent', 'good', 'average', 'below-average', 'poor'],
    default: null
  },
  recommendation: {
    type: String,
    enum: ['strongly-recommend', 'recommend', 'neutral', 'not-recommend', 'strongly-not-recommend'],
    default: null
  }
}, {
  timestamps: true
});

// Indexes
interviewSessionSchema.index({ candidateId: 1 });
interviewSessionSchema.index({ status: 1 });
interviewSessionSchema.index({ startTime: -1 });

// Virtual for total duration
interviewSessionSchema.virtual('duration').get(function() {
  if (this.startTime && this.endTime) {
    return Math.round((this.endTime - this.startTime) / 1000) - this.pausedDuration; // in seconds
  }
  return null;
});

// Method to start interview
interviewSessionSchema.methods.start = function() {
  this.status = 'in-progress';
  this.startTime = new Date();
  return this.save();
};

// Method to pause interview
interviewSessionSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

// Method to resume interview
interviewSessionSchema.methods.resume = function() {
  this.status = 'in-progress';
  return this.save();
};

// Method to complete interview
interviewSessionSchema.methods.complete = function() {
  this.status = 'completed';
  this.endTime = new Date();
  return this.save();
};

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);