import React, { useState, useEffect } from "react";
import {
    Modal,
    Button,
    Input,
    Upload,
    message,
    Avatar,
} from "antd";
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
    const [visible, setVisible] = useState(false);
    const [bio, setBio] = useState("");
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [resetPasswordEmail, setResetPasswordEmail] = useState("");
    const [resetPasswordError, setResetPasswordError] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch("/api/Profile/get-user-data", {
                    headers: {
                        "Authorization": `Bearer ${getTokenFromCookies()}`, // Attach token from cookies
                    }
                });
                const data = await response.json();
                setAvatarUrl(data.avatarUrl);
                setCurrentUsername(data.username);
                setEmail(data.email);
                setBio(data.biography || ""); // Default to an empty string if undefined
            } catch (error) {
                console.error("Error fetching user data", error);
            }
        };

        fetchUserData();
    }, []);

    const getTokenFromCookies = () => {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            const [key, value] = cookie.trim().split("=");
            if (key === "auth_token") {
                return decodeURIComponent(value);
            }
        }
        return null; // Return null if no token is found
    };

    const handleFileChange = (info) => {
        if (info.file.status === "done") {
            setAvatarUrl(info.file.response.avatarUrl);
        } else if (info.file.status === "error") {
            message.error("Failed to upload avatar.");
        }
    };

    const toggleUsernameInput = () => {
        setShowUsernameInput((prev) => !prev);
        if (showUsernameInput) setNewUsername(""); // Reset field on close
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
                    "Authorization": `Bearer ${getTokenFromCookies()}`, // Attach token from cookies
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

    const handleChangeBiography = async () => {
        const requestBody = { Biography: bio };
        try {
            const response = await fetch("/api/Profile/change-biography", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getTokenFromCookies()}`, // Attach token from cookies
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                message.success("Biography updated successfully!");
            } else {
                message.error("Failed to update biography.");
            }
        } catch (error) {
            console.error("Error changing biography", error);
            message.error("An unexpected error occurred.");
        }
    };

    const handleOpenOverlay = () => {
        setVisible(true);
    };

    const handleCancel = () => {
        setVisible(false);
    };

    const maskEmail = (email) => {
        if (!email) return ""; // Check if email is defined
        const parts = email.split("@");
        const maskedLocalPart = parts[0].length > 2
            ? parts[0].slice(0, 2) + "***"
            : parts[0];
        return `${maskedLocalPart}@${parts[1]}`;
    };

    // Send password reset link to user's email
    const handleSendResetPasswordLink = async () => {
        if (!resetPasswordEmail) {
            setResetPasswordError("Please enter your email address.");
            return;
        }
        setResetPasswordError("");

        try {
            const response = await fetch("/Account/SendResetPasswordLink", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", // Сервер ожидает JSON
                },
                body: JSON.stringify(resetPasswordEmail), // Передаем строку в формате JSON
            });

            if (response.ok) {
                message.success("Password reset link sent to your email!");
                setShowResetPasswordModal(false);
            } else {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                message.error("Failed to send password reset link.");
            }
        } catch (error) {
            console.error("Error sending reset password link", error);
            message.error("An unexpected error occurred.");
        }
    };





    const openResetPasswordModal = () => {
        setShowResetPasswordModal(true);
    };

    const closeResetPasswordModal = () => {
        setShowResetPasswordModal(false);
        setResetPasswordEmail(""); // Clear email field
        setResetPasswordError(""); // Clear error message
    };

    return (
        <div className="settings-container">
            <h1 className="settings-title">Profile</h1>

            <div className="avatar-section">
                <Avatar src={avatarUrl} size={100} />
                <Button onClick={handleOpenOverlay}>Change Avatar</Button>
                <Modal
                    title="Choose an Avatar"
                    visible={visible}
                    onCancel={handleCancel}
                    footer={null}
                >
                    <Upload
                        name="file"
                        action="/api/Profile/upload-avatar"
                        onChange={handleFileChange}
                        showUploadList={false}
                    >
                        <Button>Upload New Avatar</Button>
                    </Upload>
                    {/* Add your default avatars as images */}
                    <div className="default-avatars">
                        <img
                            src="default-avatar1.png"
                            alt="Default Avatar 1"
                            onClick={() => setAvatarUrl("default-avatar1.png")}
                        />
                        <img
                            src="default-avatar2.png"
                            alt="Default Avatar 2"
                            onClick={() => setAvatarUrl("default-avatar2.png")}
                        />
                        {/* Add more default avatars as needed */}
                    </div>
                </Modal>
            </div>

            <div className="field-section">
                <label className="field-label">Name</label>
                <div className="field-content">
                    <span>{currentUsername}</span>
                    <Button onClick={toggleUsernameInput} type="primary">Edit</Button>
                </div>
                {showUsernameInput && (
                    <form onSubmit={handleSubmitUsername} className="username-form">
                        <Input
                            placeholder="New Username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                        />
                        <Button type="primary" htmlType="submit">Submit</Button>
                    </form>
                )}
                {usernameMessage && <p className="success-message">{usernameMessage}</p>}
                {errorMessage && <p className="error-message">{errorMessage}</p>}
            </div>

            <div className="field-section">
                <label className="field-label">Email</label>
                <div className="field-content">
                    <span>{maskEmail(email)}</span>
                </div>
            </div>

            <div className="field-section">
                <label className="field-label">Biography</label>
                <Input.TextArea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                />
                <Button type="primary" onClick={handleChangeBiography}>
                    Update Biography
                </Button>
            </div>

            {/* Reset Password Section */}
            <div className="field-section">
                <Button onClick={openResetPasswordModal} type="primary">
                    Reset Password
                </Button>
            </div>

            <Modal
                title="Reset Password"
                visible={showResetPasswordModal}
                onCancel={closeResetPasswordModal}
                footer={[
                    <Button key="cancel" onClick={closeResetPasswordModal}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleSendResetPasswordLink}
                    >
                        Send Reset Link
                    </Button>,
                ]}
            >
                <Input
                    value={resetPasswordEmail}
                    onChange={(e) => setResetPasswordEmail(e.target.value)}
                    placeholder="Enter your email address"
                    type="email"
                />
                {resetPasswordError && (
                    <p className="error-message">{resetPasswordError}</p>
                )}
            </Modal>
        </div>
    );
};

export default Settings;
