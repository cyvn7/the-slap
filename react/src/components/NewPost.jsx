import React, { useState, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import axios from 'axios';
import './NewPost.css';

const NewPost = () => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [emoji, setEmoji] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/session', { withCredentials: true });
        if (response.data.loggedIn) {
          setUserName(response.data.userName);
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
      }
    };

    fetchSession();
  }, []);

  const handleEmojiSelect = (selectedEmoji) => {
    setEmoji(selectedEmoji.native);
    setShowPicker(false);
  };

  const handleBold = () => {
    document.execCommand('bold');
  };

  const handleItalic = () => {
    document.execCommand('italic');
  };

  const handleUnderline = () => {
    document.execCommand('underline');
  };

  return (
    <div className="new-post-container">
      <div className="profile-section">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4O0RahPrACF4b_XrVTSVyy6Tet41wmZWHMg&s" alt="Profile" className="profile-picture" />
        <span className="profile-name">{userName}</span>
      </div>
      <h2>Create a New Post</h2>
      <div className="editor-toolbar">
        <button onClick={handleBold}><b>B</b></button>
        <button onClick={handleItalic}><i>I</i></button>
        <button onClick={handleUnderline}><u>U</u></button>
        <button>Attach Image</button>
      </div>
      <div
        contentEditable
        className="text-editor"
        onInput={(e) => setContent(e.currentTarget.textContent)}
      ></div>
      <div className="mood-container">
        <label htmlFor="mood" className="mood-label">FEELING:</label>
        <div className="mood-input-container">
          <input
            type="text"
            id="mood"
            value={mood}
            onChange={(e) => setMood(e.target.value.toUpperCase())}
            style={{ textTransform: 'uppercase' }}
          />
          {emoji ? (
            <span
              style={{ fontSize: '1.5rem', cursor: 'pointer', marginLeft: '10px' }}
              onClick={() => setShowPicker(true)}
            >
              {emoji}
            </span>
          ) : (
            <button onClick={() => setShowPicker(true)}>Select Emoji</button>
          )}
        </div>
        {showPicker && (
          <div className="emoji-picker">
            <Picker data={data} onEmojiSelect={handleEmojiSelect} />
          </div>
        )}
      </div>
      <button className="submit-button">Post</button>
    </div>
  );
};

export default NewPost;