import React from 'react';
import './Auth.css';

const Login = () => {
    return (
        <div className="auth-container">
            <div className="auth-logo">AmigosGram</div>
            <div className="auth-box">
                <h2>Welcome back!</h2>
                <p>We're so excited to see you again!</p>
                <form>
                    <div className="input-field">
                        <label>Email</label>
                        <input type="email" placeholder="Enter your email" />
                    </div>
                    <div className="input-field">
                        <label>Password</label>
                        <input type="password" placeholder="Enter your password" />
                    </div>
                    <a href="#" className="forgot-link">Forgot your password?</a>
                    <button className="auth-button">Login</button>
                </form>
                <p className="register-link">
                    Need an account? <a href="/register">Register</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
