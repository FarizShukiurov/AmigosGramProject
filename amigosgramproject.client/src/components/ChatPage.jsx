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

        newConnection.on("ReceiveMessage", async (receivedMessage) => {
            try {
                const currentUserPrivateKey = localStorage.getItem("privateKey");
                if (!currentUserPrivateKey) {
                    console.error("Private key not found for decryption");
                    return;
                }

                const encryptedContent =
                    receivedMessage.senderId === currentUserId
                        ? receivedMessage.encryptedForSender
                        : receivedMessage.encryptedForReceiver;

                const encryptedMediaUrls =
                    receivedMessage.senderId === currentUserId
                        ? receivedMessage.mediaUrlsForSender
                        : receivedMessage.mediaUrlsForReceiver;

                const encryptedFileUrls =
                    receivedMessage.senderId === currentUserId
                        ? receivedMessage.fileUrlsForSender
                        : receivedMessage.fileUrlsForReceiver;

                receivedMessage.content = await decryptMessage(encryptedContent);
                receivedMessage.mediaUrls = await decryptArray(encryptedMediaUrls);
                receivedMessage.fileUrls = await decryptArray(encryptedFileUrls);
            } catch (error) {
                console.error(`Error decrypting incoming message:`, error);
            }

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
            const response = await fetch("/api/Contacts/GetContacts", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                console.error("Error fetching contacts:", response.status);
                return;
            }

            const contactData = await response.json();
            setChats(contactData);

            // Загрузка и обработка последнего сообщения для каждого чата
            await Promise.all(
                contactData.map(async (chat) => {
                    try {
                        const lastMessage = await fetchLastMessage(chat.id, currentUserId);
                        console.log(lastMessage);
                        if (lastMessage) {
                            const encryptedContent =
                                lastMessage.senderId === currentUserId
                                    ? lastMessage.encryptedForSender
                                    : lastMessage.encryptedForReceiver;

                            const decryptedContent = await decryptMessage(encryptedContent);

                            setLastMessages((prev) => ({
                                ...prev,
                                [chat.id]: decryptedContent || "[Unable to decrypt message]",
                            }));
                        } else {
                            setLastMessages((prev) => ({
                                ...prev,
                                [chat.id]: "No messages yet :)",
                            }));
                        }
                    } catch (error) {
                        console.error(`Error processing last message for chat ${chat.id}:`, error);
                        setLastMessages((prev) => ({
                            ...prev,
                            [chat.id]: "[Error: Unable to fetch or decrypt message]",
                        }));
                    }
                })
            );
        } catch (error) {
            console.error("An error occurred while fetching contacts:", error);
        }
    };

    const fetchLastMessage = async (userId1, userId2) => {
        try {
            const response = await fetch(
                `/api/Message/getLastMessageBetweenUsers?userId1=${userId1}&userId2=${userId2}`,
                { method: "GET" }
            );

            if (!response.ok) {
                console.error("Error fetching last message:", response.status);
                return null;
            }

            return await response.json();
        } catch (error) {
            return null;
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

                const decryptedMessages = await Promise.all(
                    messagesData.map(async (msg) => {
                        try {
                            const encryptedContent =
                                msg.senderId === currentUserId
                                    ? msg.encryptedForSender
                                    : msg.encryptedForReceiver;
                            const encryptedMediaUrls =
                                msg.senderId === currentUserId
                                    ? msg.mediaUrlsForSender
                                    : msg.mediaUrlsForReceiver;
                            const encryptedFileUrls =
                                msg.senderId === currentUserId
                                    ? msg.fileUrlsForSender
                                    : msg.fileUrlsForReceiver;
                            msg.content = await decryptMessage(encryptedContent);
                            msg.mediaUrls = await decryptArray(encryptedMediaUrls);
                            msg.fileUrls = await decryptArray(encryptedFileUrls);
                        } catch (error) {
                            console.error(`Error decrypting message with ID ${msg.id}:`, error);
                            msg.content = "[Error: Unable to decrypt message]";
                            msg.mediaUrls = [];
                            msg.fileUrls = [];
                        }
                        return msg;
                    })
                );

                setMessages(decryptedMessages || []);
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

    const encryptMessage = async (message, publicKeyBase64) => {
        try {
            // Декодируем Base64 в ArrayBuffer
            const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), (c) => c.charCodeAt(0)).buffer;

            // Импортируем публичный ключ
            const publicKey = await window.crypto.subtle.importKey(
                "spki",
                publicKeyBuffer,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256",
                },
                false,
                ["encrypt"]
            );

            // Шифруем сообщение
            const encoder = new TextEncoder();
            const encodedMessage = encoder.encode(message);

            const encryptedMessage = await window.crypto.subtle.encrypt(
                {
                    name: "RSA-OAEP",
                },
                publicKey,
                encodedMessage
            );

            // Кодируем результат в Base64 для отправки
            return btoa(String.fromCharCode(...new Uint8Array(encryptedMessage)));
        } catch (error) {
            console.error("Error encrypting message:", error);
            throw error;
        }
    };

    const encryptArray = async (array, publicKey) => {
        const encryptedArray = [];
        for (const item of array) {
            const encryptedItem = await encryptMessage(item, publicKey);
            encryptedArray.push(encryptedItem);
        }
        return encryptedArray;
    };

    const decryptMessage = async (encryptedMessageBase64) => {
        try {
            console.log("Starting decryption...");
            // Декодируем Base64 в ArrayBuffer для зашифрованного сообщения
            const encryptedMessageBuffer = Uint8Array.from(atob(encryptedMessageBase64), (c) => c.charCodeAt(0)).buffer;
            console.log("Encrypted message buffer:", encryptedMessageBuffer);
  
            // Извлекаем приватный ключ из localStorage
            const privateKeyBase64 = localStorage.getItem("privateKey");
            if (!privateKeyBase64) {
                throw new Error("Private key not found in localStorage");
            }

            // Декодируем Base64 в ArrayBuffer для приватного ключа
            const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), (c) => c.charCodeAt(0)).buffer;
            console.log("Private key buffer:", privateKeyBuffer);

            // Проверка длины приватного ключа
            if (privateKeyBuffer.byteLength < 1200) {
                throw new Error("Private key is too short, invalid format.");
            }

            // Импортируем приватный ключ
            const privateKey = await window.crypto.subtle.importKey(
                "pkcs8",
                privateKeyBuffer,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256",
                },
                false,
                ["decrypt"]
            );
            console.log("Private key imported successfully.");

            // Дешифруем сообщение
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "RSA-OAEP" },
                privateKey,
                encryptedMessageBuffer
            );
            console.log("Decrypted buffer:", decryptedBuffer);
            // Преобразуем ArrayBuffer в строку
            const decoder = new TextDecoder();
            const decryptedMessage = decoder.decode(decryptedBuffer);
            console.log("Decrypted message:", decryptedMessage);
            return decryptedMessage;
        } catch (error) {
            console.error("Error decrypting message:", error);
            return "[Error: Unable to decrypt message]";
        }
    };

    const decryptArray = async (encryptedArray) => {
        if (!encryptedArray || encryptedArray.length === 0) return [];
        const decryptedArray = [];
        for (const encryptedItem of encryptedArray) {
            const decryptedItem = await decryptMessage(encryptedItem);
            decryptedArray.push(decryptedItem);
        }
        return decryptedArray;
    };

    const sendMessage = async () => {
        if (!message || !selectedChatId) return;

        try {
            // Получение публичных ключей
            const receiverKeyResponse = await fetch(`/api/Keys/getPublicKey/${selectedChatId}`);
            const senderKeyResponse = await fetch(`/api/Keys/getPublicKey/${currentUserId}`);

            if (!receiverKeyResponse.ok || !senderKeyResponse.ok) {
                throw new Error("Failed to fetch public keys");
            }

            const receiverPublicKey = await receiverKeyResponse.text();
            const senderPublicKey = await senderKeyResponse.text();

            // Шифруем сообщение и массивы ссылок для получателя
            const encryptedForReceiver = await encryptMessage(message, receiverPublicKey);
            const encryptedForSender = await encryptMessage(message, senderPublicKey);

            const encryptedMediaUrlsForReceiver = uploadedImageUrls.length > 0
                ? await encryptArray(uploadedImageUrls, receiverPublicKey)
                : [];
            const encryptedFileUrlsForReceiver = uploadedFileUrls.length > 0
                ? await encryptArray(uploadedFileUrls, receiverPublicKey)
                : [];
            const encryptedMediaUrlsForSender = uploadedImageUrls.length > 0
                ? await encryptArray(uploadedImageUrls, senderPublicKey)
                : [];
            const encryptedFileUrlsForSender = uploadedFileUrls.length > 0
                ? await encryptArray(uploadedFileUrls, senderPublicKey)
                : [];

            const messageDto = {
                senderId: currentUserId,
                receiverId: selectedChatId,
                encryptedForSender, // Зашифрованное сообщение для отправителя
                encryptedForReceiver, // Зашифрованное сообщение для получателя
                messageType: uploadedImageUrls.length > 0 ? 1 : uploadedFileUrls.length > 0 ? 2 : 0,
                mediaUrlsForSender: encryptedMediaUrlsForSender, // Зашифрованные медиа ссылки для отправителя
                fileUrlsForSender: encryptedFileUrlsForSender,  // Зашифрованные файлы ссылки для отправителя
                mediaUrlsForReceiver: encryptedMediaUrlsForReceiver, // Зашифрованные медиа ссылки для получателя
                fileUrlsForReceiver: encryptedFileUrlsForReceiver,  // Зашифрованные файлы ссылки для получателя
            };


            console.log("Sending message DTO:", messageDto);

            const response = await fetch("/api/Message/createMessage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(messageDto),
            });

            if (response.ok) {
                const localDecryptedMessage = {
                    senderId: currentUserId,
                    receiverId: selectedChatId,
                    content: message,
                    isEncrypted: false,
                    mediaUrls: uploadedImageUrls, // Добавляем локально доступные ссылки
                    fileUrls: uploadedFileUrls,   // Добавляем локально доступные ссылки
                };
                setMessages((prevMessages) => [...prevMessages, localDecryptedMessage]);
                setLastMessages((prevLastMessages) => ({
                    ...prevLastMessages,
                    [selectedChatId]: message,
                }));
                setMessage("");
                setUploadedImageUrls([]);
                setUploadedFileUrls([]);
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
                {msg.content && <p>{msg.content}</p>}
                {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                    <div className="image-gallery">
                        {msg.mediaUrls.map((url, index) => (
                            <Image
                                key={index}
                                width={200}
                                src={url} 
                                alt={`Uploaded media ${index + 1}`}
                                style={{ margin: '8px 0' }}
                            />
                        ))}
                    </div>
                )}

                {msg.fileUrls && msg.fileUrls.length > 0 && (
                    <div className="file-list">
                        {msg.fileUrls.map((url, index) => (
                            <Button
                                key={index}
                                type="link"
                                href={url} 
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
