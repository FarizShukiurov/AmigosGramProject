/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Overlay.css";

function Overlay({ children }) {
    const navigate = useNavigate();
    const location = useLocation();

    // Определяем, открыты ли настройки (проверяем текущий путь)
    const isSettings = location.pathname.includes("settings");

    // Закрытие модального окна по нажатию Escape
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                navigate(-1); // Вернуться на предыдущую страницу
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [navigate]);

    // Закрытие окна через крестик
    const handleClose = () => {
        navigate(-1); // Вернуться на предыдущую страницу
    };

    return (
        <div
            className={`overlay-container ${isSettings ? "settings-background" : ""}`}
        >
            <button className="overlay-close" onClick={handleClose}>
                &times; {/* Символ крестика */}
            </button>
            <div className="overlay-content">{children}</div>
        </div>
    );
}

export default Overlay;
