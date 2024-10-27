/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import {
    Input,
    Layout,
    List,
    Avatar,
    Button,
    Space,
    Tooltip,
    Modal,
    Upload,
    message as antdMessage,
} from "antd";
import {
    SendOutlined,
    FileOutlined,
    PictureOutlined,
    AudioOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import "./ChatPage.css";

const { Sider, Content } = Layout;

function ChatPage() {
    const [search, setSearch] = useState("");
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [lastMessages, setLastMessages] = useState({});
    const [hubConnection, setHubConnection] = useState(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [currentUserId, setCurrentUserId] = useState();
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const [isFileModalVisible, setIsFileModalVisible] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to the bottom of the message list whenever messages update
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:7015/chat")
            .build();

        newConnection.on("ReceiveMessage", (receivedMessage) => {
            setMessages((prevMessages) => [...prevMessages, receivedMessage]);
            setLastMessages((prevLastMessages) => ({
                ...prevLastMessages,
                [receivedMessage.senderId === currentUserId
                    ? receivedMessage.receiverId
                    : receivedMessage.senderId]: receivedMessage.content,
            }));
        });

        newConnection
            .start()
            .then(() => {
                console.log("Connection completed");
                setHubConnection(newConnection);
            })
            .catch((err) => console.error("Error connection: ", err));

        return () => {
            if (newConnection) {
                newConnection.stop();
            }
        };
    }, [currentUserId]);

    useEffect(() => {
        fetchCurrentUserId();
        if (currentUserId) {
            fetchContacts();
        }
    }, [currentUserId]);

    const fetchContacts = async () => {
        try {
            const response = await fetch("/contacts/GetContacts", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const contactData = await response.json();
                setChats(contactData);

                contactData.forEach((chat) => {
                    fetchLastMessage(chat.id, currentUserId).then((lastMessage) => {
                        setLastMessages((prev) => ({
                            ...prev,
                            [chat.id]: lastMessage.content,
                        }));
                    });
                });
            } else {
                console.error("Error fetching contacts:", response.status);
            }
        } catch (error) {
            console.error("An error occurred:", error);
        }
    };

    const fetchLastMessage = async (userId1, userId2) => {
        try {
            const response = await fetch(
                `/api/Message/getLastMessageBetweenUsers?userId1=${userId1}&userId2=${userId2}`,
                { method: "GET" }
            );

            if (response.ok) {
                return await response.json();
            } else {
                console.error("Error fetching last message:", response.status);
            }
        } catch (error) {
            console.error("An error occurred while fetching the last message:", error);
        }
    };

    const fetchMessages = async (chatId) => {
        try {
            const response = await fetch(
                `/api/Message/getMessagesBetweenUsers?userId1=${currentUserId}&userId2=${chatId}`,
                { method: "GET", headers: { "Content-Type": "application/json" } }
            );

            if (response.ok) {
                const messagesData = await response.json();
                setMessages(messagesData || []);
            } else {
                console.error("Error fetching messages:", response.status);
            }
        } catch (error) {
            console.error("An error occurred:", error);
        }
    };

    const fetchCurrentUserId = async () => {
        try {
            const response = await fetch("/Account/GetCurrentUserId", {
                method: "GET",
                headers: { Accept: "*/*" },
            });

            if (response.ok) {
                const userId = await response.text();
                setCurrentUserId(userId);
            } else {
                console.error("Error fetching user ID:", response.status);
            }
        } catch (error) {
            console.error("An error occurred:", error);
        }
    };

    const handleChatClick = (chatId) => {
        setSelectedChatId(chatId);
        fetchMessages(chatId);
    };

    const handleImageUpload = async (info) => {
        console.log("Cli")
        const file = info.file.originFileObj;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch("/api/files/upload", {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload image.');
            }

            const data = await response.json();
            message.success('Image uploaded successfully!');
            console.log(data);  // Данные можно использовать для отображения или других целей
        } catch (error) {
            message.error(error.message || 'Failed to upload image.');
            console.error(error);
        }
    };

    const handleFileUpload = async (info) => {
        const file = info.file.originFileObj;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload file.');
            }

            const data = await response.json();
            message.success('File uploaded successfully!');
            console.log(data);  // Данные можно использовать для других операций
        } catch (error) {
            message.error(error.message || 'Failed to upload file.');
            console.error(error);
        }
    };


    const sendMessage = async () => {
        if (!message || !selectedChatId) return;

        const messageDto = {
            senderId: currentUserId,
            receiverId: selectedChatId,
            content: message,
            messageType: 0,
        };

        try {
            const response = await fetch("/api/Message/createMessage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(messageDto),
            });

            if (response.ok) {
                const createdMessage = await response.json();
                setMessages((prevMessages) => [...prevMessages, createdMessage]);
                setMessage("");
            } else {
                console.error("Error sending message:", response.status);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const renderMessage = (msg) => {
        const isCurrentUserSender = msg.senderId === currentUserId;
        return (
            <div key={msg.id} className={`message ${isCurrentUserSender ? "sent" : "received"}`}>
                {msg.content}
            </div>
        );
    };

    const handleImageModalOpen = () => setIsImageModalVisible(true);
    const handleFileModalOpen = () => setIsFileModalVisible(true);
    const handleModalClose = () => {
        setIsImageModalVisible(false);
        setIsFileModalVisible(false);
    };

    const imageProps = {
        beforeUpload: (file) => {
            const isImage = file.type.startsWith("image/");
            if (!isImage) {
                antdMessage.error("You can only upload image files!");
            }
            return isImage || Upload.LIST_IGNORE;
        },
        onChange: (info) => {
            if (info.file.status === "done") {
                antdMessage.success(`${info.file.name} file uploaded successfully`);
                handleModalClose();
            } else if (info.file.status === "error") {
                antdMessage.error(`${info.file.name} file upload failed.`);
            }
        },
    };

    return (
        <Layout className="chat-page">
            <Sider className="sidebar" width={300}>
                <div className="search-bar">
                    <Input
                        placeholder="Search Chats"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        prefix={<SearchOutlined />}
                    />
                </div>
                <List
                    itemLayout="horizontal"
                    dataSource={chats}
                    renderItem={(chat) => (
                        <List.Item
                            onClick={() => handleChatClick(chat.id)}
                            className={`chat-item ${chat.id === selectedChatId ? "active" : ""}`}
                        >
                            <List.Item.Meta
                                avatar={<Avatar src={chat.avatarUrl} />}
                                title={chat.userName}
                                description={lastMessages[chat.id] || "Loading..."}
                            />
                        </List.Item>
                    )}
                />
            </Sider>

            <Layout>
                <Content className="chat-content">
                    <div className="chat-messages">
                        {messages.map((msg) => renderMessage(msg))}
                        {/* Reference to keep the scroll at the bottom */}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chat-input">
                        <Input
                            placeholder="Type your message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            suffix={
                                <Space>
                                    <Tooltip title="Send Image">
                                        <Button icon={<PictureOutlined />} shape="circle" onClick={handleImageModalOpen} />
                                    </Tooltip>
                                    <Tooltip title="Send File">
                                        <Button icon={<FileOutlined />} shape="circle" onClick={handleFileModalOpen} />
                                    </Tooltip>
                                    <Tooltip title="Send Audio">
                                        <Button icon={<AudioOutlined />} shape="circle" />
                                    </Tooltip>
                                    <Button
                                        type="primary"
                                        icon={<SendOutlined />}
                                        onClick={sendMessage}
                                    />
                                </Space>
                            }
                        />
                    </div>
                </Content>
            </Layout>

            <Modal
                title="Select Image"
                visible={isImageModalVisible}
                onCancel={handleModalClose}
                footer={null}
            >
                <Upload
                    beforeUpload={() => false}
                    onChange={handleImageUpload}
                    {...imageProps}
                >
                    <Button icon={<PictureOutlined />}>Click to Upload</Button>
                </Upload>
            </Modal>

            <Modal
                title="Select File"
                visible={isFileModalVisible}
                onCancel={handleModalClose}
                footer={null}
            >
                <Upload
                    beforeUpload={() => false}
                    onChange={handleFileUpload}
                >
                    <Button icon={<FileOutlined />}>Click to Upload</Button>
                </Upload>
            </Modal>

        </Layout>
    );
}

export default ChatPage;
