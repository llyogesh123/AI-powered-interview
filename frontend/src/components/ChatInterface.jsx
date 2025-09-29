import { Bot, Clock, Send, User } from 'lucide-react';
import React,{ useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addAnswer, addChatMessage, completeInterview, updateCandidate } from '../store/candidatesSlice';
import { endInterview, nextQuestion, startInterview, updateTimer } from '../store/interviewSlice';
import { setCollectingMissingInfo, setMissingFields } from '../store/uiSlice';
import { calculateScore, formatPhone, formatTime, generateAISummary, validateEmail, validatePhone } from '../utils/helpers';

const ChatInterface = () => {
  const dispatch = useDispatch();
  const { list: candidates, currentCandidate } = useSelector(state => state.candidates);
  const { isCollectingMissingInfo, missingFields } = useSelector(state => state.ui);
  const { 
    isActive: isInterviewActive,
    currentQuestion,
    currentQuestionIndex,
    timeRemaining,
    questions,
    isPaused
  } = useSelector(state => state.interview);
  
  const [input, setInput] = useState('');
  const [currentMissingFieldIndex, setCurrentMissingFieldIndex] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const initialMessageSentRef = useRef(false);
  const questionSentRef = useRef(false);

  const candidate = candidates.find(c => c.id === currentCandidate);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getBotMessageForMissingField = (field) => {
    const fieldNames = {
      name: 'your full name',
      email: 'your email address',
      phone: 'your phone number'
    };
    
    return `Hi there! 👋 I couldn't find ${fieldNames[field]} in your resume. Could you please provide ${fieldNames[field]}? This helps me personalize your interview experience! ✨`;
  };

  const sendBotMessageWithTyping = useCallback(async (candidateId, content, delay = 1500) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, delay));
    setIsTyping(false);
    
    const message = {
      type: 'bot',
      content,
      timestamp: new Date().toISOString()
    };
    
    dispatch(addChatMessage({ candidateId, message }));
  }, [dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [candidate?.chatHistory]);

  useEffect(() => {
    if (isCollectingMissingInfo && missingFields.length > 0 && candidate && !initialMessageSentRef.current) {
      // Start collecting missing information with typing effect
      const field = missingFields[0];
      const content = getBotMessageForMissingField(field);
      sendBotMessageWithTyping(candidate.id, content, 1000);
      
      initialMessageSentRef.current = true;
    }
    
    // Reset the flag when missing info collection is complete
    if (!isCollectingMissingInfo) {
      initialMessageSentRef.current = false;
    }
  }, [isCollectingMissingInfo, missingFields, candidate, sendBotMessageWithTyping]);

  // Handle interview questions
  useEffect(() => {
    if (isInterviewActive && currentQuestion && candidate && !questionSentRef.current) {
      const difficultyEmoji = {
        easy: '🟢',
        medium: '🟡', 
        hard: '🔴'
      };
      
      const questionMessage = `${difficultyEmoji[currentQuestion.difficulty]} **Question ${currentQuestionIndex + 1} of 6** (${currentQuestion.difficulty.toUpperCase()})

📝 **${currentQuestion.text}**

⏰ Time limit: ${formatTime(currentQuestion.timeLimit)}
💡 Think carefully and provide a detailed answer!`;

      sendBotMessageWithTyping(candidate.id, questionMessage, 1500);
      setQuestionStartTime(Date.now());
      questionSentRef.current = true;
    }
  }, [isInterviewActive, currentQuestion, candidate, currentQuestionIndex, sendBotMessageWithTyping]);

  // Timer countdown
  useEffect(() => {
    if (isInterviewActive && !isPaused && timeRemaining > 0) {
      const timer = setInterval(() => {
        dispatch(updateTimer(timeRemaining - 1));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isInterviewActive, isPaused, timeRemaining, dispatch]);

  // Handle time up or question progression
  useEffect(() => {
    if (timeRemaining === 0 && isInterviewActive && currentQuestion && candidate) {
      // Time's up, auto-submit empty answer and move to next
      const responseTime = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : currentQuestion.timeLimit;
      
      const answerData = {
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        difficulty: currentQuestion.difficulty,
        answer: '(No answer provided - Time expired)',
        timeLimit: currentQuestion.timeLimit,
        timeTaken: responseTime,
        timeExpired: true,
        answeredAt: new Date().toISOString()
      };

      // Add answer to candidate's record
      dispatch(addAnswer({
        candidateId: candidate.id,
        answer: answerData
      }));

      // Reset question sent flag for next question
      questionSentRef.current = false;

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

        const completionMessage = `🎊 **Congratulations! Interview Complete!** 🎊

Thank you for taking the time to complete this technical interview! 

📊 **Your Results:**
🎯 **Final Score:** ${finalScore}/100
📝 **AI Assessment:** ${aiSummary}

✅ Your results have been recorded and will be reviewed by our team.
📧 We'll be in touch soon with next steps!

🌟 Thank you for your interest and best of luck! 🍀`;

        sendBotMessageWithTyping(candidate.id, completionMessage, 2500);

        dispatch(updateCandidate({
          id: candidate.id,
          updates: { status: 'completed' }
        }));
      } else {
        // Move to next question
        dispatch(nextQuestion());
        
        sendBotMessageWithTyping(candidate.id, "⏰ Time's up! No worries - let's move on to the next question... 🚀", 1000);
      }
    }
  }, [timeRemaining, isInterviewActive, currentQuestion, candidate, currentQuestionIndex, questions.length, questionStartTime, dispatch, sendBotMessageWithTyping]);

  const handleSendMessage = () => {
    if (!input.trim() || !candidate) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    dispatch(addChatMessage({
      candidateId: candidate.id,
      message: userMessage
    }));

    // Process the input based on current state
    if (isCollectingMissingInfo) {
      handleMissingFieldInput(input.trim());
    } else if (isInterviewActive && currentQuestion) {
      handleInterviewAnswer(input.trim(), false);
    }

    setInput('');
  };

  const handleInterviewAnswer = (answer, timeExpired) => {
    if (!candidate || !currentQuestion) return;

    const responseTime = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : currentQuestion.timeLimit;
    
    const answerData = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      difficulty: currentQuestion.difficulty,
      answer: answer || '(No answer provided)',
      timeLimit: currentQuestion.timeLimit,
      timeTaken: responseTime,
      timeExpired,
      answeredAt: new Date().toISOString()
    };

    // Add answer to candidate's record
    dispatch(addAnswer({
      candidateId: candidate.id,
      answer: answerData
    }));

    // Reset question sent flag for next question
    questionSentRef.current = false;

    // Check if this was the last question
    if (currentQuestionIndex >= questions.length - 1) {
      // Interview completed
      dispatch(endInterview());

      // Calculate final score and generate summary
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
        content: `🎉 **Interview Complete!**\n\nThank you for completing the interview!\n\n**Final Score:** ${finalScore}/100\n\n**Summary:** ${aiSummary}\n\nYour results have been recorded. Good luck!`,
        timestamp: new Date().toISOString()
      };

      dispatch(addChatMessage({
        candidateId: candidate.id,
        message: completionMessage
      }));

      dispatch(updateCandidate({
        id: candidate.id,
        updates: { status: 'completed' }
      }));
    } else {
      // Move to next question
      dispatch(nextQuestion());
      
      const transitionMsg = timeExpired 
        ? "⏰ Time's up! No worries, let's continue with the next question... 🚀" 
        : "✅ Excellent! Great answer! Let's move on to the next question... 💫";
        
      sendBotMessageWithTyping(candidate.id, transitionMsg, 1200);
    }
  };

  const handleMissingFieldInput = (inputValue) => {
    const currentField = missingFields[currentMissingFieldIndex];
    let isValid = true;
    let errorMessage = '';

    // Validate input based on field type
    switch (currentField) {
      case 'name':
        if (inputValue.length < 2) {
          isValid = false;
          errorMessage = 'Please provide a valid name with at least 2 characters.';
        }
        break;
      case 'email':
        if (!validateEmail(inputValue)) {
          isValid = false;
          errorMessage = 'Please provide a valid email address (e.g., john@example.com).';
        }
        break;
      case 'phone':
        if (!validatePhone(inputValue)) {
          isValid = false;
          errorMessage = 'Please provide a valid phone number (e.g., (555) 123-4567).';
        }
        break;
    }

    if (!isValid) {
      // Send error message with typing effect
      sendBotMessageWithTyping(candidate.id, `❌ Oops! ${errorMessage}`, 800);
      return;
    }

    // Update candidate with the field value
    const updates = {};
    if (currentField === 'phone') {
      updates[currentField] = formatPhone(inputValue);
    } else {
      updates[currentField] = inputValue;
    }

    dispatch(updateCandidate({
      id: candidate.id,
      updates
    }));

    // Check if there are more missing fields
    const nextIndex = currentMissingFieldIndex + 1;
    if (nextIndex < missingFields.length) {
      setCurrentMissingFieldIndex(nextIndex);
      const nextField = missingFields[nextIndex];
      const nextFieldMessage = getBotMessageForMissingField(nextField);
      sendBotMessageWithTyping(candidate.id, nextFieldMessage, 1200);
    } else {
      // All fields collected, start interview
      const completeBotMessage = `🎉 Perfect! Thank you ${candidate.name || inputValue}! Now I have all the information I need.

🚀 I'll be conducting a technical interview for a **Full Stack Developer** position. 

📋 **Interview Structure:**
🟢 2 Easy questions (20 seconds each)
🟡 2 Medium questions (60 seconds each)  
🔴 2 Hard questions (120 seconds each)

⏰ Each question will have a timer, and if time runs out, we'll automatically move to the next question. 

✨ Take your time to think and provide detailed answers. Good luck! 🍀`;

      sendBotMessageWithTyping(candidate.id, completeBotMessage, 2000);

      // Reset missing fields state
      dispatch(setCollectingMissingInfo(false));
      dispatch(setMissingFields([]));
      setCurrentMissingFieldIndex(0);

      // Update candidate status
      dispatch(updateCandidate({
        id: candidate.id,
        updates: { status: 'ready-for-interview' }
      }));
    }
  };

  const startInterviewProcess = () => {
    if (!candidate) return;

    dispatch(startInterview({ candidateId: candidate.id }));
    dispatch(updateCandidate({
      id: candidate.id,
      updates: { status: 'in-progress' }
    }));

    sendBotMessageWithTyping(candidate.id, '🎯 Excellent! Let\'s begin your technical interview. Here comes your first question...', 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!candidate) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center p-8 max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
            <User className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Welcome to AI Interview! 🎯</h3>
          <p className="text-gray-600 mb-4">Ready to showcase your skills? Upload your resume to get started with your personalized technical interview.</p>
          <div className="text-sm text-gray-500 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Interactive questions</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Real-time scoring</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Instant feedback</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Chat Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">{candidate.name || 'Candidate'}</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  candidate.status === 'completed' ? 'bg-green-500' :
                  candidate.status === 'in-progress' ? 'bg-blue-500 animate-pulse' :
                  candidate.status === 'ready-for-interview' ? 'bg-yellow-500' : 'bg-gray-400'
                }`}></div>
                <p className="text-sm text-gray-600 font-medium">
                  {candidate.status === 'pending' ? 'Collecting Information' : 
                   candidate.status === 'ready-for-interview' ? 'Ready for Interview' :
                   candidate.status === 'in-progress' ? 'Interview in Progress' : 
                   candidate.status === 'completed' ? 'Interview Completed' :
                   candidate.status}
                </p>
              </div>
            </div>
          </div>
          {candidate.status === 'ready-for-interview' && !isInterviewActive && (
            <button
              onClick={startInterviewProcess}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              🚀 Start Interview
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 chat-scrollbar">
        {candidate.chatHistory?.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`max-w-xs lg:max-w-md relative ${
                message.type === 'user' ? 'order-2' : 'order-1'
              }`}
            >
              <div
                className={`px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-4'
                    : 'bg-white/90 text-gray-800 mr-4 border border-gray-200/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.type === 'bot' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                      message.type === 'user' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
              {/* Message tail */}
              <div
                className={`absolute top-4 w-4 h-4 transform rotate-45 ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 -left-2'
                    : 'bg-white/90 -right-2 border-r border-b border-gray-200/50'
                }`}
              ></div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-xs lg:max-w-md relative mr-4">
              <div className="px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm bg-white/90 text-gray-800 border border-gray-200/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md animate-pulse">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
              <div className="absolute top-4 w-4 h-4 transform rotate-45 bg-white/90 -right-2 border-r border-b border-gray-200/50"></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Timer Display (during interview) */}
      {isInterviewActive && currentQuestion && (
        <div className="border-t bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50 px-6 py-4 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                  {currentQuestionIndex + 1}
                </div>
                <span className="font-semibold text-gray-700 text-sm">
                  of {questions.length} questions
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                currentQuestion.difficulty === 'easy' ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' :
                currentQuestion.difficulty === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                'bg-gradient-to-r from-red-500 to-pink-600 text-white'
              }`}>
                ⚡ {currentQuestion.difficulty.toUpperCase()}
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-lg ${
              timeRemaining <= 10 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse' 
                : timeRemaining <= 30
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
            }`}>
              <Clock className={`h-5 w-5 ${timeRemaining <= 10 ? 'animate-spin' : ''}`} />
              <span className="text-lg font-mono">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-white/80 backdrop-blur-sm p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isCollectingMissingInfo 
                    ? `✨ Enter your ${missingFields[currentMissingFieldIndex]}...`
                    : isInterviewActive 
                    ? "💭 Type your answer here..."
                    : "💬 Type your message..."
                }
                className="w-full px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-gray-800 placeholder-gray-500 shadow-sm"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {input.trim() && (
                  <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {input.trim().split(' ').length} words
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className={`px-6 py-4 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                isInterviewActive 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          
          {isInterviewActive && timeRemaining <= 10 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl animate-pulse">
              <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                ⚠️ Time is running out! Answer will auto-submit in {timeRemaining} seconds.
              </p>
            </div>
          )}
          
          {isInterviewActive && (
            <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Press Enter to submit</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Take your time to think</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Be specific and detailed</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;