import { useState } from "react";
import { Button, Form, Input, Checkbox, Typography, Alert } from 'antd';
import Cookies from 'js-cookie'; // Импортируем библиотеку для работы с cookies
import './Login.css';
import axios from 'axios';

const { Title, Text } = Typography;

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState(""); // Поле email остается для регистрации
    const [confirmPassword, setConfirmPassword] = useState("");
    const [rememberme, setRememberme] = useState(false);
    const [error, setError] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [timer, setTimer] = useState(0);
    const [panelClass, setPanelClass] = useState("login-panel");
    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "username") setUsername(value);
        if (name === "password") setPassword(value);
        if (name === "email") setEmail(value); // Оставляем email для регистрации
        if (name === "confirmPassword") setConfirmPassword(value);
        if (name === "rememberme") setRememberme(e.target.checked);
    };

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePassword = (password) => /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/.test(password);

    const handleLoginSubmit = async () => {
        if (!username || !password) {
            setError("Please fill in all fields.");
            return;
        }
        setError("");

        const loginUrl = rememberme ? "/Account/login" : "/Account/login";

        try {
            const response = await axios.post(
                loginUrl,
                { username, password },
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true // Передаём креденшиалы (cookies)
                }
            );
            console.log("privet")
            if (response.status === 200) {
                console.log("poka")
                const data = response.data;

                setError("Successful Login.");
                window.location.href = '/';
            } else {
                setError("Error Logging In.");
            }
        } catch (error) {
            setError("Error Logging in.");
        }
    };

    const handleRegisterSubmit = async () => {
        if (!username || !email || !password || !confirmPassword) {
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
            const response = await fetch("/Account/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });
            if (response.ok) {
                setError("Registration successful! Please check your email to confirm your account.");
            } else {
                setError("Error registering.");
            }
        } catch {
            setError("Error registering. Please try again later.");
        }
    };

    const handleRegisterClick = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setPanelClass("login-panel slide-out");
        setTimeout(() => {
            setIsRegistering(true);
            setPanelClass("register-panel slide-in");
            setIsTransitioning(false);
        }, 500);
    };

    const handleLoginClick = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setPanelClass("register-panel slide-out");
        setTimeout(() => {
            setIsRegistering(false);
            setPanelClass("login-panel slide-in");
            setIsTransitioning(false);
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
                        <Form.Item label="Username" required>
                            <Input
                                type="text"
                                name="username"
                                value={username}
                                onChange={handleChange}
                                disabled={isBlocked}
                                className="username-input"
                            />
                        </Form.Item>
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
                        <Button type="primary" className="custom-button" htmlType="submit" block disabled={isBlocked}>
                            Register {isBlocked && `(${timer}s)`}
                        </Button>
                        {error && <Alert message={error} type="error" showIcon />}
                        <div className="switch-form">
                            Already have an account? <Button type="link" onClick={handleLoginClick}>Login</Button>
                        </div>
                    </Form>
                ) : (
                        <Form onFinish={handleLoginSubmit} layout="vertical">
                            <Title level={3}>Welcome back!</Title>
                            <Text>We are so excited to see you again!</Text>
                            <Form.Item label="Username" required>
                                <Input
                                    type="text"
                                    name="username"
                                    value={username}
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
                            <Form.Item>
                                <Checkbox name="rememberme" checked={rememberme} onChange={handleChange}>
                                    Remember me
                                </Checkbox>
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" className="custom-button" htmlType="submit" block>
                                    Log In
                                </Button>
                            </Form.Item>
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
