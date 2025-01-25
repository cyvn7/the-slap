import { useState } from 'react';
import axios from 'axios';
import '../index.css'; // Import stylów CSS

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: ''});
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
      const res = await axios.post('https://localhost/api/register', form);
      alert(`Zarejestrowano: ${JSON.stringify(res.data)}`);
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
        placeholder="Nazwa użytkownika"
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
        placeholder="Hasło"
        value={form.password}
        onChange={(e) => {
          setForm({ ...form, password: e.target.value });
          validatePassword(e.target.value);
        }}
        className="input"
      />
      <input
        type="password"
        placeholder="Potwierdź hasło"
        value={form.confirmPassword}
        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        className="input"
      />
      <div className="validation">
        <p style={{ color: passwordValidations.hasUpperCase ? 'green' : 'gray' }}>Duża litera</p>
        <p style={{ color: passwordValidations.hasLowerCase ? 'green' : 'gray' }}>Mała litera</p>
        <p style={{ color: passwordValidations.hasNumber ? 'green' : 'gray' }}>Cyfra</p>
        <p style={{ color: passwordValidations.hasSpecialChar ? 'green' : 'gray' }}>Znak specjalny</p>
        <p style={{ color: passwordValidations.hasMinLength ? 'green' : 'gray' }}>Minimum 8 znaków</p>
      </div>
      <button type="submit" disabled={!Object.values(passwordValidations).every(Boolean)} className="button">Zarejestruj</button>
    </form>
  );
}