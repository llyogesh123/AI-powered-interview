import { createSlice } from '@reduxjs/toolkit';

const questions = {
  easy: [
    "What is the difference between let, const, and var in JavaScript?",
    "Explain what a React component is and how it differs from a regular function.",
    "What is the purpose of the useState hook in React?",
    "What is the difference between == and === in JavaScript?"
  ],
  medium: [
    "Explain the concept of closures in JavaScript with an example.",
    "What is the Virtual DOM in React and why is it useful?",
    "How do you handle state management in a React application?",
    "Explain the differences between REST and GraphQL APIs."
  ],
  hard: [
    "Implement a debounce function in JavaScript and explain when you would use it.",
    "Explain React's reconciliation process and how keys work in lists.",
    "Design a scalable Node.js application architecture for handling high traffic.",
    "How would you optimize a React application for performance?"
  ]
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState: {
    isActive: false,
    currentQuestion: null,
    currentQuestionIndex: 0,
    timeRemaining: 0,
    difficulty: 'easy', // easy, medium, hard
    questions: [],
    isPaused: false,
    startTime: null,
    endTime: null
  },
  reducers: {
    startInterview: (state) => {
      // Generate random questions for the interview
      const selectedQuestions = [
        ...getRandomQuestions(questions.easy, 2),
        ...getRandomQuestions(questions.medium, 2),
        ...getRandomQuestions(questions.hard, 2)
      ].map((question, index) => ({
        id: index + 1,
        text: question,
        difficulty: index < 2 ? 'easy' : index < 4 ? 'medium' : 'hard',
        timeLimit: index < 2 ? 20 : index < 4 ? 60 : 120
      }));

      state.isActive = true;
      state.questions = selectedQuestions;
      state.currentQuestionIndex = 0;
      state.currentQuestion = selectedQuestions[0];
      state.timeRemaining = selectedQuestions[0].timeLimit;
      state.difficulty = selectedQuestions[0].difficulty;
      state.isPaused = false;
      state.startTime = new Date().toISOString();
      state.endTime = null;
    },
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
        const nextQuestion = state.questions[state.currentQuestionIndex];
        state.currentQuestion = nextQuestion;
        state.timeRemaining = nextQuestion.timeLimit;
        state.difficulty = nextQuestion.difficulty;
      } else {
        // Interview completed
        state.isActive = false;
        state.endTime = new Date().toISOString();
      }
    },
    updateTimer: (state, action) => {
      state.timeRemaining = action.payload;
    },
    pauseInterview: (state) => {
      state.isPaused = true;
    },
    resumeInterview: (state) => {
      state.isPaused = false;
    },
    endInterview: (state) => {
      state.isActive = false;
      state.endTime = new Date().toISOString();
    },
    resetInterview: (state) => {
      state.isActive = false;
      state.currentQuestion = null;
      state.currentQuestionIndex = 0;
      state.timeRemaining = 0;
      state.difficulty = 'easy';
      state.questions = [];
      state.isPaused = false;
      state.startTime = null;
      state.endTime = null;
    }
  }
});

// Helper function to get random questions
function getRandomQuestions(questionArray, count) {
  const shuffled = [...questionArray].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const {
  startInterview,
  nextQuestion,
  updateTimer,
  pauseInterview,
  resumeInterview,
  endInterview,
  resetInterview
} = interviewSlice.actions;

export default interviewSlice.reducer;