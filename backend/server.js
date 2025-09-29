const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Import routes
const candidatesRoutes = require('./routes/candidates');
const interviewsRoutes = require('./routes/interviews');
const questionsRoutes = require('./routes/questions');
const authRoutes = require('./routes/auth');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173', // Development
    'https://localhost:5173', // Development HTTPS
    process.env.FRONTEND_URL, // Production frontend URL
    /\.onrender\.com$/ // Allow all Render subdomains
  ].filter(Boolean),
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-interview', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB successfully');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/interviews', interviewsRoutes);
app.use('/api/questions', questionsRoutes);

// Health check endpoint
// Root route for API health check
app.get('/api', (req, res) => {
  res.json({
    message: 'AI-Powered Interview Platform API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uploadDir: process.env.NODE_ENV === 'production' ? 'system-temp' : 'local-uploads',
    memoryUsage: process.memoryUsage()
  });
});

// Test upload endpoint
app.get('/api/test-upload', (req, res) => {
  const os = require('os');
  const path = require('path');
  
  res.json({
    message: 'Upload configuration test',
    tempDir: os.tmpdir(),
    environment: process.env.NODE_ENV,
    platform: process.platform,
    nodeVersion: process.version,
    uploadLimits: {
      maxFileSize: '10MB',
      allowedTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;