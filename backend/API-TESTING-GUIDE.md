# AI-Powered Interview Platform - API Testing Guide

## Postman Collection for Testing Backend APIs

Base URL: `http://localhost:5000/api`

### 1. Health Check
**GET** `/health`
```json
Response:
{
  "status": "OK",
  "timestamp": "2025-09-28T10:00:00.000Z",
  "environment": "development"
}
```

### 2. Authentication APIs

#### Register User
**POST** `/auth/register`
```json
Body:
{
  "username": "interviewer1",
  "email": "john.doe@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "interviewer"
}

Response:
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "interviewer1",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "interviewer"
  }
}
```

#### Login User
**POST** `/auth/login`
```json
Body:
{
  "login": "john.doe@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "interviewer1",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "interviewer"
  }
}
```

#### Get Current User
**GET** `/auth/me`
```
Headers:
Authorization: Bearer jwt_token_here

Response:
{
  "user": {
    "id": "user_id",
    "username": "interviewer1",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "interviewer"
  }
}
```

### 3. Candidate APIs

#### Upload Resume (Create Candidate)
**POST** `/candidates`
```
Body: form-data
resume: [Upload PDF/DOCX file]

Response:
{
  "success": true,
  "message": "Resume uploaded successfully",
  "candidate": {
    "id": "candidate_id",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "(555) 123-4567",
    "status": "pending",
    "extractedData": {
      "skills": ["JavaScript", "React", "Node.js"],
      "experience": ["Software Developer at XYZ Corp"],
      "education": ["BS Computer Science"],
      "certifications": []
    },
    "chatHistory": [],
    "answers": [],
    "currentQuestionIndex": 0,
    "createdAt": "2025-09-28T10:00:00.000Z"
  },
  "missingFields": [],
  "requiresInfoCollection": false
}
```

#### Get All Candidates
**GET** `/candidates`
```
Headers:
Authorization: Bearer jwt_token_here

Query Parameters (optional):
?page=1&limit=10&status=pending&search=john

Response:
{
  "candidates": [...],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50,
    "limit": 10
  }
}
```

#### Get Candidate by ID
**GET** `/candidates/{candidate_id}`
```
Headers:
Authorization: Bearer jwt_token_here

Response:
{
  "candidate": {
    "id": "candidate_id",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "(555) 123-4567",
    "status": "pending",
    "chatHistory": [...],
    "answers": [...],
    "score": {...}
  }
}
```

#### Update Candidate
**PUT** `/candidates/{candidate_id}`
```json
Body:
{
  "name": "Jane Smith Updated",
  "email": "jane.updated@example.com",
  "phone": "(555) 987-6543",
  "status": "ready-for-interview"
}

Response:
{
  "success": true,
  "message": "Candidate updated successfully",
  "candidate": {
    "id": "candidate_id",
    "name": "Jane Smith Updated",
    "email": "jane.updated@example.com",
    "phone": "(555) 987-6543",
    "status": "ready-for-interview"
  }
}
```

#### Add Chat Message
**POST** `/candidates/{candidate_id}/chat`
```json
Body:
{
  "type": "user",
  "content": "Hello, I'm ready for the interview!"
}

Response:
{
  "success": true,
  "message": "Chat message added successfully",
  "chatMessage": {
    "id": "message_id",
    "type": "user",
    "content": "Hello, I'm ready for the interview!",
    "timestamp": "2025-09-28T10:00:00.000Z"
  }
}
```

#### Add Interview Answer
**POST** `/candidates/{candidate_id}/answers`
```json
Body:
{
  "questionId": "question_id",
  "questionText": "What is the difference between let, const, and var?",
  "difficulty": "easy",
  "answer": "let and const have block scope while var has function scope...",
  "timeLimit": 20,
  "timeTaken": 15
}

Response:
{
  "success": true,
  "message": "Answer recorded successfully",
  "answer": {
    "questionId": "question_id",
    "questionText": "What is the difference between let, const, and var?",
    "difficulty": "easy",
    "answer": "let and const have block scope while var has function scope...",
    "timeLimit": 20,
    "timeTaken": 15,
    "answeredAt": "2025-09-28T10:00:00.000Z"
  }
}
```

