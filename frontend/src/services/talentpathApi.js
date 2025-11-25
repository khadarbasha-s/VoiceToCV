/**
 * TalentPath API Service
 * Handles all API calls to the TalentPath backend
 */

const API_BASE = '/api/talentpath';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// ==================== USER PROFILE ====================
export const getUserProfile = async () => {
  const response = await fetch(`${API_BASE}/profile/`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

export const updateUserProfile = async (profileData) => {
  const response = await fetch(`${API_BASE}/profile/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData)
  });
  return response.json();
};

export const createResume = async (cvData, fileUrl = '') => {
  const response = await fetch(`${API_BASE}/resume/create/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ cv_data: cvData, file_url: fileUrl })
  });
  return response.json();
};

// ==================== JOBS ====================
export const searchJobs = async (params = {}) => {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_BASE}/jobs/?${queryParams}`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

export const getJobDetails = async (jobId) => {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

export const getRecommendedJobs = async () => {
  const response = await fetch(`${API_BASE}/jobs/recommended/`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

export const getSimilarJobs = async (jobId) => {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/similar/`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

// ==================== APPLICATIONS ====================
export const applyToJob = async (jobId, coverLetter = '') => {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/apply/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ cover_letter: coverLetter })
  });
  return response.json();
};

export const getMyApplications = async (status = '') => {
  const url = status 
    ? `${API_BASE}/applications/?status=${status}`
    : `${API_BASE}/applications/`;
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  return response.json();
};

export const getApplicationDetail = async (applicationId) => {
  const response = await fetch(`${API_BASE}/applications/${applicationId}/`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

export const withdrawApplication = async (applicationId) => {
  const response = await fetch(`${API_BASE}/applications/${applicationId}/withdraw/`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return response.json();
};

// ==================== SAVED JOBS ====================
export const saveJob = async (jobId) => {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/save/`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  return response.json();
};

export const unsaveJob = async (jobId) => {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/unsave/`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return response.json();
};

export const getSavedJobs = async () => {
  const response = await fetch(`${API_BASE}/saved-jobs/`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

// ==================== NOTIFICATIONS ====================
export const getNotifications = async (markRead = false) => {
  const url = markRead 
    ? `${API_BASE}/notifications/?mark_read=true`
    : `${API_BASE}/notifications/`;
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  return response.json();
};

export const markNotificationRead = async (notificationId) => {
  const response = await fetch(`${API_BASE}/notifications/${notificationId}/read/`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  return response.json();
};

// ==================== DASHBOARD ====================
export const getUserDashboardStats = async () => {
  const response = await fetch(`${API_BASE}/dashboard/user/`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

export const getRecruiterDashboardStats = async () => {
  const response = await fetch(`${API_BASE}/dashboard/recruiter/`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

// ==================== RECRUITER ====================
export const createJob = async (jobData) => {
  const response = await fetch(`${API_BASE}/recruiter/jobs/create/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(jobData)
  });
  return response.json();
};

export const getRecruiterJobs = async () => {
  const response = await fetch(`${API_BASE}/recruiter/jobs/`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

export const getJobApplicants = async (jobId, status = '') => {
  const url = status 
    ? `${API_BASE}/recruiter/jobs/${jobId}/applicants/?status=${status}`
    : `${API_BASE}/recruiter/jobs/${jobId}/applicants/`;
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  return response.json();
};

export const updateApplicationStatus = async (applicationId, status, notes = '') => {
  const response = await fetch(`${API_BASE}/recruiter/applications/${applicationId}/update/`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, notes })
  });
  return response.json();
};

export default {
  getUserProfile,
  updateUserProfile,
  createResume,
  searchJobs,
  getJobDetails,
  getRecommendedJobs,
  getSimilarJobs,
  applyToJob,
  getMyApplications,
  getApplicationDetail,
  withdrawApplication,
  saveJob,
  unsaveJob,
  getSavedJobs,
  getNotifications,
  markNotificationRead,
  getUserDashboardStats,
  getRecruiterDashboardStats,
  createJob,
  getRecruiterJobs,
  getJobApplicants,
  updateApplicationStatus
};





