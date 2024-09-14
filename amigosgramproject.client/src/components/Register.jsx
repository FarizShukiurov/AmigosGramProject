import './Auth.css';

const Register = () => {
    return (
        <div className="auth-container">
            <div className="auth-logo">AmigosGram</div>
            <div className="auth-box">
                <h2>Create an account</h2>
                <form>
                    <div className="input-field">
                        <label>Email</label>
                        <input type="email" placeholder="Enter your email" />
                    </div>
                    <div className="input-field">
                        <label>Username</label>
                        <input type="text" placeholder="Enter your username" />
                    </div>
                    <div className="input-field">
                        <label>Password</label>
                        <input type="password" placeholder="Enter your password" />
                    </div>
                    <button className="auth-button">Register</button>
                </form>
                <p className="login-link">
                    Already have an account? <a href="/login">Login</a>
                </p>
            </div>
        </div>
    );
};

export default Register;
