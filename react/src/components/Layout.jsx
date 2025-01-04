import React, { useEffect, useState } from 'react';
import { Outlet, Link } from "react-router-dom";
import axios from 'axios';
import logo from '../assets/logo.png'; // Ścieżka do logo

const Layout = () => {
  const [session, setSession] = useState({ loggedIn: false, userName: '' });

  useEffect(() => {
    const fetchSession = async () => {
      const response = await axios.get('http://localhost:8000/api/session', { withCredentials: true });
      setSession(response.data);
    };

    fetchSession();
  }, []);


  return (
    <>
      <header>
        <Link to="/">
          <button style={styles.button}>
            <img src={logo} alt="Logo" style={styles.logo} />
          </button>
        </Link>
        {session.loggedIn ? (
          <div>
            <span>Witaj, {session.userName}</span>
          </div>
        ) : (
          <span>Nie jesteś zalogowany</span>
        )}
      </header>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          {session.loggedIn ? (
            <React.Fragment>
              <li>
                <Link to="/profile">Profile</Link>
              </li>
              <li>
                <Link to="/settings">Settings</Link>
              </li>
              <li>
                <Link to="/newpost">New Post</Link>
              </li>
            </React.Fragment>
          ) : (
            <li>
              <Link to="/login">Login</Link>
            </li>
          )}
          {/* <li>
            <Link to="/register">Register</Link>
          </li> */}
        </ul>
      </nav>
      <Outlet />
    </>
  )
};

const styles = {
  button: {
    border: 'none',
    background: 'none',
    padding: 0,
    cursor: 'pointer',
  },
  logo: {
    height: '50px',
  }
};

export default Layout;