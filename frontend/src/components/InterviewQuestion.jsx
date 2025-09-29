import React,{ useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { updateTimer, nextQuestion, endInterview } from '../store/interviewSlice';
import { addAnswer, addChatMessage, completeInterview } from '../store/candidatesSlice';
import { formatTime, calculateScore, generateAISummary } from '../utils/helpers';

const InterviewQuestion = () => {
  const dispatch = useDispatch();
  const { 
    isActive, 
    currentQuestion, 
    currentQuestionIndex, 
    timeRemaining, 
    questions, 
    isPaused 
  } = useSelector(state => state.interview);
  const { currentCandidate, list: candidates } = useSelector(state => state.candidates);
  
  const [answer, setAnswer] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState(null);
  
  const candidate = candidates.find(c => c.id === currentCandidate);

  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      const timer = setInterval(() => {
        dispatch(updateTimer(timeRemaining - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isActive, isPaused, timeRemaining, dispatch]);

  useEffect(() => {
    if (timeRemaining === 0 && isActive && candidate && currentQuestion) {
      // Time's up, auto-submit
      const responseTime = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : currentQuestion.timeLimit;
      
      const answerData = {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer: answer.trim(),
        difficulty: currentQuestion.difficulty,
        timeLimit: currentQuestion.timeLimit,
        responseTime,
        timeExpired: true,
        timestamp: new Date().toISOString()
      };

      // Add answer to candidate's answers
      dispatch(addAnswer({
        candidateId: candidate.id,
        answer: answerData
      }));

      // Add user's answer to chat
      const userMessage = {
        type: 'user',
        content: answer.trim() || '(No answer provided)',
        timestamp: new Date().toISOString()
      };

      dispatch(addChatMessage({
        candidateId: candidate.id,
        message: userMessage
      }));

      // Check if this was the last question
      if (currentQuestionIndex >= questions.length - 1) {
        // Interview completed
        dispatch(endInterview());

        const allAnswers = [...candidate.answers, answerData];
        const finalScore = calculateScore(allAnswers);
        const aiSummary = generateAISummary(candidate, allAnswers);

        dispatch(completeInterview({
          candidateId: candidate.id,
          score: finalScore,
          summary: aiSummary
        }));

        const completionMessage = {
          type: 'bot',
          content: `🎉 **Interview Complete!**\n\nThank you for completing the interview. Here's your summary:\n\n**Final Score:** ${finalScore}/100\n\n**AI Assessment:** ${aiSummary}\n\nYour results have been recorded. Good luck!`,
          timestamp: new Date().toISOString()
        };

        dispatch(addChatMessage({
          candidateId: candidate.id,
          message: completionMessage
        }));
      } else {
        // Move to next question
        dispatch(nextQuestion());
        
        const transitionMessage = {
          type: 'bot',
          content: "Time's up! Moving to the next question.",
          timestamp: new Date().toISOString()
        };

        dispatch(addChatMessage({
          candidateId: candidate.id,
          message: transitionMessage
        }));
      }
    }
  }, [timeRemaining, isActive, candidate, currentQuestion, currentQuestionIndex, questions.length, questionStartTime, answer, dispatch]);

  useEffect(() => {
    if (currentQuestion) {
      setQuestionStartTime(Date.now());
      setAnswer('');
      
      // Add question to chat
      const questionMessage = {
        type: 'bot',
        content: `**Question ${currentQuestionIndex + 1}/6** (${currentQuestion.difficulty.toUpperCase()} - ${currentQuestion.timeLimit}s)\n\n${currentQuestion.text}`,
        timestamp: new Date().toISOString()
      };

      dispatch(addChatMessage({
        candidateId: currentCandidate,
        message: questionMessage
      }));
    }
  }, [currentQuestion, currentQuestionIndex, currentCandidate, dispatch]);

  const handleSubmitAnswer = (timeExpired = false) => {
    if (!candidate || !currentQuestion) return;

    const responseTime = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : currentQuestion.timeLimit;
    
    const answerData = {
      questionId: currentQuestion.id,
      question: currentQuestion.text,
      answer: answer.trim(),
      difficulty: currentQuestion.difficulty,
      timeLimit: currentQuestion.timeLimit,
      responseTime,
      timeExpired,
      timestamp: new Date().toISOString()
    };

    // Add answer to candidate's answers
    dispatch(addAnswer({
      candidateId: candidate.id,
      answer: answerData
    }));

    // Add user's answer to chat
    const userMessage = {
      type: 'user',
      content: answer.trim() || '(No answer provided)',
      timestamp: new Date().toISOString()
    };

    dispatch(addChatMessage({
      candidateId: candidate.id,
      message: userMessage
    }));

    // Check if this was the last question
    if (currentQuestionIndex >= questions.length - 1) {
      // Interview completed
      completeInterviewProcess();
    } else {
      // Move to next question
      dispatch(nextQuestion());
      
      // Add transition message
      const transitionMessage = {
        type: 'bot',
        content: timeExpired 
          ? "Time's up! Moving to the next question." 
          : "Great! Moving to the next question.",
        timestamp: new Date().toISOString()
      };

      dispatch(addChatMessage({
        candidateId: candidate.id,
        message: transitionMessage
      }));
    }
  };

  const completeInterviewProcess = () => {
    dispatch(endInterview());

    // Calculate final score and generate summary
    const allAnswers = [...candidate.answers];
    if (answer.trim()) {
      // Include current answer if it exists
      allAnswers.push({
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        answer: answer.trim(),
        difficulty: currentQuestion.difficulty,
        timeLimit: currentQuestion.timeLimit,
        responseTime: questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : currentQuestion.timeLimit,
        timeExpired: false,
        timestamp: new Date().toISOString()
      });
    }

    const finalScore = calculateScore(allAnswers);
    const aiSummary = generateAISummary(candidate, allAnswers);

    // Complete the interview
    dispatch(completeInterview({
      candidateId: candidate.id,
      score: finalScore,
      summary: aiSummary
    }));

    // Add completion message
    const completionMessage = {
      type: 'bot',
      content: `🎉 **Interview Complete!**\n\nThank you for completing the interview. Here's your summary:\n\n**Final Score:** ${finalScore}/100\n\n**AI Assessment:** ${aiSummary}\n\nYour results have been recorded. Good luck!`,
      timestamp: new Date().toISOString()
    };

    dispatch(addChatMessage({
      candidateId: candidate.id,
      message: completionMessage
    }));
  };

  if (!isActive || !currentQuestion) {
    return null;
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isTimeRunningOut = timeRemaining <= 10;

  return (
    <div className="bg-white border rounded-lg p-6 mx-4 mb-4 shadow-sm">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress: {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {currentQuestion.difficulty.toUpperCase()}
          </div>
          <span className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1}
          </span>
        </div>
        
        {/* Timer */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          isTimeRunningOut ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
        }`}>
          <Clock className={`h-4 w-4 ${isTimeRunningOut ? 'animate-pulse' : ''}`} />
          <span className="font-mono font-medium">
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 leading-relaxed">
          {currentQuestion.text}
        </h3>
      </div>

      {/* Answer Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Answer:
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">
            {answer.length} characters
          </span>
          <span className="text-xs text-gray-500">
            {answer.trim().split(/\s+/).filter(word => word.length > 0).length} words
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={() => handleSubmitAnswer(false)}
          disabled={!answer.trim()}
          className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {currentQuestionIndex >= questions.length - 1 ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Complete Interview
            </>
          ) : (
            <>
              <ArrowRight className="h-4 w-4" />
              Next Question
            </>
          )}
        </button>
      </div>

      {isTimeRunningOut && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time is running out! The question will auto-submit in {timeRemaining} seconds.
          </p>
        </div>
      )}
    </div>
  );
};

export default InterviewQuestion;