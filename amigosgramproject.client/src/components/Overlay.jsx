import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Overlay.css";

function Overlay({ children }) {
    const navigate = useNavigate();

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

    return (
        <div className="overlay-container">
            <div className="overlay-content">
                {children}
            </div>
        </div>
    );
}

export default Overlay;
