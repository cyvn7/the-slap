import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./components/Home";
import Register from "./components/Register";
import Login from "./components/Login";
import Profile from "./components/Profile";
import NewPost from "./components/NewPost";
import ResetPass from "./components/ResetPass";
import UserSettings from "./components/UserSettings";
import TwoFactor from "./components/TwoFactor";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="register" element={<Register />} />
        <Route path="login" element={<Login />} />
        <Route path="profile" element={<Profile />} />
        <Route path="newpost" element={<NewPost />} />
        <Route path="reset" element={<ResetPass />} />
        <Route path="settings" element={<UserSettings />} />
        <Route path="twofa" element={<TwoFactor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);