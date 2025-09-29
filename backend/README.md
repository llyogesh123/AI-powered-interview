# AI-Powered Interview Platform - Backend

A comprehensive Express.js backend API for an AI-powered interview platform with resume parsing, candidate management, and interview automation.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Resume Processing**: Automatic parsing of PDF, DOC, and DOCX files
- **Candidate Management**: Complete CRUD operations for candidates
- **Interview Sessions**: Structured interview flow with timing and scoring
- **Question Bank**: Categorized questions with difficulty levels and scoring criteria
- **Chat Interface**: Real-time chat functionality for candidate interaction
- **File Upload**: Secure resume file handling with validation
- **Rate Limiting**: API protection against abuse
- **Database**: MongoDB with Mongoose ODM

## Tech Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Resume Parsing**: pdf-parse, mammoth
- **Security**: Helmet, CORS, Rate limiting
- **Validation**: Express-validator
- **Environment**: dotenv

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy example environment file
   copy .env.example .env
   
   # Edit .env with your configuration
   notepad .env
   ```

4. **Configure Environment Variables**
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/ai-interview
   
   # Frontend Configuration
   FRONTEND_URL=http://localhost:5173
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=24h
   
   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   ALLOWED_FILE_TYPES=pdf,doc,docx
   ```

5. **Start MongoDB**
   - **Local MongoDB**: Ensure MongoDB is running on your machine
   - **MongoDB Atlas**: Use the connection string from your Atlas cluster

6. **Seed Database** (Optional but recommended)
   ```bash
   npm run seed
   ```
   This creates sample questions and users:
   - Admin: `admin@aiinterview.com` / `admin123`
   - Interviewer: `john.doe@aiinterview.com` / `password123`
   - HR: `jane.smith@aiinterview.com` / `password123`

7. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

8. **Verify Installation**
   - Open browser to `http://localhost:5000/api/health`
   - Should see: `{"message":"Server is running","timestamp":"...","environment":"development"}`

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update profile | Private |
| PUT | `/api/auth/change-password` | Change password | Private |

### Candidate Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/candidates` | Create candidate (upload resume) | Public |
| GET | `/api/candidates` | Get all candidates | Private |
| GET | `/api/candidates/:id` | Get candidate by ID | Private |
| PUT | `/api/candidates/:id` | Update candidate | Public/Private |
| POST | `/api/candidates/:id/chat` | Add chat message | Public |
| POST | `/api/candidates/:id/answers` | Record interview answer | Public |
| POST | `/api/candidates/:id/complete` | Complete interview | Private |
| DELETE | `/api/candidates/:id` | Delete candidate | Private |

### Question Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/questions` | Get all questions | Private |
| GET | `/api/questions/random` | Get random questions | Public |
| GET | `/api/questions/:id` | Get question by ID | Private |
| POST | `/api/questions` | Create new question | Private |
| PUT | `/api/questions/:id` | Update question | Private |
| DELETE | `/api/questions/:id` | Delete question | Admin |
| POST | `/api/questions/:id/increment-usage` | Track usage | Public |
| GET | `/api/questions/stats/overview` | Question statistics | Private |

### Interview Session Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/interviews` | Get all interviews | Private |
| GET | `/api/interviews/:id` | Get interview by ID | Private |
| POST | `/api/interviews` | Create interview session | Private |
| PUT | `/api/interviews/:id/start` | Start interview | Private |
| PUT | `/api/interviews/:id/pause` | Pause interview | Private |
| PUT | `/api/interviews/:id/resume` | Resume interview | Private |
| PUT | `/api/interviews/:id/complete` | Complete interview | Private |
| PUT | `/api/interviews/:id/next-question` | Next question | Public |
| GET | `/api/interviews/stats/overview` | Interview statistics | Private |

## Database Schema

### User Model
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: ['admin', 'interviewer', 'hr'],
  department: String,
  isActive: Boolean,
  lastLogin: Date
}
```

### Candidate Model
```javascript
{
  name: String,
  email: String,
  phone: String,
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
    overall: Number,
    breakdown: {
      easy: Number,
      medium: Number,
      hard: Number
    }
  },
  status: ['pending', 'ready-for-interview', 'in-progress', 'completed'],
  chatHistory: [ChatMessage],
  answers: [Answer]
}
```

### Question Model
```javascript
{
  text: String,
  difficulty: ['easy', 'medium', 'hard'],
  category: ['javascript', 'react', 'nodejs', 'database', 'general'],
  timeLimit: Number,
  keywords: [String],
  sampleAnswer: String,
  scoringCriteria: [{
    criterion: String,
    weight: Number,
    description: String
  }],
  isActive: Boolean,
  usageCount: Number
}
```

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Populate database with sample data
- `npm test` - Run test suite
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix linting issues

### Project Structure

```
backend/
├── middleware/          # Express middleware
│   ├── auth.js         # Authentication middleware
│   ├── fileUpload.js   # File upload handling
│   └── rateLimiting.js # Rate limiting
├── models/             # Database models
│   ├── User.js
│   ├── Candidate.js
│   ├── Question.js
│   └── InterviewSession.js
├── routes/             # API routes
│   ├── auth.js
│   ├── candidates.js
│   ├── questions.js
│   └── interviews.js
├── scripts/            # Utility scripts
│   └── seedDatabase.js
├── uploads/            # File upload directory
├── utils/              # Helper functions
│   ├── jwt.js
│   ├── helpers.js
│   └── resumeParser.js
├── .env.example        # Environment template
├── .gitignore
├── package.json
└── server.js           # Main application file
```

### Security Features

- JWT authentication with expiration
- Password hashing with bcrypt
- Rate limiting on all routes
- File upload validation and sanitization
- Input sanitization and validation
- CORS configuration
- Helmet security headers
- MongoDB injection protection

### Error Handling

- Centralized error handling middleware
- Validation error responses
- Rate limiting responses
- File upload error handling
- Database error handling

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci
```

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-interview
JWT_SECRET=your-very-secure-jwt-secret-key
FRONTEND_URL=https://your-frontend-domain.com
```

### Production Considerations

1. **Database**: Use MongoDB Atlas or a managed MongoDB service
2. **File Storage**: Consider AWS S3 or similar for file uploads in production
3. **Environment**: Set `NODE_ENV=production`
4. **Security**: Use strong JWT secrets and enable HTTPS
5. **Monitoring**: Implement logging and monitoring solutions
6. **Scaling**: Consider using PM2 for process management

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file
   - Verify network connectivity

2. **File Upload Issues**
   - Check file permissions on uploads directory
   - Verify file type and size limits
   - Ensure sufficient disk space

3. **JWT Token Errors**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper Authorization header format

4. **CORS Issues**
   - Verify FRONTEND_URL in .env
   - Check CORS configuration in server.js

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=app:*
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review the API endpoints and examples above