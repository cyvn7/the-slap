import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/session', { withCredentials: true });
        setIsLoggedIn(response.data.loggedIn);
      } catch (error) {
        console.error('Error fetching session data:', error);
      }
    };

    fetchSession();
  }, []);

  return (
    <div>
      {isLoggedIn ? (
        <h1>You are logged in</h1>
      ) : (
        <div>
          <h1>You are not logged in</h1>
          <button onClick={() => window.location.href = '/login'}>Go to Login Page</button>
        </div>
      )}
    </div>
  );
};

export default Home;