/* eslint-disable no-unused-vars */
import { HashRouter as Router, useLocation, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Layout from './components/Layout';
import Contacts from './components/Contacts';
import Settings from './components/Settings';
import ChatPage from './components/ChatPage';
import Overlay from './components/Overlay';
import GroupChatPage from "./components/GroupChatPage.jsx";
function AppRoutes() {
    const location = useLocation();
    const state = location.state || {};
    
    // Если есть state.backgroundLocation, значит мы переходим в оверлейный режим
    const backgroundLocation = state.backgroundLocation || location;

    return (
        <>
            {/* Основные маршруты, рендерим их по backgroundLocation, чтобы чаты оставались на фоне */}
            <Routes location={backgroundLocation}>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Layout />}>
                    <Route path="chats" element={<ChatPage />} />
                    <Route path="group-chats" element={<GroupChatPage />} />
                    <Route index element={<ChatPage />} />
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
                                <Contacts />
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
