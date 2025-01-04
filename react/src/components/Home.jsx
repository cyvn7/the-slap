import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/Home.css';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [posts, setPosts] = useState([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/session', { withCredentials: true });
        setIsLoggedIn(response.data.loggedIn);
        setUserName(response.data.userName);
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

  const handleDelete = async (postId) => {
    try {
      const response = await axios.delete(`http://localhost:8000/api/posts/${postId}`, { withCredentials: true });
      if (response.status === 200) {
        setPosts(posts.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <h1>Posts</h1>
          <div className="posts-container">
            {posts.map(post => (
              <div key={post.id} className="post">
                <h3>{post.userName}</h3>
                <p>{post.body}</p>
                <p style={{ color: 'red' }}>FEELING: <span style={{ color: 'purple', fontWeight: 'bold' }}>{post.mood}</span> {post.emoji}</p>
                <p>{new Date(post.timestamp).toLocaleString()}</p>
                {post.userName === userName && (
                  <button onClick={() => handleDelete(post.id)}>Delete</button>
                )}
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