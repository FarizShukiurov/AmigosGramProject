import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Register.css';

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isBlocked, setIsBlocked] = useState(false);
    const [timer, setTimer] = useState(0);    
    const [isResendVisible, setIsResendVisible] = useState(false);
    const navigate = useNavigate();


    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const validatePassword = (password) => {
        const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
        return re.test(password);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "email") setEmail(value);
        if (name === "password") setPassword(value);
        if (name === "confirmPassword") setConfirmPassword(value);
    };

    const handleSubmit = async (e) => {
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

    const handleLoginClick = () => {
        navigate("/login");
    };

    return (
        <div className="containerbox">
            <h3 className="title">Create an account</h3>
            <p className="subtitle">Its quick and easy!</p>
            <form onSubmit={handleSubmit} className="form">
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
            {error && <p className="error">{error}</p>}
        </div>
    );
}

export default Register;