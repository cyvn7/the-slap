import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import apiClient from '../auth.js';

const Profile = () => {
  const [session, setSession] = useState({ loggedIn: false, userName: '', userIp: '', userAgent: '' });
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);       
  const navigate = useNavigate();
  
  const fetchUserPosts = async () => {
    try {
      const response = await apiClient.get(`/api/user/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await apiClient.get('/api/session');
        setSession(response.data);
        if (response.data.loggedIn) {
          fetchUserPosts();
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        navigate('/login');
      }
    };

    fetchSession();
  }, [navigate]);

  const handleDelete = async (postId) => {
    try {
      const response = await apiClient.delete(`/api/posts/${postId}`);
      if (response.status === 200) {
        setPosts(posts.filter(post => post.id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!session.loggedIn) {
    return <p>You are not signed in</p>;
  }

  return (
    <div className="profile-container">
      <h3>Your Posts</h3>
      <div className="posts-container">
        {posts.map(post => (
              <div key={post.id} className="post">
              <p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body) }}></p>
              {post.image && <img src={'https://localhost/' + post.image}  style={{ width: '400px', margin: '0 auto' }} alt="Post" className="post-image"/> }
              <p style={{ color: 'red' }}>FEELING: <span style={{ color: 'purple', fontWeight: 'bold' }}>{post.mood}</span> {post.emoji}</p>
              <p>{new Date(post.timestamp).toLocaleString()}</p>
              <button onClick={() => handleDelete(post.id)}>Delete</button>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;