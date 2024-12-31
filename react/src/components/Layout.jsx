import { Outlet, Link } from "react-router-dom";
import logo from '../assets/logo.png'; // Ścieżka do logo

const Layout = () => {
  return (
    <>
      <header>
        <Link to="/">
          <button style={styles.button}>
            <img src={logo} alt="Logo" style={styles.logo} />
          </button>
        </Link>
      </header>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/post">Post User</Link>
          </li>
          <li>
            <Link to="/get">Get All User</Link>
          </li>
          <li>
            <Link to="/register">Register</Link>
          </li>
          <li>
            <Link to="/login">Login</Link>
          </li>
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