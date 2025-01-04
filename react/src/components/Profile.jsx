import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Profile = () => {
  const [session, setSession] = useState({ loggedIn: false, userName: '', userIp: '', userAgent: '' });
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchSession = async () => {
      const response = await axios.get('http://localhost:8000/api/session', { withCredentials: true });
      setSession(response.data);

      if (response.data.loggedIn) {
        fetchUserPosts();
      }
    };

    const fetchUserPosts = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/user/posts', { withCredentials: true });
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching user posts:', error);
      }
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
      <h3>Your Posts</h3>
      <div className="posts-container">
        {posts.map(post => (
              <div key={post.id} className="post">
              <p>{post.body}</p>
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