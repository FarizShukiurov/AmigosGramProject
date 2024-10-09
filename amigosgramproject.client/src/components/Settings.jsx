import { useState, useEffect } from "react";
import "./Settings.css";

const Settings = () => {
    const [file, setFile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [usernameMessage, setUsernameMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [currentUsername, setCurrentUsername] = useState("");
    const [email, setEmail] = useState("");
    const [showUsernameInput, setShowUsernameInput] = useState(false);
    const [faqOpen, setFaqOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch("/api/Profile/get-user-data");
                const data = await response.json();
                setAvatarUrl(data.avatarUrl);
                setCurrentUsername(data.username);
                setEmail(data.email);
            } catch (error) {
                console.error("Error fetching user data", error);
            }
        };

        fetchUserData();
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const toggleUsernameInput = () => {
        setShowUsernameInput((prev) => !prev);
        if (showUsernameInput) setNewUsername(""); // —брос пол€ при закрытии
    };

    const handleSubmitAvatar = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/Profile/upload-avatar", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            setAvatarUrl(data.avatarUrl);
        } catch (error) {
            console.error("Error uploading avatar", error);
            setErrorMessage("Failed to upload avatar.");
        }
    };

    const handleSubmitUsername = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        setUsernameMessage("");

        try {
            const response = await fetch("/api/Profile/change-username", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newUsername }),
            });

            if (response.ok) {
                setUsernameMessage("Username updated successfully!");
                setCurrentUsername(newUsername);
            } else if (response.status === 409) {
                setErrorMessage("This username is already taken.");
            } else {
                setErrorMessage("An error occurred while updating username.");
            }
        } catch (error) {
            console.error("Error changing username", error);
            setErrorMessage("An unexpected error occurred.");
        }
    };

    return (
        <div className="settings-container">
            <h1 className="settings-title">Profile</h1>

            <div className="avatar-section">
                {avatarUrl && (
                    <img src={avatarUrl} alt="User Avatar" className="avatar-img" />
                )}
                <div className="avatar-popup">
                    <label htmlFor="file-upload" className="change-avatar-btn">
                        Change Avatar
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <p className="default-avatar-text">Upload Default</p>
                    <button onClick={handleSubmitAvatar} className="submit-btn">Submit</button>
                </div>
            </div>

            <div className="field-section">
                <label className="field-label">Name</label>
                <div className="field-content">
                    <span>{currentUsername}</span>
                    <button onClick={toggleUsernameInput} className="edit-btn">Edit</button>
                </div>
                {showUsernameInput && (
                    <form onSubmit={handleSubmitUsername} className="username-form">
                        <input
                            type="text"
                            placeholder="New Username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="username-input"
                        />
                        <button type="submit" className="submit-btn">Submit</button>
                    </form>
                )}
                {usernameMessage && <p className="success-message">{usernameMessage}</p>}
                {errorMessage && <p className="error-message">{errorMessage}</p>}
            </div>

            <div className="field-section">
                <label className="field-label">Email</label>
                <div className="field-content">
                    <span>{email}</span>
                </div>
            </div>

            <div className="password-section">
                <label className="field-label">Change Password</label>
                <button className="change-password-btn">Change Password</button>
            </div>

            <div className="faq-section">
                <label
                    className={`faq-label ${faqOpen ? 'active' : ''}`}
                    onClick={() => setFaqOpen(!faqOpen)}
                >
                    Questions about AmigosGram
                </label>
                <div className={`faq-content ${faqOpen ? 'active' : ''}`}>
                    <p>1. What is AmigosGram?</p>
                    <p>Answer: AmigosGram is a social media platform for connecting friends.</p>
                    <p>2. How can I change my password?</p>
                    <p>Answer: You can change your password in the profile settings.</p>
                    <p>3. How to delete my account?</p>
                    <p>Answer: Contact support to delete your account.</p>
                    <p>4. How do I change my profile picture?</p>
                    <p>Answer: Click on your avatar to upload a new picture.</p>
                    <p>5. Is AmigosGram free?</p>
                    <p>Answer: Yes, it's completely free!</p>
                </div>
            </div>

            <div className="about-section">
                <label
                    className={`about-label ${aboutOpen ? 'active' : ''}`}
                    onClick={() => setAboutOpen(!aboutOpen)}
                >
                    AmigosGram Features
                </label>
                <div className={`about-content ${aboutOpen ? 'active' : ''}`}>
                    <p>AmigosGram lets you share posts, follow friends, and communicate with others.</p>
                    <p>It's designed for ease of use and security.</p>
                    <p>Stay connected with friends around the world!</p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
