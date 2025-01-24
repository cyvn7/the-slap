import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Profile = () => {
  const [session, setSession] = useState({ loggedIn: false, userName: '', userIp: '', userAgent: '' });
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchSession = async () => {
      const response = await axios.get('https://localhost/api/session', { withCredentials: true });
      setSession(response.data);

      if (response.data.loggedIn) {
        fetchUserPosts();
      }
    };

    const fetchUserPosts = async () => {
      try {
        const response = await axios.get('https://localhost/api/user/posts', { withCredentials: true });
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching user posts:', error);
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