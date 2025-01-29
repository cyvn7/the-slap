import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../index.css'; // Import stylów CSS
import apiClient from '../auth.js';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: ''});
  const navigate = useNavigate();
  const [passwordValidations, setPasswordValidations] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  const validatePassword = (password) => {
    const validations = {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasMinLength: password.length >= 8,
    };
    setPasswordValidations(validations);
    return Object.values(validations).every(Boolean);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert('Hasła nie są zgodne');
      return;
    }
    if (!validatePassword(form.password)) {
      alert('Hasło nie spełnia wymagań');
      return;
    }
    try {
      console.log("form");
      const res = await apiClient.post('/api/register', form);
      console.log("data: " + res.data.qrUrl);
      if (res.data.qrUrl) {
        navigate('/twofa', { 
          state: { qrUrl: res.data.qrUrl },
          replace: true 
        });
      } else {
        console.error("No QR URL in response");
      }
    } catch (error) {
      console.error(error.res);
      alert(error.response.data);
    }
  };

  return (
    <form onSubmit={onSubmit} className="form">
      <h1>Rejestracja</h1>
      <input
        type="text"
        placeholder="Username"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="input"
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="input"
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => {
          setForm({ ...form, password: e.target.value });
          validatePassword(e.target.value);
        }}
        className="input"
      />
      <input
        type="password"
        placeholder="Repeat Password"
        value={form.confirmPassword}
        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        className="input"
      />
      <div className="validation">
        <p style={{ color: passwordValidations.hasUpperCase ? 'green' : 'gray' }}>At least one big letter</p>
        <p style={{ color: passwordValidations.hasLowerCase ? 'green' : 'gray' }}>At least one small letter</p>
        <p style={{ color: passwordValidations.hasNumber ? 'green' : 'gray' }}>At least one number</p>
        <p style={{ color: passwordValidations.hasSpecialChar ? 'green' : 'gray' }}>At least one special character</p>
        <p style={{ color: passwordValidations.hasMinLength ? 'green' : 'gray' }}>At least 8 characters</p>
      </div>
      <button type="submit" disabled={!Object.values(passwordValidations).every(Boolean)} className="button">Register</button>
    </form>
  );
}