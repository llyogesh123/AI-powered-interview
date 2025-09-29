const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleaned = phone.replace(/[^\d+]/g, '');
  return phoneRegex.test(cleaned) && cleaned.length >= 10;
};

const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return original if can't format
};

const generateRandomId = () => {
  return Math.random().toString(36).substr(2, 9);
};

const calculateTimeElapsed = (startTime, endTime = new Date()) => {
  const elapsed = endTime - startTime;
  return Math.floor(elapsed / 1000); // Return seconds
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially harmful characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

const generateScoreBreakdown = (answers) => {
  const breakdown = { easy: [], medium: [], hard: [] };
  
  answers.forEach(answer => {
    if (answer.score !== null && answer.score !== undefined) {
      breakdown[answer.difficulty].push(answer.score);
    }
  });
  
  const calculateAverage = (scores) => {
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };
  
  return {
    easy: calculateAverage(breakdown.easy),
    medium: calculateAverage(breakdown.medium),
    hard: calculateAverage(breakdown.hard)
  };
};

const generateInterviewSummary = (candidate) => {
  const { answers, score } = candidate;
  
  if (!answers || answers.length === 0) {
    return 'No answers provided during the interview.';
  }
  
  const totalQuestions = answers.length;
  const answeredQuestions = answers.filter(a => a.answer && a.answer.trim().length > 0).length;
  const scoreBreakdown = generateScoreBreakdown(answers);
  
  let summary = `Interview completed with ${answeredQuestions}/${totalQuestions} questions answered. `;
  
  if (score && score.overall) {
    summary += `Overall score: ${score.overall}/100. `;
  }
  
  if (scoreBreakdown.easy !== null) {
    summary += `Easy questions: ${scoreBreakdown.easy}/10. `;
  }
  if (scoreBreakdown.medium !== null) {
    summary += `Medium questions: ${scoreBreakdown.medium}/10. `;
  }
  if (scoreBreakdown.hard !== null) {
    summary += `Hard questions: ${scoreBreakdown.hard}/10. `;
  }
  
  // Add performance assessment
  const overallScore = score?.overall || 0;
  if (overallScore >= 80) {
    summary += 'Excellent performance overall.';
  } else if (overallScore >= 60) {
    summary += 'Good performance with room for improvement.';
  } else if (overallScore >= 40) {
    summary += 'Average performance, requires additional training.';
  } else {
    summary += 'Below average performance, significant improvement needed.';
  }
  
  return summary;
};

const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const paginate = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit };
};

const buildSortQuery = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const order = sortOrder === 'asc' ? 1 : -1;
  return { [sortBy]: order };
};

module.exports = {
  validateEmail,
  validatePhone,
  formatPhone,
  generateRandomId,
  calculateTimeElapsed,
  formatDuration,
  sanitizeInput,
  generateScoreBreakdown,
  generateInterviewSummary,
  isValidObjectId,
  paginate,
  buildSortQuery
};