# AI-Powered Interview Assistant

A comprehensive React application that works as an AI-powered interview assistant with two synchronized interfaces: one for candidates (interviewee) and one for interviewers (dashboard).

## 🚀 Features

### For Candidates (Interviewee Tab)
- **Resume Upload**: Upload PDF or DOCX files with automatic data extraction
- **Smart Data Collection**: AI extracts Name, Email, Phone from resume; prompts for missing fields
- **Interactive Interview**: 6-question technical interview (2 Easy, 2 Medium, 2 Hard)
- **Timed Questions**: Easy (20s), Medium (60s), Hard (120s) with auto-submit
- **Real-time Chat**: Conversational interface with progress tracking

### For Interviewers (Dashboard Tab)
- **Candidate Management**: View all candidates with scores and status
- **Search & Filter**: Find candidates by name, email, or status
- **Detailed Views**: Complete chat history, answers, and AI assessment for each candidate
- **Score Analytics**: Automatic scoring and AI-generated summaries

### System Features
- **Local Persistence**: All data saved locally using Redux Persist
- **Session Management**: Welcome Back modal for incomplete interviews
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Error Handling**: Comprehensive error boundaries and user feedback

## 🛠️ Tech Stack

- **Frontend**: React 19 with Vite
- **State Management**: Redux Toolkit with Redux Persist
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **PDF Parsing**: PDF.js
- **DOCX Parsing**: Mammoth.js
- **File Processing**: Native browser APIs

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install additional packages** (if not already installed)
   ```bash
   npm install @reduxjs/toolkit react-redux redux-persist react-router-dom pdfjs-dist mammoth lucide-react uuid
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

## 📖 Usage Guide

### Starting an Interview (Candidate Flow)

1. **Upload Resume**
   - Navigate to the "Interviewee" tab
   - Drag and drop or click to upload a PDF/DOCX resume
   - The system will automatically extract your information

2. **Complete Missing Information**
   - If any required fields (Name, Email, Phone) are missing, the chatbot will ask for them
   - Provide the requested information to proceed

3. **Take the Interview**
   - Click "Start Interview" when prompted
   - Answer 6 questions within the time limits
   - Questions automatically proceed when time runs out
   - View your final score and AI assessment

### Managing Candidates (Interviewer Flow)

1. **View Dashboard**
   - Navigate to the "Interviewer" tab
   - See overview statistics and candidate list

2. **Search and Filter**
   - Use the search bar to find specific candidates
   - Filter by status: Pending, Ready, In Progress, Completed
   - Sort by name, score, date applied, or completion date

3. **Review Candidates**
   - Click "View" on any candidate to see detailed information
   - Review chat history, answers, and AI assessment
   - See complete interview timeline and performance

### Session Management

- **Auto-Save**: All progress is automatically saved locally
- **Welcome Back**: If you close the browser during an interview, you'll see a "Welcome Back" modal when you return
- **Resume Session**: Continue where you left off or start fresh
- **Multiple Sessions**: The app can handle multiple candidate sessions

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── ResumeUpload.jsx        # File upload and parsing
│   ├── ChatInterface.jsx       # Chat UI and messaging
│   ├── InterviewQuestion.jsx   # Timed questions component
│   ├── InterviewerDashboard.jsx # Dashboard and candidate management
│   ├── WelcomeBackModal.jsx    # Session restoration
│   ├── ErrorBoundary.jsx       # Error handling
│   └── LoadingSpinner.jsx      # Loading states
├── store/               # Redux store and slices
│   ├── index.js                # Store configuration
│   ├── candidatesSlice.js      # Candidate data management
│   ├── interviewSlice.js       # Interview state management
│   └── uiSlice.js              # UI state management
├── utils/               # Utility functions
│   ├── resumeParser.js         # PDF/DOCX parsing logic
│   └── helpers.js              # General helper functions
├── App.jsx              # Main application component
├── main.jsx            # Application entry point
└── index.css           # Global styles
```

## 🎨 Customization

### Adding New Questions
Edit `src/store/interviewSlice.js` and modify the questions object:

```javascript
const questions = {
  easy: [
    "Your easy question here...",
    // Add more easy questions
  ],
  medium: [
    "Your medium question here...",
    // Add more medium questions
  ],
  hard: [
    "Your hard question here...",
    // Add more hard questions
  ]
};
```

### Modifying Time Limits
In `src/store/interviewSlice.js`, update the time limits in the question mapping:

```javascript
timeLimit: index < 2 ? 30 : index < 4 ? 90 : 180  // Easy: 30s, Medium: 90s, Hard: 180s
```

### Styling Customization
The app uses Tailwind CSS. Customize colors and themes in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#your-color',
        500: '#your-primary-color',
        600: '#your-darker-color',
        // ... more shades
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **File Upload Not Working**
   - Ensure browser supports File API
   - Check file size (max 10MB)
   - Verify file format (PDF or DOCX only)

2. **Resume Parsing Issues**
   - Some complex PDF layouts may not parse correctly
   - Scanned PDFs won't work (text extraction only)
   - Try a different resume format if extraction fails

3. **Timer Issues**
   - Timers pause when browser tab is inactive
   - Background processing may be limited by browser
   - Keep the tab active during interviews

4. **Data Not Persisting**
   - Check if browser supports localStorage
   - Clear browser cache if experiencing issues
   - Ensure Redux Persist is properly configured

### Performance Tips

- **Large Files**: Compress PDFs before uploading for better performance
- **Multiple Candidates**: The app handles multiple sessions but may slow with 100+ candidates
- **Mobile Usage**: Works on mobile but desktop provides better experience for typing

## 🔧 Development

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

### Preview Production Build
```bash
npm run preview
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions, please create an issue in the repository or contact the development team.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
