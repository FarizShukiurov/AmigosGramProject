import React, { useState, useEffect } from "react";
import "./ChatPage.css";

function ChatPage() {
    const [search, setSearch] = useState("");
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    // �������� ��� �����
    const dummyChats = [
        { id: 1, name: "John Doe", avatarUrl: "https://via.placeholder.com/50", lastMessage: "Hey, how are you?" },
        { id: 2, name: "Jane Smith", avatarUrl: "https://via.placeholder.com/50", lastMessage: "See you tomorrow!" },
        { id: 3, name: "Alex Johnson", avatarUrl: "https://via.placeholder.com/50", lastMessage: "What's up?" },
    ];

    // �������� ��� ���������
    const dummyMessages = [
        { content: "Hi there!", sentByCurrentUser: false },
        { content: "Hello!", sentByCurrentUser: true },
        { content: "How's it going?", sentByCurrentUser: false },
    ];

    // ��������� �������� �����
    useEffect(() => {
        const fetchChats = async () => {
            try {
                // ����� ����� �������� �� �������� ������, ��� ������ ����� ����� API
                // const response = await fetch("/api/Chats", { credentials: "include" });
                // const data = await response.json();
                setTimeout(() => {
                    setChats(dummyChats); // ���������� ��������
                }, 1000); // ��������� ��������
            } catch (error) {
                console.error("Error fetching chats:", error);
            }
        };

        fetchChats();
    }, []);

    // ��������� �������� ��������� ��� ���������� ����
    const fetchMessages = async (chatId) => {
        try {
            // ����� ����� ����� �������� �� �������� ������
            // const response = await fetch(`/api/Chats/${chatId}/Messages`, { credentials: "include" });
            // const data = await response.json();
            setTimeout(() => {
                setMessages(dummyMessages); // ���������� ��������
                setSelectedChatId(chatId);
            }, 1000); // ��������� ��������
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    // ��������� �������� ������ ���������
    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            // ����� ����� ������� POST-������ ��� �������� ���������
            // const response = await fetch(`/api/Chats/${selectedChatId}/Messages`, {
            //     method: "POST",
            //     headers: {
            //         "Content-Type": "application/json",
            //     },
            //     body: JSON.stringify({ content: newMessage }),
            //     credentials: "include",
            // });

            // ������� ���� ����� ��������� � ��������� ���������
            setNewMessage("");
            fetchMessages(selectedChatId);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // ���������� ����� �� ������ ���������� �������
    const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(search.toLowerCase())
    );

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
                    {filteredChats.map(chat => (
                        <div
                            key={chat.id}
                            className={`chat-item ${chat.id === selectedChatId ? "active" : ""}`}
                            onClick={() => fetchMessages(chat.id)}
                        >
                            <img src={chat.avatarUrl} alt={`${chat.name}'s Avatar`} className="chat-avatar" />
                            <div className="chat-info">
                                <h4 className="chat-name">{chat.name}</h4>
                                <p className="chat-last-message">{chat.lastMessage}</p>
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
                    {messages.map((msg, index) => (
                        <p key={index} className={`message ${msg.sentByCurrentUser ? "message-sent" : "message-received"}`}>
                            {msg.content}
                        </p>
                    ))}
                </div>
                <div className="chat-input">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button className="send-button" onClick={sendMessage}>Send</button>
                </div>
            </main>
        </div>
    );
}

export default ChatPage;
