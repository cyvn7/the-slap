import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../index.css'; // Import stylów CSS
import apiClient from '../auth.js';

export default function ResetPass() {
    const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '', token: '' });
    const [passwordValidations, setPasswordValidations] = useState({
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false,
    });
    const [isLoggedIn, setIsLoggedIn] = useState(null); // Initialize as null to differentiate between loading and not logged in

    // useEffect(() => {
    //     const checkSession = async () => {
    //         try {
    //             const res = await axios.get('http://localhost:8000/api/session', { withCredentials: true });
    //             if (res.data.loggedIn) {
    //                 setIsLoggedIn(true);
    //                 console.log('Session:', res.data.loggedIn, isLoggedIn);
    //             } else {
    //                 setIsLoggedIn(false);
    //                 navigate('/login');
    //             }
    //         } catch (error) {
    //             console.error('Error checking session:', error);
    //             setIsLoggedIn(false);
    //             navigate('/login');
    //         }
    //     };

    //     checkSession();
    //     console.log('Session:', isLoggedIn);
    // }, []);

    useEffect(() => {
        const fetchSession = async () => {
            const response = await apiClient.get('/api/session');
            setIsLoggedIn(response.data.loggedIn);
        };

        fetchSession();
    }, []);

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
        if (form.newPassword !== form.confirmNewPassword) {
            alert('Passwords do not match');
            console.log('old: ', form.oldPassword, 'new: ', form.newPassword, 'confirm: ', form.confirmNewPassword);
            return;
        }
        if (!validatePassword(form.newPassword)) {
            alert('New password does not meet expectaions');
            return;
        }
        try {
            const res = await axios.post('http://localhost:8000/api/reset-password', form, { withCredentials: true });
            alert(`Password changed`);
        } catch (error) {
            alert('Error while resetting password: ' + error.response.data);
        }
    };

    if (isLoggedIn === null) {
        return <div>Loading...</div>;
    }

    if (!isLoggedIn) {
        return <div>Unauthorized</div>;
    }

    return (
        <div className="reset-pass-container">
            <h2>Resetuj Hasło</h2>
            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <input
                        type="password"
                        id="oldPassword"
                        value={form.oldPassword}
                        onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
                        required
                        className="input"
                        placeholder="Old Password"
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        placeholder="New Password"
                        value={form.password}
                        onChange={(e) => {
                            setForm({ ...form, newPassword: e.target.value });
                            validatePassword(e.target.value);
                        }}
                        className="input"
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        id="confirmNewPassword"
                        value={form.confirmNewPassword}
                        onChange={(e) => setForm({ ...form, confirmNewPassword: e.target.value })}
                        required
                        className="input"
                        placeholder="Confirm New Password"
                    />
                </div>
                <div className="form-group">
                    <input
                        type="text"
                        id="token"
                        value={form.twoFactorCode}
                        onChange={(e) => setForm({ ...form, twoFactorCode: e.target.value })}
                        required
                        className="input"
                        placeholder="2FA Code"
                    />
                </div>
                <div className="validation">
                    <p style={{ color: passwordValidations.hasUpperCase ? 'green' : 'gray' }}>At least one big letter</p>
                    <p style={{ color: passwordValidations.hasLowerCase ? 'green' : 'gray' }}>At least one small letter</p>
                    <p style={{ color: passwordValidations.hasNumber ? 'green' : 'gray' }}>At least one number</p>
                    <p style={{ color: passwordValidations.hasSpecialChar ? 'green' : 'gray' }}>At least one special character</p>
                    <p style={{ color: passwordValidations.hasMinLength ? 'green' : 'gray' }}>At least 8 characters</p>
                </div>
                <button type="submit" disabled={!Object.values(passwordValidations).every(Boolean)} className="button">Change password</button>
            </form>
        </div>
    );
}