const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');

const parseResume = async (filePath, mimetype) => {
  try {
    console.log('Parsing resume:', { filePath, mimetype });
    let text = '';
    
    // Check if file exists
    try {
      await fs.access(filePath);
      console.log('File exists and is accessible');
    } catch (accessError) {
      console.error('File access error:', accessError);
      throw new Error(`Cannot access uploaded file: ${accessError.message}`);
    }
    
    if (mimetype === 'application/pdf') {
      console.log('Parsing PDF file...');
      text = await parsePDF(filePath);
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('Parsing DOCX file...');
      text = await parseDocx(filePath);
    } else if (mimetype === 'application/msword') {
      console.log('Parsing DOC file...');
      // For older .doc files, try to extract what we can
      text = await parseDoc(filePath);
    } else {
      throw new Error('Unsupported file format');
    }
    
    console.log('Text extracted, length:', text.length);
    return extractResumeData(text);
  } catch (error) {
    console.error('Error parsing resume:', {
      message: error.message,
      stack: error.stack,
      filePath,
      mimetype
    });
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
};

const parsePDF = async (filePath) => {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

const parseDocx = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

const parseDoc = async (filePath) => {
  // For .doc files, we'll try mammoth as well
  // In production, you might want to use a different library or service
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.warn('Could not parse .doc file with mammoth:', error.message);
    return '';
  }
};

const extractResumeData = (text) => {
  const normalizedText = text.toLowerCase();
  
  // Extract name (first non-empty line that looks like a name)
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const name = extractName(lines);
  
  // Extract email
  const email = extractEmail(text);
  
  // Extract phone
  const phone = extractPhone(text);
  
  // Extract skills
  const skills = extractSkills(normalizedText);
  
  // Extract experience
  const experience = extractExperience(text);
  
  // Extract education
  const education = extractEducation(normalizedText);
  
  // Extract certifications
  const certifications = extractCertifications(normalizedText);
  
  return {
    name,
    email,
    phone,
    skills,
    experience,
    education,
    certifications,
    rawText: text
  };
};

const extractName = (lines) => {
  // Look for the first line that could be a name (2-4 words, mostly alphabetic)
  for (const line of lines.slice(0, 5)) {
    const words = line.split(/\s+/).filter(word => word.length > 0);
    if (words.length >= 2 && words.length <= 4) {
      const isName = words.every(word => /^[a-zA-Z][a-zA-Z\s'.,-]*$/.test(word));
      if (isName) {
        return line;
      }
    }
  }
  return null;
};

const extractEmail = (text) => {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : null;
};

const extractPhone = (text) => {
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const matches = text.match(phoneRegex);
  if (matches) {
    // Clean and format the phone number
    const cleaned = matches[0].replace(/[^\d]/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return matches[0];
  }
  return null;
};

const extractSkills = (text) => {
  const skillKeywords = [
    // Programming languages
    'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
    'typescript', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'lua', 'dart',
    
    // Web technologies
    'html', 'css', 'react', 'angular', 'vue', 'nodejs', 'express', 'django', 'flask',
    'spring', 'asp.net', 'laravel', 'symfony', 'rails', 'bootstrap', 'tailwind',
    'jquery', 'webpack', 'babel', 'sass', 'less',
    
    // Databases
    'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server',
    'dynamodb', 'cassandra', 'elasticsearch', 'neo4j',
    
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform',
    'ansible', 'puppet', 'chef', 'vagrant', 'git', 'github', 'gitlab', 'bitbucket',
    
    // Tools & Frameworks
    'linux', 'ubuntu', 'centos', 'nginx', 'apache', 'tomcat', 'jira', 'confluence',
    'slack', 'trello', 'asana', 'figma', 'sketch', 'photoshop', 'illustrator'
  ];
  
  const foundSkills = [];
  skillKeywords.forEach(skill => {
    const regex = new RegExp(`\\b${skill}\\b`, 'gi');
    if (regex.test(text)) {
      foundSkills.push(skill);
    }
  });
  
  return [...new Set(foundSkills)]; // Remove duplicates
};

const extractExperience = (text) => {
  const lines = text.split('\n');
  const experience = [];
  
  // Look for lines that might indicate work experience
  const experienceKeywords = ['experience', 'work history', 'employment', 'professional experience'];
  const jobTitleKeywords = ['developer', 'engineer', 'analyst', 'manager', 'specialist', 'consultant'];
  
  let inExperienceSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    
    // Check if we're entering an experience section
    if (experienceKeywords.some(keyword => line.includes(keyword))) {
      inExperienceSection = true;
      continue;
    }
    
    // Check if this line looks like a job title or company
    if (inExperienceSection || jobTitleKeywords.some(keyword => line.includes(keyword))) {
      const originalLine = lines[i].trim();
      if (originalLine.length > 10 && originalLine.length < 100) {
        experience.push(originalLine);
      }
    }
    
    // Stop if we hit another section
    if (line.includes('education') || line.includes('skills') || line.includes('certification')) {
      inExperienceSection = false;
    }
  }
  
  return experience.slice(0, 10); // Limit to 10 entries
};

const extractEducation = (text) => {
  const educationKeywords = ['university', 'college', 'bachelor', 'master', 'phd', 'degree', 'education'];
  const lines = text.split('\n');
  const education = [];
  
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    if (educationKeywords.some(keyword => lowerLine.includes(keyword))) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 5 && trimmedLine.length < 150) {
        education.push(trimmedLine);
      }
    }
  });
  
  return education.slice(0, 5); // Limit to 5 entries
};

const extractCertifications = (text) => {
  const certificationKeywords = ['certified', 'certification', 'certificate', 'aws certified', 'microsoft certified', 'cisco', 'comptia'];
  const lines = text.split('\n');
  const certifications = [];
  
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    if (certificationKeywords.some(keyword => lowerLine.includes(keyword))) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 5 && trimmedLine.length < 100) {
        certifications.push(trimmedLine);
      }
    }
  });
  
  return certifications.slice(0, 10); // Limit to 10 entries
};

module.exports = { parseResume };