import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiClient from '../auth.js';

const UserSettings = () => {
  const [session, setSession] = useState({ loggedIn: false, userName: '', userIp: '', userAgent: '' });
  const [loginHistory, setLoginHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/api/session');
        
        if (!response.data.loggedIn) {
          navigate('/login');
          return;
        }

        setSession(response.data);
        const historyResponse = await apiClient.get('/api/login-history');
        setLoginHistory(historyResponse.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await apiClient.post('/api/logout');
    setSession({ loggedIn: false, userName: '', userIp: '', userAgent: '' });
    window.location.href = '/login';
  };

  const handleAccountDeletion = async () => {
    if (window.confirm('Are you sure you want to delete your account?')) {
      const userId = session.userId;
      await apiClient.delete(`/api/user/${userId}`);
      setSession({ loggedIn: false, userName: '', userIp: '', userAgent: '' });
      window.location.href = '/login';
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }


  if (!session.loggedIn) {
    return <p>You are not logged in</p>;
  }

  return (
    <div className="profile-container">
      <button onClick={handleLogout}>Sign out</button>       
      <button onClick={() => window.location.href = '/reset'}>Change password</button>
      <button onClick={handleAccountDeletion}>Delete your account</button>
      <h1>Settings</h1>
      <h2>Logged in as:</h2>
      <p>Name: {session.userName}</p>
      <p>IP Address: {session.userIp}</p>
      <p>Browser: {session.userAgent}</p>
      <h2>Login History:</h2>
      <div className="posts-container">
        {loginHistory.map(login => (
          <div key={login.id} className="post" style={{ color: login.success ? 'green' : 'red' }}>
            <p>{login.ip_address}</p>
            <p>{login.user_agent}</p>
            <p>{new Date(login.attempt_time).toLocaleString()}</p>
            <p>{login.success ? 'Success' : 'Failed'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSettings;