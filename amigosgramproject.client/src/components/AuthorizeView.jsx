import { useState, useEffect, createContext } from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';

const UserContext = createContext({});

function AuthorizeView(props) {
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({ email: "" });

    useEffect(() => {
        const retryCount = 0;
        const maxRetries = 10;
        const delay = 1000;

        // Функция для задержки
        function wait(delay) {
            return new Promise((resolve) => setTimeout(resolve, delay));
        }

        // Функция с повторными попытками для получения данных
        async function fetchWithRetry(url, options) {
            try {
                console.log("Fetching data with options:", options);

                let response = await fetch(url, options);
                const textResponse = await response.text();
                console.log("Response text:", textResponse);

                if (response.status === 200) {
                    let data = JSON.parse(textResponse);
                    console.log("Parsed data:", data);
                    setUser({ email: data.email });
                    setAuthorized(true);
                    return response;
                } else if (response.status === 401) {
                    console.log("Unauthorized - Token might be invalid or expired");
                    setAuthorized(false);
                    return response;
                } else {
                    console.log("Unexpected status:", response.status);
                    throw new Error("" + response.status);
                }
            } catch (error) {
                console.error("Error in fetch:", error);
                if (retryCount < maxRetries) {
                    await wait(delay);
                    return fetchWithRetry(url, options); // Повторная попытка запроса
                } else {
                    throw error; // Прекращаем попытки после maxRetries
                }
            }
        }

        async function authorizeUser() {
            // Извлекаем токен из cookies
           
            const token = Cookies.get("accessToken");
            
            if (token) {
                console.log("Access token from cookies:", token); // Логируем токен

                // Настроим заголовки для запроса
                const options = {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` }
                };

                // Делаем запрос с токеном
                await fetchWithRetry("/Account/pingauth", options)
                    .catch((error) => {
                        console.log("Fetch error:", error.message);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            } else {
                console.log("No access token found"); // Если токен отсутствует
                setLoading(false);
                setAuthorized(false); // Устанавливаем статус неавторизован
            }
        }

        // Выполняем авторизацию, только если токен существует в cookies
        authorizeUser();

    }, []);

    if (loading) {
        return <p>Loading...</p>;
    } else {
        if (authorized) {
            return (
                <UserContext.Provider value={user}>
                    {props.children}
                </UserContext.Provider>
            );
        } else {
            return <Navigate to="/login" />;
        }
    }
}

AuthorizeView.propTypes = {
    children: PropTypes.node.isRequired,
};

export default AuthorizeView;
