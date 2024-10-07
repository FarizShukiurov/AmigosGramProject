import { useState, useEffect } from "react";
import "./Settings.css"; // Ensure you import the CSS file

const Settings = () => {
    const [file, setFile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [usernameMessage, setUsernameMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [currentUsername, setCurrentUsername] = useState("");

    useEffect(() => {
        // Fetch user data on component load
        const fetchUserData = async () => {
            try {
                const response = await fetch("/api/Profile/get-user-data");
                const data = await response.json();
                setAvatarUrl(data.avatarUrl);
                setCurrentUsername(data.username); // Assuming the backend sends the username
                setNewUsername(data.username);
            } catch (error) {
                console.error("Error fetching user data", error);
            }
        };

        fetchUserData();
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUsernameChange = (e) => {
        setNewUsername(e.target.value);
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
        <div className="profile-settings-container">
            <div className="profile-box">
                <div className="avatar-section">
                    {avatarUrl && <img className="avatar" src={avatarUrl} alt="User Avatar" />}
                </div>
                <div className="user-info-section">
                    {/* Replace "User Profile" with dynamic username */}
                    <h2 className="profile-title">{currentUsername ? `${currentUsername}'s Profile` : "User Profile"}</h2>
                    <form onSubmit={handleSubmitUsername}>
                        <input
                            type="text"
                            placeholder="Enter new username"
                            value={newUsername}
                            onChange={handleUsernameChange}
                            className="username-input"
                        />
                        <button type="submit" className="change-btn">Change</button>
                    </form>
                    {usernameMessage && <p className="success-message">{usernameMessage}</p>}
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    <form onSubmit={handleSubmitAvatar}>
                        <input type="file" onChange={handleFileChange} />
                        <button type="submit" className="upload-btn">Upload Avatar</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
