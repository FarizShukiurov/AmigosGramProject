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
    Image,
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
    const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
    const [uploadedFileUrls, setUploadedFileUrls] = useState([]);
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
            const response = await fetch("api/Contacts/GetContacts", {
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

    const handleImageChange = (info) => {
        if (info.file.status === 'done') {
            console.log(info.file.response); // Check the structure of the response
            const imageUrl = info.file.response.url; // Make sure this URL is correct
            setUploadedImageUrls((prevUrls) => [...prevUrls, imageUrl]);
            antdMessage.success(`${info.file.name} Successfully uploaded.`);
        } else if (info.file.status === 'error') {
            antdMessage.error(`${info.file.name} upload error.`);
        }
    };

    const handleImageRemove = async (file) => {
        try {
            // Отправляем запрос на удаление
            console.log(file.response.fileId);
            const response = await fetch(`/api/files/delete/${file.response.fileId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setUploadedImageUrls((prevUrls) =>
                    prevUrls.filter((url) => url !== file.response.url)
                );
                antdMessage.success('File successfully deleted');
            } else {
                antdMessage.error('File delete failed 1');
            }
        } catch (error) {
            antdMessage.error('File delete failed 2');
        }
    };

    const handleFileChange = (info) => {
        if (info.file.status === 'done') {
            // Проверяем успешную загрузку
            const fileUrl = info.file.response.url; // URL, возвращенный эндпоинтом
            setUploadedFileUrls((prevUrls) => [...prevUrls, fileUrl]);
            antdMessage.success(`${info.file.name} Successfully uploaded.`);
        } else if (info.file.status === 'error') {
            antdMessage.error(`${info.file.name} upload error.`);
        }
    };

    const handleFileRemove = async (file) => {
        try {
            // Отправляем запрос на удаление
            console.log(file.response.fileId);
            const response = await fetch(`/api/files/delete/${file.response.fileId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setUploadedFileUrls((prevUrls) =>
                    prevUrls.filter((url) => url !== file.response.url)
                );
                antdMessage.success('File successfully deleted');
            } else {
                antdMessage.error('File delete failed 1');
            }
        } catch (error) {
            antdMessage.error('File delete failed 2');
        }
    };

    const sendMessage = async () => {
        if (!message || !selectedChatId) return;


        const messageDto = {
            senderId: currentUserId,
            receiverId: selectedChatId,
            content: message,
            messageType: uploadedImageUrls.length > 0 ? 1 : uploadedFileUrls.length > 0 ? 2 : 0,
            mediaUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : [],
            fileUrls: uploadedFileUrls.length > 0 ? uploadedFileUrls : [],
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
                setUploadedImageUrls([]);
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
                {/* Check for different message types */}
                {msg.content && <p>{msg.content}</p>}

                {/* Display uploaded images if present */}
                {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                    <div className="image-gallery">
                        {msg.mediaUrls.map((url, index) => (
                            <Image
                                key={index}
                                width={200}
                                src={url} // Ensure this URL is the direct link to your blob storage
                                alt={`Uploaded media ${index + 1}`}
                                style={{ margin: '8px 0' }}
                            />
                        ))}
                    </div>
                )}

                {/* Display uploaded files if present */}
                {msg.fileUrls && msg.fileUrls.length > 0 && (
                    <div className="file-list">
                        {msg.fileUrls.map((url, index) => (
                            <Button
                                key={index}
                                type="link"
                                href={url} // This should also be a direct link to your blob storage
                                target="_blank"
                                icon={<FileOutlined />}
                                style={{ display: 'block', margin: '4px 0' }}
                            >
                                Download File {index + 1}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        );
    };


    const handleImageModalOpen = () => setIsImageModalVisible(true);
    const handleFileModalOpen = () => setIsFileModalVisible(true);
    const handleModalClose = () => {
        setIsImageModalVisible(false);
        setIsFileModalVisible(false);
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
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) { 
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
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
                title={<span className="custom-modal-title">Select Image</span>}
                visible={isImageModalVisible}
                onCancel={handleModalClose}
                closable={false}
                footer={null}
            >
                <Upload
                    accept="image/*"
                    action="/api/files/upload"
                    onRemove={handleImageRemove}
                    onChange={handleImageChange}
                >
                    <Button>Click to Upload Image</Button>
                </Upload>
            </Modal>

            <Modal
                title={<span className="custom-modal-title">Select File</span>}
                visible={isFileModalVisible}
                onCancel={handleModalClose}
                closable={false}
                footer={null}
            >
                <Upload
                    accept=".txt, .pdf, .doc, .docx, .zip, .rar, .7z"
                    action="/api/files/upload"
                    onRemove={handleFileRemove}
                    onChange={handleFileChange}
                >
                    <Button icon={<FileOutlined />}>Click to Upload</Button>
                </Upload>
            </Modal>


        </Layout>
    );
}

export default ChatPage;
