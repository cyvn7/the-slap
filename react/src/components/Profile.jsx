import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Profile = () => {
  const [session, setSession] = useState({ loggedIn: false, userName: '', userIp: '', userAgent: '' });

  useEffect(() => {
    const fetchSession = async () => {
      const response = await axios.get('http://localhost:8000/api/session', { withCredentials: true });
      setSession(response.data);
    };

    fetchSession();
  }, []);

  const handleLogout = async () => {
    await axios.post('http://localhost:8000/api/logout', {}, { withCredentials: true });
    setSession({ loggedIn: false, userName: '', userIp: '', userAgent: '' });
    window.location.href = '/login';
  };

  if (!session.loggedIn) {
    return <p>Nie jesteś zalogowany</p>;
  }

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      <p>Name: {session.userName}</p>
      <p>IP Address: {session.userIp}</p>
      <p>Browser: {session.userAgent}</p>
      <button onClick={handleLogout}>Wyloguj się</button>
    </div>
  );
};

export default Profile;