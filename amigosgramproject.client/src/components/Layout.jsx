import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Tooltip } from "antd";
import { LogoutOutlined, SettingOutlined, MessageOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import AuthorizeView from "./AuthorizeView.jsx";
import "./Layout.css";

function Layout() {
    const [avatarUrl, setAvatarUrl] = useState(""); // Уберите значение по умолчанию
    const navigate = useNavigate();

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
                    console.error(`Error fetching user data: ${response.status} ${response.statusText}`);
                    throw new Error(`Error: ${response.status}`);
                }

                const data = await response.json();
                if (data.avatarUrl) {
                    setAvatarUrl(data.avatarUrl); // Установите URL, полученный из API
                } else {
                    console.error("No avatar URL found in the response, using default avatar.");
                    setAvatarUrl("https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosBlack.png"); // Задайте значение по умолчанию, если не найдено
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                setAvatarUrl("https://blobcontaineramigos.blob.core.windows.net/avatars/AvatarDefault.svg"); // Задайте значение по умолчанию в случае ошибки
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = async () => {
        try {
            const response = await fetch("/Account/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            if (response.ok) {
                navigate("/login"); // Redirect to login page on success
            } else {
                console.error("Logout failed");
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    return (
        <AuthorizeView>
            <div className="app-layout animated-layout">
                <aside className="navbar animated-sidebar">
                    <div className="logo">
                        <img src="/src/assets/Amigos-logo.png" alt="App Logo" className="logo-img" />
                    </div>
                    <div className="profile">
                        <Tooltip title="">
                            <img src={avatarUrl} alt="Profile Avatar" className="sidebar-avatar" />
                        </Tooltip>
                        <hr className="separator" />
                    </div>
                    <nav className="menu">
                        <button className="menu-item">
                            <Link to="/contacts">
                                <UserOutlined style={{ fontSize: '24px', color: 'white' }} />
                            </Link>
                        </button>
                        <button className="menu-item">
                            <Link to="/chats">
                                <MessageOutlined style={{ fontSize: '24px', color: 'white' }} />
                            </Link>
                        </button>
                        <div className="menu-spacer" />
                        <button className="menu-item">
                            <Link to="/settings">
                                <SettingOutlined style={{ fontSize: '24px', color: 'white' }} />
                            </Link>
                        </button>
                        <button className="logout menu-item" onClick={handleLogout}>
                            <LogoutOutlined style={{ fontSize: '24px', color: 'white' }} />
                        </button>
                    </nav>
                </aside>
                <main className="content animated-content">
                    <Outlet />
                </main>
            </div>
        </AuthorizeView>
    );
}

export default Layout;
