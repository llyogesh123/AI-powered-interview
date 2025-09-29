// File validation utilities for resume upload

export const validateResumeFile = (file) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a PDF or Word document');
  }
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }
  
  return true;
};

// Legacy function for compatibility - parsing is now done server-side
export const parseResumeFile = async () => {
  return {
    name: '',
    email: '',
    phone: '',
    rawText: 'Resume parsing handled by backend API'
  };
};

export const validateFile = (file) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a PDF or DOCX file.');
  }

  // 10MB limit
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB.');
  }

  return true;
};