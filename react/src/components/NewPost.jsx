import React, { useState, useEffect, useRef } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import axios from 'axios';
import './styles/NewPost.css';

const NewPost = () => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [emoji, setEmoji] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [userName, setUserName] = useState('');
  const editorRef = useRef(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedContent = editorRef.current.innerHTML;
    console.log('Post created:', formattedContent);
    if (!formattedContent || !mood || !emoji) {
      alert('All fields are required.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:8000/api/newpost', {
        body: formattedContent,
        mood: mood,
        emoji: emoji
      }, { withCredentials: true });
      if (response.status === 200) {
        alert('Post created successfully');
        // setContent('');
        // setMood('');
        // setEmoji('');
        //editorRef.current.innerHTML = '';
        //UNCOMMMENT THESE AFTER TESTING
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post ' + error);
    }
  };

  return (
    <div className="new-post-container">
      <div className="profile-section">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4O0RahPrACF4b_XrVTSVyy6Tet41wmZWHMg&s" alt="Profile" className="profile-picture" />
        <span className="profile-name">{userName}</span>
      </div>
      <h2>Create a New Post</h2>
      <div className="editor-toolbar">
        <button type="button" onClick={handleBold}><b>B</b></button>
        <button type="button" onClick={handleItalic}><i>I</i></button>
        <button type="button" onClick={handleUnderline}><u>U</u></button>
        <button type="button">Attach Image</button>
      </div>
      <div
        contentEditable
        className="text-editor"
        ref={editorRef}
        onInput={(e) => setContent(e.currentTarget.innerHTML)}
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
            <button type="button" onClick={() => setShowPicker(true)}>Select Emoji</button>
          )}
        </div>
        {showPicker && (
          <div className="emoji-picker">
            <Picker data={data} onEmojiSelect={handleEmojiSelect} />
          </div>
        )}
      </div>
      <button className="submit-button" onClick={handleSubmit}>Post</button>
    </div>
  );
};

export default NewPost;