import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./components/Home";
import GetAllUser from "./components/GetAllUser";
import Register from "./components/Register";
import Login from "./components/Login";
import Profile from "./components/Profile";
import NewPost from "./components/NewPost";
import ResetPass from "./components/ResetPass";
import UserSettings from "./components/UserSettings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="get" element={<GetAllUser />} />
        <Route path="register" element={<Register />} />
        <Route path="login" element={<Login />} />
        <Route path="profile" element={<Profile />} />
        <Route path="newpost" element={<NewPost />} />
        <Route path="reset" element={<ResetPass />} />
        <Route path="settings" element={<UserSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);