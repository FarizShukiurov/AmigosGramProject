/* eslint-disable no-unused-vars */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Login.css';

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberme, setRememberme] = useState(false);
    const [error, setError] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isBlocked, setIsBlocked] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isResendVisible, setIsResendVisible] = useState(false);
    const [panelClass, setPanelClass] = useState("login-panel");

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "email") setEmail(value);
        if (name === "password") setPassword(value);
        if (name === "confirmPassword") setConfirmPassword(value);
        if (name === "rememberme") setRememberme(e.target.checked);
    };
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const validatePassword = (password) => {
        const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
        return re.test(password);
    };

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Please fill in all fields.");
        } else {
            setError("");
            const loginurl = rememberme ? "/login?useCookies=true" : "/login?useSessionCookies=true";
            fetch(loginurl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            })
                .then((response) => {
                    if (response.ok) {
                        setError("Successful Login.");
                        window.location.href = '/';
                    } else {
                        setError("Error Logging In.");
                    }
                })
                .catch(() => setError("Error Logging in."));
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!validatePassword(password)) {
            setError("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setError("");
        try {
            const response = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                startBlockTimer();

                const confirmationResponse = await fetch("/Account/SendEmailConfirmation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(email),
                });

                if (confirmationResponse.ok) {
                    setError("Registration successful! Please check your email to confirm your account.");
                } else {
                    const errorText = await confirmationResponse.text();
                    setError(`Error sending confirmation email: ${errorText}`);
                }
            } else {
                const errorText = await response.text();
                setError(`Error registering: ${errorText}`);
            }
        } catch (error) {
            setError("Error registering. Please try again later.");
            console.error(error);
        }
    };

    const startBlockTimer = () => {
        setIsBlocked(true);
        setTimer(60);
        setIsResendVisible(false);
        const countdown = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    setIsBlocked(false);
                    setIsResendVisible(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleRegisterClick = () => {
        if (isRegistering) return;
        setPanelClass("login-panel slide-out");

        setTimeout(() => {
            setIsRegistering(true);
            setPanelClass("register-panel slide-in");
        }, 500);
    };

    const handleLoginClick = () => {
        if (!isRegistering) return;
        setPanelClass("register-panel slide-out");

        setTimeout(() => {
            setIsRegistering(false);
            setPanelClass("login-panel slide-in");
        }, 500);
    };
    const handleResendClick = async () => {
        try {
            const confirmationResponse = await fetch("/Account/SendEmailConfirmation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(email),
            });

            if (confirmationResponse.ok) {
                setError("Confirmation email resent. Please check your email.");
                startBlockTimer();
            } else {
                const errorText = await confirmationResponse.text();
                setError(`Error sending confirmation email: ${errorText}`);
            }
        } catch (error) {
            setError("Error resending confirmation email. Please try again later.");
            console.error(error);
        }
    };

    return (
        <div className="login-container">
            <div className="info-section">
                <img src="src/assets/Amigos-logo.png" alt="AmigosGram Logo" className="logo" />
                <h2 className="info-title">Welcome to AmigosGram</h2>
                <p className="info-text">Join AmigosGram today and enjoy the following benefits:</p>
                <ul className="benefits-list">
                    <li className="benefit-item">Free messaging</li>
                    <li className="benefit-item">End-to-end encryption</li>
                    <li className="benefit-item">Unlimited storage</li>
                </ul>
            </div>
            <div className={`panel ${panelClass} ${isRegistering ? 'register-panel' : 'login-panel'}`}>
                {isRegistering ? (
                    <>
                        <h3 className="title">Create an account</h3>
                        <form onSubmit={handleRegisterSubmit} className="form">
                            <div className="form-group">
                                <label htmlFor="email">Email <span className="required">*</span></label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={handleChange}
                                    className="input-field"
                                    disabled={isBlocked}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password <span className="required">*</span></label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={handleChange}
                                    className="input-field"
                                    disabled={isBlocked}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={handleChange}
                                    className="input-field"
                                    disabled={isBlocked}
                                />
                            </div>
                            <button type="submit" className="submit-button" disabled={isBlocked}>
                                Register {isBlocked && `(${timer}s)`}
                            </button>
                            {isResendVisible && (
                                <button type="button" className="resend-button" onClick={handleResendClick}>
                                    Resend Confirmation Email
                                </button>
                            )}
                        </form>
                        <div className="login">
                            Already have an account? <span className="login-link" onClick={handleLoginClick}>Login</span>
                        </div>
                    </>
                ) : (
                    <>
                        <h3 className="title">Welcome back!</h3>
                        <p className="subtitle">Were so excited to see you again!</p>
                        <form onSubmit={handleLoginSubmit} className="form">
                            <div className="form-group">
                                <label htmlFor="email">Email<span className="required">*</span></label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password <span className="required">*</span></label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                            </div>
                            <div className="forgot-password">
                                Forgot your password?
                            </div>
                            <button type="submit" className="submit-button">Log In</button>
                        </form>
                        <div className="register">
                            Need an account?{' '}
                            <span className="register-link" onClick={handleRegisterClick}>
                                Register
                            </span>
                        </div>
                    </>
                )}
                {error && <p className="error">{error}</p>}
            </div>
        </div>
    );
}

export default Login;
