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
        const response = await axios.get('https://localhost/api/session', { withCredentials: true });
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
        const response = await axios.get('https://localhost/api/posts', { withCredentials: true });
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchSession();
  }, []);

  const handleDelete = async (postId) => {
    try {
      const response = await axios.delete(`https://localhost/api/posts/${postId}`, { withCredentials: true });
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
              <div className={`verification-badge ${post.verified ? 'verified' : 'unverified'}`}>
                {post.verified ? '✓ Verified Post' : '✗ Unverified Post'}
              </div>
              <h3>{post.userName}</h3>
              <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body) }}></p>
              {post.image && <img src={'https://localhost/' + post.image}  style={{ width: '400px', margin: '0 auto' }} alt="Post" className="post-image"/> }
              <p>
                <span style={{ color: 'red', fontWeight: 'bold' }}>FEELING: </span> 
                <span style={{ color: 'purple' }}>{post.mood}</span> {post.emoji}
              </p>
              <p>{new Date(post.timestamp).toLocaleString()}</p>
              {post.userName === userName && (
                <button onClick={() => handleDelete(post.id)}>Delete</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;