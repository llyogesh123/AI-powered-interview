export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculateScore = (answers) => {
  if (!answers || answers.length === 0) return 0;
  
  let totalScore = 0;
  let maxScore = 0;

  answers.forEach(answer => {
    const { difficulty, responseTime, timeLimit, answer: responseText } = answer;
    
    let baseScore = 0;
    let maxQuestionScore = 0;

    // Base scoring by difficulty
    switch (difficulty) {
      case 'easy':
        maxQuestionScore = 10;
        break;
      case 'medium':
        maxQuestionScore = 20;
        break;
      case 'hard':
        maxQuestionScore = 30;
        break;
      default:
        maxQuestionScore = 10;
    }

    // Simple scoring based on response length and time taken
    const wordCount = responseText ? responseText.split(' ').length : 0;
    const timeRatio = responseTime / timeLimit;

    // Score based on response quality (simplified)
    if (wordCount === 0) {
      baseScore = 0;
    } else if (wordCount < 5) {
      baseScore = maxQuestionScore * 0.2;
    } else if (wordCount < 15) {
      baseScore = maxQuestionScore * 0.5;
    } else if (wordCount < 30) {
      baseScore = maxQuestionScore * 0.7;
    } else {
      baseScore = maxQuestionScore * 0.9;
    }

    // Bonus for answering quickly (but not too quickly)
    if (timeRatio < 0.3 && wordCount > 5) {
      baseScore *= 1.1;
    } else if (timeRatio > 0.9) {
      baseScore *= 0.8;
    }

    totalScore += Math.min(baseScore, maxQuestionScore);
    maxScore += maxQuestionScore;
  });

  return Math.round((totalScore / maxScore) * 100);
};

export const generateAISummary = (candidate, answers) => {
  const score = calculateScore(answers);
  const totalQuestions = answers.length;
  const answeredQuestions = answers.filter(a => a.answer && a.answer.trim().length > 0).length;
  
  let summary = `Candidate completed ${answeredQuestions}/${totalQuestions} questions with a score of ${score}/100. `;
  
  if (score >= 80) {
    summary += "Excellent performance with comprehensive answers demonstrating strong technical knowledge.";
  } else if (score >= 60) {
    summary += "Good performance with solid understanding of most concepts.";
  } else if (score >= 40) {
    summary += "Average performance with some areas needing improvement.";
  } else {
    summary += "Below average performance. Candidate may need additional preparation or training.";
  }

  // Add specific feedback based on difficulty levels
  const easyAnswers = answers.filter(a => a.difficulty === 'easy');
  const mediumAnswers = answers.filter(a => a.difficulty === 'medium');
  const hardAnswers = answers.filter(a => a.difficulty === 'hard');

  const easyScore = calculateScore(easyAnswers);
  const mediumScore = calculateScore(mediumAnswers);
  const hardScore = calculateScore(hardAnswers);

  if (easyScore < 50) {
    summary += " Struggles with fundamental concepts.";
  }
  if (mediumScore < 50) {
    summary += " Needs improvement in intermediate-level topics.";
  }
  if (hardScore >= 70) {
    summary += " Shows strong problem-solving abilities in complex scenarios.";
  }

  return summary;
};

export const getMissingFields = (candidateData) => {
  const required = ['name', 'email', 'phone'];
  return required.filter(field => !candidateData[field] || candidateData[field].trim() === '');
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
};

export const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};