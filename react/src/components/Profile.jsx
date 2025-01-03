import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Profile = () => {
  const [user, setUser] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      const response = await axios.get('http://localhost:8000/api/session', { withCredentials: true });
      if (response.data.loggedIn) {
        setUser({ name: response.data.userName });
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await axios.post('http://localhost:8000/api/logout', {}, { withCredentials: true });
    setUser({});
    window.location.href = '/login';
  };

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      {user.name ? (
        <div>
          <p>Name: {user.name}</p>
          <button onClick={handleLogout}>Wyloguj się</button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Profile;