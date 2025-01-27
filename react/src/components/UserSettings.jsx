import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserSettings = () => {
  const [session, setSession] = useState({ loggedIn: false, userName: '', userIp: '', userAgent: '' });
  const [loginHistory, setLoginHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('https://localhost/api/session', { withCredentials: true });
        
        if (!response.data.loggedIn) {
          navigate('/login');
          return;
        }

        setSession(response.data);
        const historyResponse = await axios.get('https://localhost/api/login-history', { withCredentials: true });
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
    await axios.post('https://localhost/api/logout', {}, { withCredentials: true });
    setSession({ loggedIn: false, userName: '', userIp: '', userAgent: '' });
    window.location.href = '/login';
  };

  const handleAccountDeletion = async () => {
    if (window.confirm('Are you sure you want to delete your account?')) {
      const userId = session.userId;
      await axios.delete(`https://localhost/api/user/${userId}`, { withCredentials: true });
      setSession({ loggedIn: false, userName: '', userIp: '', userAgent: '' });
      window.location.href = '/login';
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }


  if (!session.loggedIn) {
    return <p>Nie jesteś zalogowany</p>;
  }

  return (
    <div className="profile-container">
      <button onClick={handleLogout}>Wyloguj się</button>       
      <button onClick={() => window.location.href = '/reset'}>Zmień hasło</button>
      <button onClick={handleAccountDeletion}>Usuń konto</button>
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