/// <reference path="layout.jsx" />
import React, { useState, useEffect } from "react";
import {
    Drawer,
    Button,
    Input,
    Upload,
    notification,
    Avatar,
} from "antd";
import { FileOutlined } from "@ant-design/icons";
import "./Settings.css";

const Settings = () => {
    const [avatarUrl, setAvatarUrl] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [usernameMessage, setUsernameMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [currentUsername, setCurrentUsername] = useState("");
    const [email, setEmail] = useState("");
    const [showUsernameInput, setShowUsernameInput] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false); // для выбора аватара
    const [bio, setBio] = useState("");
    const [showResetDrawer, setShowResetDrawer] = useState(false); // для сброса пароля

    const DEFAULT_AVATARS = [
        { src: "https://amigos.blob.core.windows.net/avatars/AmigosBlack.jpg", alt: "Amigos Black" },
        { src: "https://amigos.blob.core.windows.net/avatars/AmigosBlue.jpg", alt: "Amigos Blue" },
        { src: "https://amigos.blob.core.windows.net/avatars/AmigosBrown.jpg", alt: "Amigos Brown" },
        { src: "https://amigos.blob.core.windows.net/avatars/AmigosDarkBlue.jpg", alt: "Amigos Dark Blue" },
        { src: "https://amigos.blob.core.windows.net/avatars/AmigosDarkRed.jpg", alt: "Amigos Dark Red" },
        { src: "https://amigos.blob.core.windows.net/avatars/AmigosGreen.jpg", alt: "Amigos Green" },
        { src: "https://amigos.blob.core.windows.net/avatars/AmigosOrange.jpg", alt: "Amigos Orange" },
        { src: "https://amigos.blob.core.windows.net/avatars/AmigosPurple.jpg", alt: "Amigos Purple" },
        { src: "https://amigos.blob.core.windows.net/avatars/AmigosRed.jpg", alt: "Amigos Red" },
    ];

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch("/api/Profile/get-user-data", {
                    headers: {
                        "Authorization": `Bearer ${getTokenFromCookies()}`,
                    },
                });
                const data = await response.json();
                setAvatarUrl(data.avatarUrl);
                setCurrentUsername(data.username);
                setEmail(data.email);
                setBio(data.biography || "");
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
        return null;
    };

    const handleSelectDefaultAvatar = async (avatarSrc) => {
        try {
            let response;
            if (avatarSrc instanceof File) {
                const formData = new FormData();
                formData.append("file", avatarSrc);
                response = await fetch("/api/Profile/upload-avatar", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${getTokenFromCookies()}`,
                    },
                    body: formData,
                });
            } else {
                response = await fetch("/api/Profile/set-avatar-url", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getTokenFromCookies()}`,
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
                setDrawerVisible(false);
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
        if (showUsernameInput) setNewUsername("");
    };

    const handleSubmitUsername = async (e) => {
        e.preventDefault();
        // Проверка на пустой ник (игнорируя пробелы)
        if (!newUsername.trim()) {
            notification.error({
                message: "Invalid Username",
                description: "Username cannot be empty.",
            });
            return;
        }
        setErrorMessage("");
        setUsernameMessage("");

        try {
            const response = await fetch("/api/Profile/change-username", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getTokenFromCookies()}`,
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
                    "Authorization": `Bearer ${getTokenFromCookies()}`,
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

    // Drawer для выбора аватара (full screen на мобиль)
    const openAvatarDrawer = () => {
        setDrawerVisible(true);
    };

    const closeAvatarDrawer = () => {
        setDrawerVisible(false);
    };

    const maskEmail = (email) => {
        if (!email) return "";
        const parts = email.split("@");
        const maskedLocalPart =
            parts[0].length > 2 ? parts[0].slice(0, 2) + "***" : parts[0];
        return `${maskedLocalPart}@${parts[1]}`;
    };

    const handleSendResetPasswordLink = async () => {
        try {
            const response = await fetch("/Account/SendResetPasswordLink", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                notification.success({
                    message: "Password Reset Link Sent",
                    description: "Password reset link sent to your email!",
                });
                setShowResetDrawer(false);
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

    // Drawer для сброса пароля (full screen на мобиль)
    const openResetDrawer = () => {
        setShowResetDrawer(true);
    };

    const closeResetDrawer = () => {
        setShowResetDrawer(false);
    };

    return (
        <div className="settings-container">
            <h1 className="settings-title">Profile</h1>

            <div className="avatar-section">
                <Avatar src={avatarUrl} size={100} />
                <Button onClick={openAvatarDrawer}>Change Avatar</Button>
                <Drawer
                    title="Choose an Avatar"
                    placement="bottom"
                    closable={true}
                    onClose={closeAvatarDrawer}
                    visible={drawerVisible}
                    height="100%"
                    getContainer={false}
                    style={{ position: "fixed" }}
                    bodyStyle={{ padding: 16 }}
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
                </Drawer>
            </div>

            <div className="field-section">
                <label className="field-label">Name</label>
                <div className="field-content">
                    <span>{currentUsername}</span>
                    <Button onClick={toggleUsernameInput} type="primary">
                        Edit
                    </Button>
                </div>
                {showUsernameInput && (
                    <form onSubmit={handleSubmitUsername} className="username-form">
                        <Input
                            placeholder="New Username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                        />
                        <Button type="primary" htmlType="submit">
                            Submit
                        </Button>
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
                    className="bio-input"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                />
                <Button type="primary" className="change-bio-btn" onClick={handleChangeBiography}>
                    Update Biography
                </Button>
            </div>

            <div className="reset-password-section">
                <Button type="link" onClick={openResetDrawer}>
                    Change Password
                </Button>
                <Drawer
                    title="Reset Your Password"
                    placement="bottom"
                    closable={true}
                    onClose={closeResetDrawer}
                    visible={showResetDrawer}
                    height="100%"
                    getContainer={false}
                    style={{ position: "fixed" }}
                    bodyStyle={{ padding: 16 }}
                >
                    <div className="reset-password-container">
                        <p>
                            Your registered email: <strong>{maskEmail(email)}</strong>
                        </p>
                        <Button type="primary" onClick={handleSendResetPasswordLink}>
                            Send Reset Link
                        </Button>
                    </div>
                </Drawer>
            </div>
        </div>
    );
};

export default Settings;
