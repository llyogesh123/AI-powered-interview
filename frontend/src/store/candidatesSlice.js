import { createSlice } from '@reduxjs/toolkit';

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState: {
    list: [],
    currentCandidate: null
  },
  reducers: {
    addCandidate: (state, action) => {
      const candidate = {
        id: action.payload.id || Date.now().toString(),
        name: action.payload.name,
        email: action.payload.email,
        phone: action.payload.phone,
        resumeFile: action.payload.resumeFile,
        score: null,
        summary: null,
        status: 'pending', // pending, in-progress, completed
        createdAt: new Date().toISOString(),
        completedAt: null,
        chatHistory: [],
        answers: [],
        currentQuestionIndex: 0
      };
      state.list.push(candidate);
      state.currentCandidate = candidate.id;
    },
    updateCandidate: (state, action) => {
      const { id, updates } = action.payload;
      const candidate = state.list.find(c => c.id === id);
      if (candidate) {
        Object.assign(candidate, updates);
      }
    },
    setCurrentCandidate: (state, action) => {
      state.currentCandidate = action.payload;
    },
    addChatMessage: (state, action) => {
      const { candidateId, message } = action.payload;
      const candidate = state.list.find(c => c.id === candidateId);
      if (candidate) {
        candidate.chatHistory.push({
          id: Date.now().toString(),
          ...message,
          timestamp: new Date().toISOString()
        });
      }
    },
    addAnswer: (state, action) => {
      const { candidateId, answer } = action.payload;
      const candidate = state.list.find(c => c.id === candidateId);
      if (candidate) {
        candidate.answers.push(answer);
      }
    },
    completeInterview: (state, action) => {
      const { candidateId, score, summary } = action.payload;
      const candidate = state.list.find(c => c.id === candidateId);
      if (candidate) {
        candidate.status = 'completed';
        candidate.score = score;
        candidate.summary = summary;
        candidate.completedAt = new Date().toISOString();
      }
    }
  }
});

export const {
  addCandidate,
  updateCandidate,
  setCurrentCandidate,
  addChatMessage,
  addAnswer,
  completeInterview
} = candidatesSlice.actions;

export default candidatesSlice.reducer;