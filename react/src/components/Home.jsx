import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
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
    <div className="home-container">
      <h1>Welcome, {userName}</h1>
      {isLoggedIn && (
        <div className="posts-container">
          {posts.map(post => (
            <div key={post.id} className="post">
              <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body) }}></p>
              <p>
                <span style={{ color: 'red' }}>FEELING: </span> 
                <span style={{ color: 'purple' }}>{post.mood}</span> {post.emoji}
              </p>
              <p>{new Date(post.timestamp).toLocaleString()}</p>
              <button onClick={() => handleDelete(post.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;