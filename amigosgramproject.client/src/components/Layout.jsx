import React, { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import AuthorizeView from "./AuthorizeView.jsx";
import "./Layout.css";

function Layout() {
    const [avatarUrl, setAvatarUrl] = useState("/default-avatar.jpg");

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch("/api/Profile/get-user-data", {
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    credentials: "include",
                });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }

                const data = await response.json();

                if (data.avatarUrl) {
                    setAvatarUrl(data.avatarUrl);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchUserData();
    }, []);

    return (
        <AuthorizeView>
            <div className="app-layout">
                <aside className="navbar">
                    <div className="logo">
                        <img src="\src\assets\Amigos-logo.png" alt="App Logo" className="logo-img" />
                    </div>
                    <div className="profile">
                        <img src={avatarUrl} alt="Profile Avatar" className="sidebar-avatar" />
                        <hr className="separator" />
                    </div>
                    <nav className="menu">
                        <button className="menu-item">
                            <Link to="/contacts">
                                <img src="src/assets/Contacts.svg" alt="Contacts" />
                            </Link>
                        </button>
                        <button className="menu-item">
                            <Link to="/chats">
                                <img src="src/assets/Chats.svg" alt="Chats" />
                            </Link>
                        </button>
                        <div className="menu-spacer" />
                        <button className="menu-item">
                            <Link to="/settings">
                                <img src="src/assets/Settings.svg" alt="Settings" />
                            </Link>
                        </button>
                        <button className="logout menu-item">
                            <img src="src/assets/LogOut.svg" alt="Logout" />
                        </button>
                    </nav>

                </aside>
                <main className="content">
                    <Outlet />
                </main>
            </div>
        </AuthorizeView>
    );
}

export default Layout;
