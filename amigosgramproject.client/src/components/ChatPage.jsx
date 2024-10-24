import { useState, useEffect} from "react";
import * as signalR from '@microsoft/signalr';
import "./ChatPage.css";

function ChatPage() {
    const [search, setSearch] = useState("");
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [lastMessages, setLastMessages] = useState({}); 
    const [hubConnection, setHubConnection] = useState(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [currentUserId, setCurrentUserId] = useState();

    useEffect(() => {
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:7015/chat")
            .build();

        newConnection.on("ReceiveMessage", (receivedMessage) => {
            const newMessage = receivedMessage;

            setMessages(prevMessages => [...prevMessages, newMessage]);

            setLastMessages(prevLastMessages => ({
                ...prevLastMessages,
                [newMessage.senderId === currentUserId ? newMessage.receiverId : newMessage.senderId]: newMessage.content
            }));
        });

        newConnection.start()
            .then(() => {
                console.log("Connection completed");
                setHubConnection(newConnection);
            })
            .catch(err => console.error("Error connection: ", err));

        return () => {
            if (newConnection) {
                newConnection.stop();
            }
        };
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await fetch('/contacts/GetContacts', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const contactData = await response.json();
                setChats(contactData);
                
                contactData.forEach(chat => {
                    fetchLastMessage(chat.id, currentUserId)
                        .then(lastMessage => {
                            console.log(chat.id);
                            console.log(currentUserId);
                            setLastMessages(prev => ({ ...prev, [chat.id]: lastMessage.content }));
                        });
                });
            } else if (response.status === 401) {
                console.error('User is not authorized');
            } else {
                console.error('Error fetching contacts:', response.status);
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    };

    const fetchLastMessage = async (userId1, userId2) => {
        try {
            const response = await fetch(`/api/Message/getLastMessageBetweenUsers?userId1=${userId1}&userId2=${userId2}`, {
                method: 'GET'
            });

            if (response.ok) {
                const lastMessage = await response.json();
                return lastMessage;
            } else {
                console.error('Error fetching the last message:', response.status);
                return null; // Возвращаем null, если ошибка
            }
        } catch (error) {
            console.error('An error occurred while fetching the last message:', error);
            return null; // Возвращаем null в случае ошибки
        }
    };


    const fetchMessages = async (chatId) => {
        try {
            const response = await fetch(`/api/Message/getMessagesBetweenUsers?userId1=${currentUserId}&userId2=${chatId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const messagesData = await response.json();
                setMessages(messagesData || []);
            } else {
                console.error('Error fetching messages:', response.status);
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    };

    const fetchCurrentUserId = async () => {
        try {
            const response = await fetch('/Account/GetCurrentUserId', {
                method: 'GET',
                headers: {
                    'Accept': '*/*'
                }
            });

            if (response.ok) {
                const userId = await response.text(); // Получаем текстовый ответ
                setCurrentUserId(userId); // Устанавливаем ID пользователя
            } else {
                console.error('Error fetching user ID:', response.status);
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    };


    const handleChatClick = (chatId) => {
        setSelectedChatId(chatId);
        fetchMessages(chatId); // Загружаем сообщения для выбранного чата
    };

    const renderMessage = (msg) => {
        const isCurrentUserSender = msg.senderId === currentUserId;

        return (
            <div key={msg.id} className={`message ${isCurrentUserSender ? "message-sent" : "message-received"}`}>
                {msg.messageType === "Image" && msg.mediaUrl ? (
                    <div>
                        <img src={msg.mediaUrl} alt="Sent media" className="message-image" />
                        {msg.content && <p>{msg.content}</p>}
                    </div>
                ) : (
                    <p>{msg.content}</p>
                )}
            </div>
        );
    };

    const sendMessage = async () => {
        if (!message || !selectedChatId) {
            return;
        }

        const messageDto = {
            senderId: currentUserId,
            receiverId: selectedChatId,
            content: message,
            messageType: 0, 
            imageUrl: null 
        };

        try {
            const response = await fetch('/api/Message/createMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageDto)
            });

            if (response.ok) {
                const createdMessage = await response.json();
                setMessages(prevMessages => [...prevMessages, createdMessage]);
                setLastMessages(prevLastMessages => ({
                    ...prevLastMessages,
                    [createdMessage.senderId === currentUserId ? createdMessage.receiverId : createdMessage.senderId]: createdMessage.content
                }));
                setMessage(""); // Очистка поля ввода после отправки
            } else {
                console.error('Error message:', response.status);
            }
        } catch (error) {
            console.error('Error message:', error);
        }
    };

    useEffect(() => {
        fetchCurrentUserId();
        if (currentUserId) {
            fetchContacts();
        }
    }, [currentUserId]);

    return (
        <div className="chat-page">
            <aside className="sidebar">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search Chats"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="chat-list">
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            className={`chat-item ${chat.id === selectedChatId ? "active" : ""}`}
                            onClick={() => handleChatClick(chat.id)}
                        >
                            <img src={chat.avatarUrl} alt={`${chat.userName}'s Avatar`} className="chat-avatar" />
                            <div className="chat-info">
                                <h4 className="chat-name">{chat.userName}</h4>
                                <p className="chat-last-message">
                                    {lastMessages[chat.id] ? lastMessages[chat.id] : "Loading..."}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            <main className="chat-area">
                <header className="chat-header">
                    <h2>Chat</h2>
                </header>
                <div className="chat-messages">
                    {messages.map((msg) => renderMessage(msg))}
                </div>
                <div className="chat-input">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <button className="send-button" onClick={sendMessage}>Send</button>
                </div>
            </main>
        </div>
    );
}

export default ChatPage;
