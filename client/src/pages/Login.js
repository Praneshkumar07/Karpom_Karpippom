import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import the Auth Context
import { User, Lock } from 'lucide-react';

// Import Images
import logo from '../assets/KK.png';
import image1 from '../assets/Maatram.png';

// Import Styles
import './Login.css';

const Login = () => {
    // 1. State Variables
    const [userType, setUserType] = useState('Staff');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 2. Hooks (These were missing in your code)
    const { login } = useAuth();      // Get the login function
    const navigate = useNavigate();   // Get navigation tool
    const location = useLocation();   // Get current location

    // 3. Handle Login Logic
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        // VALIDATION: Check if empty
        if (!username.trim() || !password.trim()) {
            setError("Please enter both Username and Password.");
            return;
        }

        setLoading(true);

        try {
            // Call the backend login function from AuthContext
            const loggedInUser = await login(userType, username, password);

            // Determine where to redirect
            const from = location.state?.from?.pathname;
            
            // Redirect based on Role (Student vs Staff)
            if (loggedInUser.role === 'Student') {
                navigate(from || '/student/dashboard', { replace: true });
            } else {
                navigate(from || '/staff/dashboard', { replace: true });
            }

        } catch (err) {
            // Handle Errors
            const message = err.response?.data?.Error || err.message || 'Failed to log in';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="header-logo">
                <img
                    src={image1}
                    alt="MAATRAM logo"
                    onError={(e) => e.target.src = `https://placehold.co/150x50/2a2a2a/ffffff?text=MAATRAM`}
                />
            </div>

            {/* Error Message Box */}
            <div 
              id="login-message" 
              className="login-message" 
              style={{ display: error ? 'block' : 'none', color: 'red' }}
            >
              {error}
            </div>

            <div className="decorative-arrows">
                <span>&gt;</span><span>&gt;</span>
            </div>

            <div className="login-card">
                <div className="college-logo-container">
                    <img
                        src={logo}
                        alt="College Logo"
                        className="college-logo"
                        onError={(e) => e.target.src = `https://placehold.co/100x100/e5e7eb/2a2a2a?text=KK`}
                    />
                </div>
                <h2 className="login-title">Karpom Karpippom</h2>
                
                <form onSubmit={handleLogin} className="login-form">
                    <div className="user-type-container">
                        <label className="user-type-label">
                            <input
                                type="radio"
                                name="userType"
                                value="Staff"
                                checked={userType === 'Staff'}
                                onChange={() => setUserType('Staff')}
                            />
                            <span>Staff</span>
                        </label>
                        <label className="user-type-label">
                            <input
                                type="radio"
                                name="userType"
                                value="Student"
                                checked={userType === 'Student'}
                                onChange={() => setUserType('Student')}
                            />
                            <span>Student</span>
                        </label>
                    </div>

                    <div className="input-group">
                        <div className="input-field-container">
                            <span className="input-icon"><User size={20} /></span>
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group password">
                        <div className="input-field-container">
                            <span className="input-icon"><Lock size={20} /></span>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <div className="options-container">
                        <label className="remember-me-label">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span>Remember?</span>
                        </label>
                        <button type="button" className="forgot-password-link" style={{background: 'none', border: 'none', cursor: 'pointer', font: 'inherit'}}>
                            Forgot your password?
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;