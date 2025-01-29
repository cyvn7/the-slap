import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://localhost',
  withCredentials: true,
  headers: {
    'x-api-key': import.meta.env.VITE_API_KEY,
    'User-Agent': 'TheSlap/1.0',
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  console.log('Request:', {
    url: config.url,
    method: config.method,
    headers: config.headers,
    data: config.data
  });
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('Response:', response);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    return Promise.reject(error);
  }
);

export default apiClient;