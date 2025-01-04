import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/api/login', { email, password, token }, { withCredentials: true });
      if (res.status === 200) {
        window.location.href = '/';
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data);
      } else if (error.response && error.response.status === 401) {
        alert(error.response.data);
      } else {
        alert('Błąd logowania: ' + error.message);
      }
      console.error(error);
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
        <Link to="/register">Nie masz konta? Zarejestruj się!</Link>
      </form>
    </div>
  );
};

export default Login;