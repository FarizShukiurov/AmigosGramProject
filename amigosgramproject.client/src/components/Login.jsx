import { useState } from "react";
import { Button, Form, Input, Checkbox, Typography, Alert } from 'antd';
import { useNavigate } from "react-router-dom";
import './Login.css';

const { Title, Text } = Typography;

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

    const handleLoginSubmit = async () => {
        if (!email || !password) {
            setError("Please fill in all fields.");
        } else {
            setError("");
            const loginurl = rememberme ? "/login?useCookies=true" : "/login?useSessionCookies=true";
            try {
                const response = await fetch(loginurl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });
                if (response.ok) {
                    setError("Successful Login.");
                    window.location.href = '/';
                } else {
                    setError("Error Logging In.");
                }
            } catch {
                setError("Error Logging in.");
            }
        }
    };

    const handleRegisterSubmit = async () => {
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
                    setError("Error sending confirmation email.");
                }
            } else {
                setError("Error registering.");
            }
        } catch (error) {
            setError("Error registering. Please try again later.");
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

    return (
        <div className="login-container">
            <div className="info-section">
                <img src="src/assets/Amigos-logo.png" alt="AmigosGram Logo" className="logo" />
                <Title className="info-title">Welcome to AmigosGram</Title>
                <Text className="info-text">Join AmigosGram today and enjoy free messaging, end-to-end encryption, and unlimited storage.</Text>
            </div>
            <div className={`panel ${panelClass} ${isRegistering ? 'register-panel' : 'login-panel'}`}>
                {isRegistering ? (
                    <Form onFinish={handleRegisterSubmit} layout="vertical" disabled={isBlocked}>
                        <Title level={3}>Create an account</Title>
                        <Form.Item label="Email" required>
                            <Input
                                type="email"
                                name="email"
                                value={email}
                                onChange={handleChange}
                                disabled={isBlocked}
                            />
                        </Form.Item>
                        <Form.Item label="Password" required>
                            <Input.Password
                                name="password"
                                value={password}
                                onChange={handleChange}
                                disabled={isBlocked}
                            />
                        </Form.Item>
                        <Form.Item label="Confirm Password" required>
                            <Input.Password
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={handleChange}
                                disabled={isBlocked}
                            />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block disabled={isBlocked}>
                            Register {isBlocked && `(${timer}s)`}
                        </Button>
                        {isResendVisible && (
                            <Button type="link" onClick={handleResendClick}>Resend Confirmation Email</Button>
                        )}
                        {error && <Alert message={error} type="error" showIcon />}
                        <div className="switch-form">
                            Already have an account? <Button type="link" onClick={handleLoginClick}>Login</Button>
                        </div>
                    </Form>
                ) : (
                    <Form onFinish={handleLoginSubmit} layout="vertical">
                        <Title level={3}>Welcome back!</Title>
                        <Text>We're so excited to see you again!</Text>
                        <Form.Item label="Email" required>
                            <Input
                                type="email"
                                name="email"
                                value={email}
                                onChange={handleChange}
                            />
                        </Form.Item>
                        <Form.Item label="Password" required>
                            <Input.Password
                                name="password"
                                value={password}
                                onChange={handleChange}
                            />
                        </Form.Item>
                        <Checkbox name="rememberme" onChange={handleChange}>Remember me</Checkbox>
                        <Button type="primary" htmlType="submit" block>Log In</Button>
                        {error && <Alert message={error} type="error" showIcon />}
                        <div className="switch-form">
                            Need an account? <Button type="link" onClick={handleRegisterClick}>Register</Button>
                        </div>
                    </Form>
                )}
            </div>
        </div>
    );
}

export default Login;
