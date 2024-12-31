import { useState } from 'react';
import axios from 'axios';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: ''});

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/api/register', form);
      alert(`Zarejestrowano: ${JSON.stringify(res.data)}`);
    } catch (error) {
      console.error(error);
      alert('Błąd rejestracji');
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <h1>Rejestracja</h1>
      <input
        type="text"
        placeholder="Nazwa użytkownika"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Hasło"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <button type="submit">Zarejestruj</button>
    </form>
  );
}