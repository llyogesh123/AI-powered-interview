import React from 'react';
import { MessageSquare, Users } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import ChatInterface from './components/ChatInterface';
import InterviewerDashboard from './components/InterviewerDashboard';
import ResumeUpload from './components/ResumeUpload';
import { setActiveTab } from './store/uiSlice';

function App() {
  const dispatch = useDispatch();
  const { activeTab, showResumeUpload } = useSelector(state => state.ui);

  const tabs = [
    {
      id: 'interviewee',
      name: 'Interviewee',
      icon: MessageSquare,
      description: 'Chat & Interview'
    },
    {
      id: 'interviewer',
      name: 'Interviewer',
      icon: Users,
      description: 'Dashboard'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary-600">
                  AI Interview Assistant
                </h1>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => dispatch(setActiveTab(tab.id))}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div>{tab.name}</div>
                      <div className="text-xs opacity-75">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {activeTab === 'interviewee' ? (
          <div className="h-[calc(100vh-4rem)]">
            {showResumeUpload ? (
              <div className="flex items-center justify-center h-full">
                <ResumeUpload />
              </div>
            ) : (
              <div className="h-full">
                <ChatInterface />
              </div>
            )}
          </div>
        ) : (
          <InterviewerDashboard />
        )}
      </main>
    </div>
  );
}

export default App;
