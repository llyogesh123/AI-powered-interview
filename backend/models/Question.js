const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  category: {
    type: String,
    enum: ['javascript', 'react', 'nodejs', 'database', 'general', 'algorithms', 'system-design'],
    required: true
  },
  timeLimit: {
    type: Number, // in seconds
    required: true
  },
  keywords: [String], // For better matching and filtering
  sampleAnswer: {
    type: String,
    required: false
  },
  scoringCriteria: [{
    criterion: String,
    weight: Number, // percentage weight for this criterion
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
questionSchema.index({ difficulty: 1, category: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ keywords: 1 });

// Static method to get random questions
questionSchema.statics.getRandomQuestions = function(difficulty, category = null, count = 1) {
  const query = { difficulty, isActive: true };
  if (category) {
    query.category = category;
  }
  
  return this.aggregate([
    { $match: query },
    { $sample: { size: count } }
  ]);
};

// Method to increment usage count
questionSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

module.exports = mongoose.model('Question', questionSchema);