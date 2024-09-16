import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Register.css';

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "email") setEmail(value);
        if (name === "password") setPassword(value);
        if (name === "confirmPassword") setConfirmPassword(value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password || !confirmPassword) {
            setError("Please fill in all fields.");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address.");
        } else if (password !== confirmPassword) {
            setError("Passwords do not match.");
        } else {
            setError("");
            fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            })
                .then((response) => {
                    if (response.ok) {
                        setError("Successfully registered");
                    } else {
                        setError("Error registering.");
                    }
                })
                .catch(() => setError("Error registering."));
        }
    };

    const handleLoginClick = () => {
        navigate("/login");
    };

    return (
        <div className="containerbox">
            <h3 className="title">Create an account</h3>
            <p className="subtitle">It is quick and easy!</p>
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
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={handleChange}
                        className="input-field"
                    />
                </div>
                {codeSent && (
                    <div className="form-group">
                        <label htmlFor="confirmationCode">Confirmation Code <span className="required">*</span></label>
                        <input
                            type="text"
                            id="confirmationCode"
                            name="confirmationCode"
                            value={confirmationCode}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>
                )}
                <button type="submit" className="submit-button">
                    {codeSent ? "Verify Code" : "Register"}
                </button>
            </form>
            <div className="login">
                Already have an account? <span className="login-link" onClick={() => handleLoginClick()}>Login</span>
            </div>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
        </div>
    );
}

export default Register;
