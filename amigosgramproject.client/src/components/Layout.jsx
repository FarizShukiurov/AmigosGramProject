/* eslint-disable no-unused-vars */
import React from "react";
import { Link, Outlet } from "react-router-dom";
import AuthorizeView from "./AuthorizeView.jsx"
import "./Layout.css";
function Layout() {
    return (
        <AuthorizeView>
            <div className="app-layout">
                <aside className="navbar">
                    <div className="logo">
                        <img src="\src\assets\Amigos-logo.png" alt="App Logo" className="logo-img" />
                    </div>
                    <div className="profile">
                        <img src="/avatar.jpg" alt="Profile Avatar" className="avatar" />
                        <hr className="separator" />
                    </div>
                    <nav className="menu">
                        <button className="menu-item">
                            <Link to="/contacts"><img src="src\assets\Contacts.svg" alt="Settings" /></Link>
                        </button>
                        <button className="menu-item">
                            <Link to="/chats"><img src="src\assets\Chats.svg" alt="Settings" /></Link>
                        </button>
                        <button className="menu-item">
                            <Link to="/settings"><img src="src\assets\Settings.svg" alt="Settings" /></Link>
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