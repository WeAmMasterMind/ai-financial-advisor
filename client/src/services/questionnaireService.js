import axios from 'axios';

const API_URL = '/api/questionnaire';

const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

const getStatus = async () => {
  const response = await axios.get(`${API_URL}/status`, {
    headers: getAuthHeader()
  });
  return response.data;
};

const saveProgress = async (step, data, allResponses) => {
  const response = await axios.post(
    `${API_URL}/save`,
    { step, data, allResponses },
    { headers: getAuthHeader() }
  );
  return response.data;
};

const completeQuestionnaire = async (responses) => {
  const response = await axios.post(
    `${API_URL}/complete`,
    { responses },
    { headers: getAuthHeader() }
  );
  return response.data;
};

const getResults = async () => {
  const response = await axios.get(`${API_URL}/results`, {
    headers: getAuthHeader()
  });
  return response.data;
};

const questionnaireService = {
  getStatus,
  saveProgress,
  completeQuestionnaire,
  getResults
};

export default questionnaireService;