#### Start Interview
**POST** `/candidates/{candidate_id}/start-interview`
```json
Response:
{
  "success": true,
  "message": "Interview started successfully",
  "interview": {
    "candidateId": "candidate_id",
    "questions": [
      {
        "id": 1,
        "text": "What is the difference between let, const, and var in JavaScript?",
        "difficulty": "easy",
        "timeLimit": 20
      },
      ...
    ],
    "isActive": true,
    "currentQuestionIndex": 0,
    "currentQuestion": {...},
    "timeRemaining": 20,
    "startTime": "2025-09-28T10:00:00.000Z"
  }
}
```

#### Complete Interview
**POST** `/candidates/{candidate_id}/complete`
```
Headers:
Authorization: Bearer jwt_token_here

Response:
{
  "success": true,
  "message": "Interview completed successfully",
  "candidate": {
    "id": "candidate_id",
    "name": "Jane Smith",
    "status": "completed",
    "score": {
      "overall": 85,
      "breakdown": {
        "easy": 90,
        "medium": 80,
        "hard": 85
      }
    },
    "summary": "Strong technical skills...",
    "interviewCompletedAt": "2025-09-28T10:30:00.000Z"
  }
}
```

### 4. Question APIs

#### Get All Questions
**GET** `/questions`
```
Headers:
Authorization: Bearer jwt_token_here

Query Parameters (optional):
?difficulty=easy&category=javascript&page=1&limit=20

Response:
{
  "questions": [...],
  "pagination": {...}
}
```

#### Get Random Questions
**GET** `/questions/random`
```
Query Parameters (optional):
?easyCount=2&mediumCount=2&hardCount=2&category=javascript

Response:
{
  "questions": [...],
  "totalQuestions": 6,
  "breakdown": {
    "easy": 2,
    "medium": 2,
    "hard": 2
  }
}
```

#### Create Question
**POST** `/questions`
```json
Headers:
Authorization: Bearer jwt_token_here

Body:
{
  "text": "Explain the concept of hoisting in JavaScript",
  "difficulty": "medium",
  "category": "javascript",
  "keywords": ["hoisting", "javascript", "variables"],
  "sampleAnswer": "Hoisting is JavaScript's behavior of moving declarations to the top..."
}

Response:
{
  "success": true,
  "message": "Question created successfully",
  "question": {...}
}
```

### 5. Interview Session APIs

#### Get All Interview Sessions
**GET** `/interviews`
```
Headers:
Authorization: Bearer jwt_token_here

Response:
{
  "interviews": [...],
  "pagination": {...}
}
```

#### Create Interview Session
**POST** `/interviews`
```json
Headers:
Authorization: Bearer jwt_token_here

Body:
{
  "candidateId": "candidate_id",
  "configuration": {
    "easyQuestions": 2,
    "mediumQuestions": 2,
    "hardQuestions": 2
  }
}

Response:
{
  "success": true,
  "message": "Interview session created successfully",
  "interview": {...}
}
```

## Testing Workflow

1. **Setup**: Start your backend server (`npm run dev`)
2. **Health Check**: Test `/health` endpoint
3. **Authentication**: Register/Login to get JWT token
4. **Upload Resume**: Test file upload with `/candidates` POST
5. **Chat Flow**: Add messages with `/candidates/{id}/chat`
6. **Interview Flow**: Start interview and add answers
7. **Complete**: Finish interview and get results

## Sample Test Data

### Sample Resume Upload
Create a simple PDF or DOCX file with content like:
```
Jane Smith
Email: jane@example.com
Phone: (555) 123-4567

Skills: JavaScript, React, Node.js, MongoDB
Experience: 3 years as Software Developer
Education: BS Computer Science
```

### Sample Chat Messages
```json
[
  {"type": "bot", "content": "Welcome! Let's start your interview."},
  {"type": "user", "content": "I'm ready to begin!"},
  {"type": "bot", "content": "Great! Here's your first question..."}
]
```

## Error Responses
All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error