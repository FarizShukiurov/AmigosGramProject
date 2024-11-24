import React, { useState, useEffect } from "react";
import {
    Modal,
    Button,
    Input,
    Upload,
    notification,
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
    const DEFAULT_AVATARS = [
        { src: "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosBlack.png", alt: "Amigos Black" },
        { src: "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosBlue.png", alt: "Amigos Blue" },
        { src: "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosBrown.png", alt: "Amigos Brown" },
        { src: "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosDarkBlue.png", alt: "Amigos Dark Blue" },
        { src: "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosDarkRed.png", alt: "Amigos Dark Red" },
        { src: "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosGreen.png", alt: "Amigos Green" },
        { src: "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosOrange.png", alt: "Amigos Orange" },
        { src: "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosPurple.png", alt: "Amigos Purple" },
        { src: "https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosRed.png", alt: "Amigos Red" },
    ];

    const handleSelectDefaultAvatar = async (avatarSrc) => {
        try {
            let response;

            if (avatarSrc instanceof File) {
                // Если выбран файл, загружаем его через FormData
                const formData = new FormData();
                formData.append("file", avatarSrc);

                response = await fetch("/api/Profile/upload-avatar", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${getTokenFromCookies()}`, // Добавляем токен
                    },
                    body: formData,
                });
            } else {
                // Если выбран URL из списка, отправляем как JSON
                response = await fetch("/api/Profile/set-avatar-url", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getTokenFromCookies()}`, // Добавляем токен
                    },
                    body: JSON.stringify({ avatarUrl: avatarSrc }),
                });
            }

            if (response.ok) {
                const data = await response.json();
                setAvatarUrl(data.avatarUrl);
                notification.success({
                    message: "Avatar Updated",
                    description: "Avatar updated successfully!",
                });
                setVisible(false); // Закрываем модалку
            } else {
                notification.error({
                    message: "Avatar Update Failed",
                    description: "Failed to set or upload avatar.",
                });
            }
        } catch (error) {
            console.error("Error updating avatar", error);
            notification.error({
                message: "Unexpected Error",
                description: "An unexpected error occurred.",
            });
        }
    };


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
            notification.error({
                message: "Avatar Upload Failed",
                description: "Failed to upload avatar.",
            });
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
                notification.success({
                    message: "Username Updated",
                    description: "Username updated successfully!",
                });
            } else if (response.status === 409) {
                setErrorMessage("This username is already taken.");
                notification.error({
                    message: "Username Taken",
                    description: "This username is already taken.",
                });
            } else {
                setErrorMessage("An error occurred while updating username.");
                notification.error({
                    message: "Error",
                    description: "An error occurred while updating username.",
                });
            }
        } catch (error) {
            console.error("Error changing username", error);
            setErrorMessage("An unexpected error occurred.");
            notification.error({
                message: "Unexpected Error",
                description: "An unexpected error occurred.",
            });
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
                notification.success({
                    message: "Biography Updated",
                    description: "Biography updated successfully!",
                });
            } else {
                notification.error({
                    message: "Failed to Update Biography",
                    description: "Failed to update biography.",
                });
            }
        } catch (error) {
            console.error("Error changing biography", error);
            notification.error({
                message: "Unexpected Error",
                description: "An unexpected error occurred.",
            });
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
        try {
            const response = await fetch("/Account/SendResetPasswordLink", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", // Сервер ожидает JSON
                },
                body: JSON.stringify({ email }), // Отправляем email как JSON-объект
            });

            if (response.ok) {
                notification.success({
                    message: "Password Reset Link Sent",
                    description: "Password reset link sent to your email!",
                });
                setShowResetPasswordModal(false);
            } else {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                notification.error({
                    message: "Password Reset Failed",
                    description: "Failed to send password reset link.",
                });
            }
        } catch (error) {
            console.error("Error sending reset password link", error);
            notification.error({
                message: "Unexpected Error",
                description: "An unexpected error occurred.",
            });
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
                    title={<span className="custom-modal-title">Choose an Avatar</span>}
                    visible={visible}
                    closable={false}
                    onCancel={handleCancel}
                    footer={null}
                >
                    <Upload
                        name="file"
                        action="/api/Profile/upload-avatar"
                        onChange={handleFileChange}
                        showUploadList={false}
                        beforeUpload={(file) => {
                            const isImage = file.type.startsWith("image/");
                            if (!isImage) {
                                notification.error({
                                    message: "Invalid File Type",
                                    description: "You can only upload image files.",
                                });
                            }
                            return isImage;
                        }}
                    >
                        <Button>Upload New Avatar</Button>
                    </Upload>


                    <div className="default-avatars">
                        {DEFAULT_AVATARS.map((avatar) => (
                            <img
                                key={avatar.src}
                                src={avatar.src}
                                alt={avatar.alt}
                                className="default-avatar"
                                onClick={() => handleSelectDefaultAvatar(avatar.src)}
                                style={{ cursor: "pointer", margin: "5px" }}
                            />
                        ))}
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
                <Input.TextArea className="bio-input"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                />
                <Button type="primary" className="change-bio-btn" onClick={handleChangeBiography}>
                    Update Biography
                </Button>
            </div>


            <div className="reset-password-section">
                <Button type="link" onClick={openResetPasswordModal}>Change Password</Button>
                <Modal
                    title={<span className="custom-modal-title">Reset Your Password</span>}
                    visible={showResetPasswordModal}
                    closable={false}
                    onCancel={closeResetPasswordModal}
                    footer={null}
                >
                    <div className="reset-password-container">
                        <p>Your registered email: <strong>{maskEmail(email)}</strong></p> {/* Masked email */}
                        {resetPasswordError && <p className="error-message">{resetPasswordError}</p>}
                        <Button
                            type="primary"
                            onClick={handleSendResetPasswordLink}
                        >
                            Send Reset Link
                        </Button>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default Settings;
