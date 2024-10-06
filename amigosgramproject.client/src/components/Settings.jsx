import { useState } from "react";

const Settings = () => {
    const [file, setFile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [usernameMessage, setUsernameMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

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
        <div>
            <form onSubmit={handleSubmitAvatar}>
                <input type="file" onChange={handleFileChange} />
                <button type="submit">Upload Avatar</button>
            </form>
            {avatarUrl && (
                <div>
                    <p>Avatar uploaded successfully!</p>
                    <img src={avatarUrl} alt="User Avatar" />
                </div>
            )}
            <form onSubmit={handleSubmitUsername}>
                <input
                    type="text"
                    placeholder="Enter new username"
                    value={newUsername}
                    onChange={handleUsernameChange}
                />
                <button type="submit">Change Username</button>
            </form>
            {usernameMessage && <p>{usernameMessage}</p>}
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        </div>
    );
};

export default Settings;
