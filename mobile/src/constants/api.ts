// API Configuration
// Update this to your production URL when deploying
export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:5000' // Android emulator localhost
  : 'https://pally-predict-production.up.railway.app';

export const API_ENDPOINTS = {
  // Mobile Auth (JWT-based)
  mobile: {
    auth: `${API_BASE_URL}/api/mobile/auth`,
    register: `${API_BASE_URL}/api/mobile/register`,
    me: `${API_BASE_URL}/api/mobile/me`,
    submitVote: `${API_BASE_URL}/api/mobile/votes`,
    getVote: (questionId: string) => `${API_BASE_URL}/api/mobile/votes/${questionId}`,
  },
  // Questions
  questions: {
    active: `${API_BASE_URL}/api/questions/active`,
    recent: `${API_BASE_URL}/api/questions/recent`,
    byId: (id: string) => `${API_BASE_URL}/api/questions/${id}`,
    liveStats: (id: string) => `${API_BASE_URL}/api/questions/${id}/live-stats`,
    activity: (id: string) => `${API_BASE_URL}/api/questions/${id}/activity`,
  },
  // Users
  users: {
    me: `${API_BASE_URL}/api/user/me`,
    profile: `${API_BASE_URL}/api/user/profile`,
    setUsername: `${API_BASE_URL}/api/user/username`,
    byId: (id: string) => `${API_BASE_URL}/api/users/${id}`,
  },
  // Votes (for public endpoints)
  votes: {
    submit: `${API_BASE_URL}/api/votes`,
    myVote: (questionId: string) => `${API_BASE_URL}/api/votes/my/${questionId}`,
  },
  // Leaderboard
  leaderboard: `${API_BASE_URL}/api/leaderboard`,
};
