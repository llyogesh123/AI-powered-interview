// API service for frontend integration
// Force production URL since environment variables aren't loading correctly
const API_BASE_URL = 'https://ai-powered-interview-6gw7.onrender.com/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log('Making API request to:', url);
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication APIs
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Candidate APIs
  async uploadResume(file) {
    const formData = new FormData();
    formData.append('resume', file);

    return this.request('/candidates', {
      method: 'POST',
      headers: {}, // Remove Content-Type header for FormData
      body: formData,
    });
  }

  async getCandidates(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/candidates${queryString ? `?${queryString}` : ''}`);
  }

  async getCandidate(id) {
    return this.request(`/candidates/${id}`);
  }

  async updateCandidate(id, updates) {
    return this.request(`/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async addChatMessage(candidateId, message) {
    return this.request(`/candidates/${candidateId}/chat`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async addAnswer(candidateId, answer) {
    return this.request(`/candidates/${candidateId}/answers`, {
      method: 'POST',
      body: JSON.stringify(answer),
    });
  }

  async startInterview(candidateId) {
    return this.request(`/candidates/${candidateId}/start-interview`, {
      method: 'POST',
    });
  }

  async completeInterview(candidateId, data) {
    return this.request(`/candidates/${candidateId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Question APIs
  async getQuestions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/questions${queryString ? `?${queryString}` : ''}`);
  }

  async getRandomQuestions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/questions/random${queryString ? `?${queryString}` : ''}`);
  }

  async createQuestion(questionData) {
    return this.request('/questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  }

  async updateQuestion(id, updates) {
    return this.request(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteQuestion(id) {
    return this.request(`/questions/${id}`, {
      method: 'DELETE',
    });
  }

  // Interview Session APIs
  async getInterviews(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/interviews${queryString ? `?${queryString}` : ''}`);
  }

  async getInterview(id) {
    return this.request(`/interviews/${id}`);
  }

  async createInterview(interviewData) {
    return this.request('/interviews', {
      method: 'POST',
      body: JSON.stringify(interviewData),
    });
  }

  async startInterviewSession(id) {
    return this.request(`/interviews/${id}/start`, {
      method: 'PUT',
    });
  }

  async pauseInterview(id) {
    return this.request(`/interviews/${id}/pause`, {
      method: 'PUT',
    });
  }

  async resumeInterview(id) {
    return this.request(`/interviews/${id}/resume`, {
      method: 'PUT',
    });
  }

  async completeInterviewSession(id, data) {
    return this.request(`/interviews/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async nextQuestion(id) {
    return this.request(`/interviews/${id}/next-question`, {
      method: 'PUT',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new ApiService();