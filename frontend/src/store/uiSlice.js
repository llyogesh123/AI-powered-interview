import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    activeTab: 'interviewee', // interviewee or interviewer
    showWelcomeModal: false,
    showResumeUpload: true,
    isCollectingMissingInfo: false,
    missingFields: [],
    error: null,
    isLoading: false
  },
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    showWelcomeModal: (state) => {
      state.showWelcomeModal = true;
    },
    hideWelcomeModal: (state) => {
      state.showWelcomeModal = false;
    },
    setResumeUploadVisible: (state, action) => {
      state.showResumeUpload = action.payload;
    },
    setCollectingMissingInfo: (state, action) => {
      state.isCollectingMissingInfo = action.payload;
    },
    setMissingFields: (state, action) => {
      state.missingFields = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  }
});

export const {
  setActiveTab,
  showWelcomeModal,
  hideWelcomeModal,
  setResumeUploadVisible,
  setCollectingMissingInfo,
  setMissingFields,
  setError,
  clearError,
  setLoading
} = uiSlice.actions;

export default uiSlice.reducer;