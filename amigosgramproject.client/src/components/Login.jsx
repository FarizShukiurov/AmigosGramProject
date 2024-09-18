import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './Login.css';

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberme, setRememberme] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "email") setEmail(value);
        if (name === "password") setPassword(value);
        if (name === "rememberme") setRememberme(e.target.checked);
    };

    const handleSubmit = (e) => {
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

    const handleForgotPassword = () => {
        navigate("/forgot-password");
    };

    const handleRegisterClick = () => {
        navigate("/register");
    };

    return (
        <div className="containerbox">
            <h3 className="title">Welcome back!</h3>
            <p className="subtitle">Were so excited to see you again!</p>
            <form onSubmit={handleSubmit} className="form">
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
                <div className="forgot-password" onClick={handleForgotPassword}>
                    Forgot your password?
                </div>
                <button type="submit" className="submit-button">Log In</button>
            </form>
            <div className="register">
                Need an account? <span className="register-link" onClick={handleRegisterClick}>Register</span>
            </div>
            {error && <p className="error">{error}</p>}
        </div>
    );
}

export default Login;
