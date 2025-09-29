import React,{ useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Clock, User, PlayCircle } from 'lucide-react';
import { hideWelcomeModal, setActiveTab } from '../store/uiSlice';
import { resumeInterview, pauseInterview } from '../store/interviewSlice';

const WelcomeBackModal = () => {
  const dispatch = useDispatch();
  const { showWelcomeModal } = useSelector(state => state.ui);
  const { list: candidates } = useSelector(state => state.candidates);
  const { isActive: isInterviewActive, isPaused } = useSelector(state => state.interview);

  // Check for incomplete sessions on app load
  useEffect(() => {
    const checkForIncompleteSession = () => {
      // Look for candidates with incomplete interviews
      const incompleteCandidate = candidates.find(c => 
        c.status === 'in-progress' || 
        (c.status === 'ready-for-interview' && c.chatHistory?.length > 0)
      );

      // Check if there's an active but paused interview
      const hasIncompleteInterview = isInterviewActive && isPaused;

      if (incompleteCandidate || hasIncompleteInterview) {
        dispatch({ type: 'ui/showWelcomeModal' });
      }
    };

    // Delay the check to allow for rehydration
    const timer = setTimeout(checkForIncompleteSession, 1000);
    return () => clearTimeout(timer);
  }, [candidates, isInterviewActive, isPaused, dispatch]);

  const handleContinueSession = () => {
    // Find the candidate with incomplete session
    const incompleteCandidate = candidates.find(c => 
      c.status === 'in-progress' || 
      (c.status === 'ready-for-interview' && c.chatHistory?.length > 0)
    );

    if (incompleteCandidate) {
      // Set as current candidate and switch to interviewee tab
      dispatch({ type: 'candidates/setCurrentCandidate', payload: incompleteCandidate.id });
      dispatch(setActiveTab('interviewee'));

      // Resume interview if it was paused
      if (isInterviewActive && isPaused) {
        dispatch(resumeInterview());
      }
    }

    dispatch(hideWelcomeModal());
  };

  const handleStartFresh = () => {
    // Reset any incomplete sessions
    const incompleteCandidate = candidates.find(c => 
      c.status === 'in-progress' || 
      (c.status === 'ready-for-interview' && c.chatHistory?.length > 0)
    );

    if (incompleteCandidate) {
      // Pause any active interview
      if (isInterviewActive) {
        dispatch(pauseInterview());
      }
      
      // Clear current candidate selection
      dispatch({ type: 'candidates/setCurrentCandidate', payload: null });
    }

    // Switch to interviewee tab to start fresh
    dispatch(setActiveTab('interviewee'));
    dispatch(hideWelcomeModal());
  };

  const handleViewDashboard = () => {
    dispatch(setActiveTab('interviewer'));
    dispatch(hideWelcomeModal());
  };

  // Find the incomplete candidate for display
  const incompleteCandidate = candidates.find(c => 
    c.status === 'in-progress' || 
    (c.status === 'ready-for-interview' && c.chatHistory?.length > 0)
  );

  if (!showWelcomeModal || !incompleteCandidate) {
    return null;
  }

  const getSessionProgress = () => {
    const totalQuestions = 6;
    const completedAnswers = incompleteCandidate.answers?.length || 0;
    return { completed: completedAnswers, total: totalQuestions };
  };

  const progress = getSessionProgress();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Welcome Back!</h2>
              <p className="text-sm text-gray-600">You have an incomplete session</p>
            </div>
          </div>
          <button
            onClick={() => dispatch(hideWelcomeModal())}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Candidate Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">
                  {incompleteCandidate.name || 'Candidate'}
                </h3>
                <p className="text-sm text-gray-600">{incompleteCandidate.email}</p>
              </div>
            </div>
            
            {/* Progress */}
            <div className="mb-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Interview Progress</span>
                <span className="font-medium text-gray-800">
                  {progress.completed}/{progress.total} questions
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Status */}
            <div className="text-sm">
              <span className="text-gray-600">Status: </span>
              <span className={`font-medium ${
                incompleteCandidate.status === 'in-progress' 
                  ? 'text-blue-600' 
                  : 'text-yellow-600'
              }`}>
                {incompleteCandidate.status === 'in-progress' 
                  ? 'Interview in Progress' 
                  : 'Ready for Interview'}
              </span>
            </div>

            {isInterviewActive && isPaused && (
              <div className="mt-2 text-sm text-orange-600 font-medium">
                ⏸️ Interview is currently paused
              </div>
            )}
          </div>

          {/* Last Activity */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Last activity: {' '}
              {incompleteCandidate.chatHistory?.length > 0
                ? new Date(
                    incompleteCandidate.chatHistory[incompleteCandidate.chatHistory.length - 1].timestamp
                  ).toLocaleString()
                : new Date(incompleteCandidate.createdAt).toLocaleString()
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinueSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors font-medium"
            >
              <PlayCircle className="h-5 w-5" />
              Continue Session
            </button>
            
            <button
              onClick={handleStartFresh}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              Start New Interview
            </button>
            
            <button
              onClick={handleViewDashboard}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              View Dashboard
            </button>
          </div>

          {/* Warning */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-700">
              💡 <strong>Tip:</strong> If you start a new interview, your previous progress will remain saved 
              and you can review it in the dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBackModal;