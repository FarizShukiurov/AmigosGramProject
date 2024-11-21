import { useState } from "react";
import { Button, Form, Input, Checkbox, Typography, notification } from 'antd';
import './Login.css';
import axios from 'axios';

const { Title, Text } = Typography;

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [rememberme, setRememberme] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [panelClass, setPanelClass] = useState("login-panel");
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);


    // Обработчики изменений
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "username") setUsername(value);
        if (name === "password") setPassword(value);
        if (name === "email") setEmail(value);
        if (name === "confirmPassword") setConfirmPassword(value);
        if (name === "rememberme") setRememberme(e.target.checked);
    };

    // Функция отправки запроса повторного подтверждения email
    const handleResendConfirmation = async () => {
        try {
            const response = await axios.post(
                "https://localhost:5173/Account/ResendEmailConfirmation",  // URL
                JSON.stringify(username),  // Передаем username как строку
                {
                    headers: {
                        "Content-Type": "application/json"  // Устанавливаем правильный Content-Type
                    }
                }
            );

            if (response.status === 200) {
                notification.success({
                    message: "Confirmation Sent",
                    description: "A confirmation email has been sent to your registered email address.",
                });
            } else {
                notification.error({
                    message: "Error Resending Confirmation",
                    description: "Unable to resend the confirmation email. Please try again later.",
                });
            }
        } catch (err) {
            notification.error({
                message: "Error Resending Confirmation",
                description: "An error occurred. Please ensure your username is correct.",
            });
        }
    };

    // Обработка логина
    const handleLoginSubmit = async () => {
        if (!username || !password) {
            notification.error({
                message: "Login Failed",
                description: "Please fill in all fields.",
            });
            return;
        }

        try {
            const response = await axios.post(
                "/Account/login",
                { username, password },
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                }
            );

            if (response.status === 200) {
                window.location.href = '/';
            } else {
                const serverMessage = response.data?.message || "Unknown error";

                if (serverMessage.includes("Email is not confirmed.") && response.data?.action === "ResendConfirmation") {
                    // Показать уведомление с кнопкой повторной отправки письма
                    notification.error({
                        message: "Email Not Confirmed",
                        description: "Your email is not confirmed. Please check your inbox or resend the confirmation.",
                        btn: (
                            <Button size="small" type="link" onClick={handleResendConfirmation}>
                                Resend Confirmation
                            </Button>
                        ),
                    });
                } else {
                    notification.error({
                        message: "Error Logging In",
                        description: "An error occurred during login. Please try again.",
                    });
                }
            }
        } catch (error) {
            const serverMessage = error.response?.data?.message || "Unknown error";

            if (serverMessage.includes("Email is not confirmed.")) {
                notification.error({
                    message: "Email Not Confirmed",
                    description: "Your email is not confirmed. Please check your inbox or resend the confirmation.",
                    btn: (
                        <Button size="small" type="link" onClick={handleResendConfirmation}>
                            Resend Confirmation
                        </Button>
                    ),
                });
            } else {
                notification.error({
                    message: "Error Logging In",
                    description: "An error occurred during login. Please try again.",
                });
            }
        }
    };

    const handleRegisterSubmit = async () => {
        if (!username || !email || !password || !confirmPassword) {
            notification.error({
                message: "Registration Failed",
                description: "Please fill in all fields.",
            });
            return;
        }

        try {
            const response = await axios.post(
                "/Account/register",
                { username, email, password },
                { headers: { "Content-Type": "application/json" } }
            );
            if (response.status === 200) {
                notification.success({
                    message: "Registration Successful",
                    description: "Please check your email to confirm your account.",
                });
            } else {
                notification.error({
                    message: "Registration Failed",
                    description: "An error occurred during registration. Please try again.",
                });
            }
        } catch {
            notification.error({
                message: "Registration Failed",
                description: "An error occurred during registration. Please try again later.",
            });
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
            <div className={`panel ${panelClass}`}>
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
                                type="password"
                                name="password"
                                visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
                                value={password}
                                onChange={handleChange}
                                disabled={isBlocked}
                            />
                        </Form.Item>
                        <Form.Item label="Confirm Password" required>
                            <Input.Password
                                type="password"
                                name="confirmPassword"
                                visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
                                value={confirmPassword}
                                onChange={handleChange}
                                disabled={isBlocked}
                            />
                        </Form.Item>
                        <Button type="primary" className="custom-button" htmlType="submit" block disabled={isBlocked}>
                            Register
                        </Button>
                        <div className="switch-form">
                            Already have an account? <Button type="link" onClick={handleLoginClick}>Login</Button>
                        </div>
                    </Form>
                ) : (
                    <Form onFinish={handleLoginSubmit} layout="vertical">
                        <Title level={3}>Welcome back!</Title>
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
                                type="password"
                                visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
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
                        <Button type="primary" className="custom-button" htmlType="submit" block>
                            Log In
                        </Button>
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
