import { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import { Tooltip } from "antd";
import { LogoutOutlined, SettingOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons';
import AuthorizeView from "./AuthorizeView.jsx";
import "./Layout.css";

function Layout() {
    const [avatarUrl, setAvatarUrl] = useState(""); // ������� �������� �� ���������

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
                    setAvatarUrl(data.avatarUrl); // ���������� URL, ���������� �� API
                } else {
                    console.error("No avatar URL found in the response, using default avatar.");
                    setAvatarUrl("https://blobcontaineramigos.blob.core.windows.net/avatars/AvatarDefault.svg"); // ������� �������� �� ���������, ���� �� �������
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                setAvatarUrl("https://blobcontaineramigos.blob.core.windows.net/avatars/AvatarDefault.svg"); // ������� �������� �� ��������� � ������ ������
            }
        };

        fetchUserData();
    }, []);

    return (
        <AuthorizeView>
            <div className="app-layout animated-layout">
                <aside className="navbar animated-sidebar">
                    <div className="logo">
                        <img src="/src/assets/Amigos-logo.png" alt="App Logo" className="logo-img" />
                    </div>
                    <div className="profile">
                        <Tooltip title="Profile">
                            <img src={avatarUrl} alt="Profile Avatar" className="sidebar-avatar" />
                        </Tooltip>
                        <hr className="separator" />
                    </div>
                    <nav className="menu">
                        <Tooltip title="Contacts">
                            <button className="menu-item">
                                <Link to="/contacts">
                                    <UserOutlined style={{ fontSize: '24px', color: 'white' }} />
                                </Link>
                            </button>
                        </Tooltip>
                        <Tooltip title="Chats">
                            <button className="menu-item">
                                <Link to="/chats">
                                    <MessageOutlined style={{ fontSize: '24px', color: 'white' }} />
                                </Link>
                            </button>
                        </Tooltip>
                        <div className="menu-spacer" />
                        <Tooltip title="Settings">
                            <button className="menu-item">
                                <Link to="/settings">
                                    <SettingOutlined style={{ fontSize: '24px', color: 'white' }} />
                                </Link>
                            </button>
                        </Tooltip>
                        <Tooltip title="Logout">
                            <button className="logout menu-item">
                                <LogoutOutlined style={{ fontSize: '24px', color: 'white' }} />
                            </button>
                        </Tooltip>
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
