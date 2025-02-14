import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../auth.js';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/api/login', {
        email,
        password,
        token
      });
      if (res.status === 200) {
        window.location.href = '/';
      }
    } catch (error) {
      const errorMessage = error.response?.data || error.message || 'Unknown error occurred';
      const statusCode = error.response?.status || 'Unknown';
      alert(`Error ${statusCode}: ${errorMessage}`);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="token">2FA Token:</label>
          <input
            type="text"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
        <Link to="/register">No account? Register!</Link>
      </form>
    </div>
  );
};

export default Login;