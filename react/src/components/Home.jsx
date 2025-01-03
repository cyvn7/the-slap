import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/session', { withCredentials: true });
        setIsLoggedIn(response.data.loggedIn);
        if (response.data.loggedIn) {
          fetchPosts();
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/posts', { withCredentials: true });
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchSession();
  }, []);

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <h1>You are logged in</h1>
          <div className="posts-container">
            {posts.map(post => (
              <div key={post.id} className="post">
                <h3>{post.userName}</h3>
                <p>{post.body}</p>
                <p>Mood: {post.mood} {post.emoji}</p>
                <p>{new Date(post.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
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