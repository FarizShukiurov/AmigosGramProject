/* eslint-disable no-unused-vars */
import { HashRouter as Router, useLocation, Routes, Route } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import './App.css';
import Login from './components/Login';
import Layout from './components/Layout';
import Contacts from './components/Contacts';
import MobileContactsPage from './components/MobileContactsPage'; // Импортируем мобильную версию контактов
import Settings from './components/Settings';
import ChatPage from './components/ChatPage';
import ChatPageMobile from './components/ChatPageMobile'; // Импортируем мобильную версию чата
import Overlay from './components/Overlay';
import GroupChatPage from "./components/GroupChatPage.jsx";
import GroupChatPageMobile from "./components/GroupChatPageMobile.jsx"

function AppRoutes() {
    const location = useLocation();
    const state = location.state || {};

    // Если есть state.backgroundLocation, значит мы переходим в оверлейный режим
    const backgroundLocation = state.backgroundLocation || location;

    // Определяем, мобильное ли устройство (например, ширина экрана <= 768px)
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

    return (
        <>
            {/* Основные маршруты, рендерим их по backgroundLocation, чтобы чаты оставались на фоне */}
            <Routes location={backgroundLocation}>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Layout />}>
                    {/* В зависимости от устройства рендерим либо ChatPageMobile, либо стандартный ChatPage */}
                    <Route path="chats" element={isMobile ? <ChatPageMobile /> : <ChatPage />} />
                    <Route path="group-chats" element={isMobile ? <GroupChatPageMobile /> : <GroupChatPage />} />
                    <Route path="contacts" element={isMobile ? <MobileContactsPage /> : <Contacts />} />
                    <Route index element={isMobile ? <ChatPageMobile /> : <ChatPage />} />
                </Route>
                <Route path="*" element={"Not found"} />
            </Routes>

            {/* Если modal: true, отображаем маршруты в качестве оверлеев поверх текущего содержимого */}
            {state.modal && (
                <Routes>
                    <Route
                        path="/contacts"
                        element={
                            <Overlay>
                                {isMobile ? <MobileContactsPage /> : <Contacts />}
                            </Overlay>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <Overlay>
                                <Settings />
                            </Overlay>
                        }
                    />
                </Routes>
            )}
        </>
    );
}

function App() {
    return (
        <Router>
            <AppRoutes />
        </Router>
    );
}

export default App;