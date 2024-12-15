import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Tooltip } from "antd";
import { LogoutOutlined, SettingOutlined, MessageOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import AuthorizeView from "./AuthorizeView.jsx";
import "./Layout.css";

function Layout() {
    const [avatarUrl, setAvatarUrl] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

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
                    setAvatarUrl(data.avatarUrl);
                } else {
                    console.error("No avatar URL found, using default avatar.");
                    setAvatarUrl("https://blobcontaineramigos.blob.core.windows.net/avatars/AmigosBlack.png");
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                setAvatarUrl("https://blobcontaineramigos.blob.core.windows.net/avatars/AvatarDefault.svg");
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
                navigate("/login");
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
                            {/* Передаем состояние для оверлея */}
                            <Link to="/contacts" state={{ modal: true, backgroundLocation: location }}>
                                <UserOutlined style={{ fontSize: '24px', color: 'white' }} />
                            </Link>
                        </button>
                        <button className="menu-item">
                            <Link to="/chats">
                                <MessageOutlined style={{ fontSize: '24px', color: 'white' }} />
                            </Link>
                        </button>
                        <button className="menu-item">
                            <Link to="/group-chats">
                                <TeamOutlined style={{ fontSize: '24px', color: 'white' }} />
                            </Link>
                        </button>
                        <div className="menu-spacer" />
                        <button className="menu-item">
                            <Link to="/settings" state={{ modal: true, backgroundLocation: location }}>
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
