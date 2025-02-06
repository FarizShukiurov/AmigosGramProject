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
    SmileOutlined,
    SendOutlined,
    StopOutlined,
    FileOutlined,
    PictureOutlined,
    AudioOutlined,
    SearchOutlined,
    CameraOutlined, // Иконка для камеры
} from "@ant-design/icons";
import format from "date-fns/format";
import Picker from "emoji-picker-react";
import "./ChatPage.css";

const { Sider, Content } = Layout;

function ChatPage() {
    // Основные состояния
    const [search, setSearch] = useState("");
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [lastMessages, setLastMessages] = useState({});
    const [hubConnection, setHubConnection] = useState(null);
    const [message, setMessage] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentUserId, setCurrentUserId] = useState();
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const [isFileModalVisible, setIsFileModalVisible] = useState(false);
    const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
    const [uploadedFileUrls, setUploadedFileUrls] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const audioChunks = useRef([]);
    const timerRef = useRef(null); // Счетчик времени записи
    const [recordingTime, setRecordingTime] = useState(0);
    const messagesEndRef = useRef(null);
    const [previousChatId, setPreviousChatId] = useState(null);

    // Состояния для контекстного меню
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [editedText, setEditedText] = useState("");
    const [editingMessage, setEditingMessage] = useState(null);

    const [imageModalKey, setImageModalKey] = useState(0);
    const [fileModalKey, setFileModalKey] = useState(0);

    const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);

    // ★★★ Состояния для работы с камерой ★★★
    const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const videoRef = useRef(null);
    const [isVideoRecording, setIsVideoRecording] = useState(false);
    const videoRecorderRef = useRef(null);
    const videoChunks = useRef([]);

    const handleEmojiClick = (emojiObject) => {
        if (emojiObject?.emoji) {
            setMessage((prevMessage) => (prevMessage || "") + emojiObject.emoji);
        } else {
            console.error("Invalid emojiObject:", emojiObject);
        }
    };

    const getChatGroupId = (senderId, receiverId) => {
        return senderId.localeCompare(receiverId) < 0
            ? `${senderId}-${receiverId}`
            : `${receiverId}-${senderId}`;
    };

    useEffect(() => {
        if (!hubConnection || !currentUserId) return;
        const switchGroup = async () => {
            try {
                if (previousChatId) {
                    await hubConnection.invoke("LeaveGroup", previousChatId);
                    console.log(`Left group: ${previousChatId}`);
                }
                if (selectedChatId) {
                    const newGroupId = getChatGroupId(currentUserId, selectedChatId);
                    await hubConnection.invoke("JoinGroup", newGroupId);
                    console.log(`Joined group: ${newGroupId}`);
                    setPreviousChatId(newGroupId);
                }
            } catch (error) {
                console.error("Error switching groups:", error);
            }
        };
        switchGroup();
    }, [hubConnection, selectedChatId, currentUserId]);

    const handleContextMenu = (event, message) => {
        if (message.senderId !== currentUserId) return;
        event.preventDefault();
        const OFFSET_X = 200;
        setSelectedMessage(message);
        setMenuPosition({ x: event.clientX - OFFSET_X, y: event.clientY });
        setContextMenuVisible(true);
    };

    const handleCloseContextMenu = () => {
        setContextMenuVisible(false);
    };

    const handleEditMessage = (messageId) => {
        const messageToEdit = messages.find((msg) => msg.id === messageId);
        if (messageToEdit) {
            setEditingMessage(messageToEdit);
            setEditedText(messageToEdit.content);
        }
    };

    const handleSaveEdit = async () => {
        const isContentEmpty = !editedText || !editedText.trim();
        const hasMediaOrFiles =
            editingMessage.mediaUrlsForSender?.length > 0 ||
            editingMessage.fileUrlsForSender?.length > 0 ||
            editingMessage.audioUrlForSender;
        if (isContentEmpty && !hasMediaOrFiles) {
            antdMessage.error("Сообщение не может быть пустым, если нет медиа, файлов или аудио.");
            return;
        }
        try {
            const receiverKeyResponse = await fetch(`/api/Keys/getPublicKey/${selectedChatId}`);
            const senderKeyResponse = await fetch(`/api/Keys/getPublicKey/${currentUserId}`);
            if (!receiverKeyResponse.ok || !senderKeyResponse.ok) {
                throw new Error("Не удалось получить публичные ключи.");
            }
            const receiverPublicKey = await receiverKeyResponse.text();
            const senderPublicKey = await senderKeyResponse.text();
            const encryptedForSender = isContentEmpty ? null : await encryptMessage(editedText, senderPublicKey);
            const encryptedForReceiver = isContentEmpty ? null : await encryptMessage(editedText, receiverPublicKey);
            const response = await fetch(`/api/Message/editMessageById/${editingMessage.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    encryptedForSender,
                    encryptedForReceiver,
                    mediaUrlsForSender: editingMessage.mediaUrlsForSender || [],
                    fileUrlsForSender: editingMessage.fileUrlsForSender || [],
                    audioUrlForSender: editingMessage.audioUrlForSender || null,
                    mediaUrlsForReceiver: editingMessage.mediaUrlsForReceiver || [],
                    fileUrlsForReceiver: editingMessage.fileUrlsForReceiver || [],
                    audioUrlForReceiver: editingMessage.audioUrlForReceiver || null,
                }),
            });
            if (!response.ok) {
                throw new Error("Ошибка при обновлении сообщения на сервере.");
            }
            const updatedMessage = await response.json();
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg.id === updatedMessage.id
                        ? {
                            ...msg,
                            content: isContentEmpty ? "" : editedText,
                            mediaUrls: msg.mediaUrls,
                            fileUrls: msg.fileUrls,
                            audioUrl: msg.audioUrl,
                        }
                        : msg
                )
            );
            setEditingMessage(null);
            setEditedText("");
            antdMessage.success("Сообщение успешно отредактировано.");
        } catch (error) {
            console.error("Ошибка редактирования сообщения:", error);
            antdMessage.error("Ошибка при редактировании сообщения.");
        }
    };

    const handleDeleteMessage = async (message) => {
        try {
            console.log("Message object:", message);
            const decryptedMediaUrls = message.mediaUrlsForSender?.length
                ? await decryptArray(message.mediaUrlsForSender)
                : [];
            console.log(decryptedMediaUrls.length > 0 ? "Decrypted Media URLs:" : "No Media URLs to decrypt.", decryptedMediaUrls);
            const decryptedFileUrls = message.fileUrlsForSender?.length
                ? await decryptArray(message.fileUrlsForSender)
                : [];
            console.log(decryptedFileUrls.length > 0 ? "Decrypted File URLs:" : "No File URLs to decrypt.", decryptedFileUrls);
            const decryptedAudioUrl = message.audioUrlForSender
                ? await decryptMessage(message.audioUrlForSender)
                : null;
            console.log(decryptedAudioUrl ? "Decrypted Audio URL:" : "No Audio URL to decrypt.", decryptedAudioUrl);
            const payload = {
                mediaUrls: decryptedMediaUrls,
                fileUrls: decryptedFileUrls,
                audioUrl: decryptedAudioUrl,
            };
            console.log("Payload being sent:", payload);
            const response = await fetch(`/api/Message/deleteMessageById/${message.id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error("Failed to delete message");
            }
            antdMessage.success("Сообщение успешно удалено.");
        } catch (error) {
            console.error("Ошибка при удалении сообщения:", error);
            antdMessage.error("Ошибка при удалении сообщения.");
        }
    };

    useEffect(() => {
        if (!hubConnection || !currentUserId) return;
        const switchGroup = async () => {
            try {
                if (previousChatId) {
                    await hubConnection.invoke("LeaveGroup", previousChatId);
                    console.log(`Left group: ${previousChatId}`);
                }
                if (selectedChatId) {
                    const newGroupId = getChatGroupId(currentUserId, selectedChatId);
                    await hubConnection.invoke("JoinGroup", newGroupId);
                    console.log(`Joined group: ${newGroupId}`);
                    setPreviousChatId(newGroupId);
                }
            } catch (error) {
                console.error("Error switching groups:", error);
            }
        };
        switchGroup();
    }, [hubConnection, selectedChatId, currentUserId]);

    // Прокрутка вниз при изменении сообщений
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

        newConnection.on("UpdateLastMessage", async (chatId, lastMessage) => {
            try {
                const currentUserPrivateKey = localStorage.getItem("privateKey");
                if (!currentUserPrivateKey) {
                    console.error("Private key not found for decryption");
                    return;
                }
                const encryptedContent =
                    lastMessage.senderId === currentUserId
                        ? lastMessage.encryptedForSender
                        : lastMessage.encryptedForReceiver;
                const encryptedMediaUrls =
                    lastMessage.senderId === currentUserId
                        ? lastMessage.mediaUrlsForSender
                        : lastMessage.mediaUrlsForReceiver;
                const encryptedFileUrls =
                    lastMessage.senderId === currentUserId
                        ? lastMessage.fileUrlsForSender
                        : lastMessage.fileUrlsForReceiver;
                const encryptedAudioUrl =
                    lastMessage.senderId === currentUserId
                        ? lastMessage.audioUrlForSender
                        : lastMessage.audioUrlForReceiver;
                var contentTemp;
                if (encryptedContent != null) {
                    lastMessage.content = await decryptMessage(encryptedContent);
                    contentTemp = lastMessage.content;
                } else if (encryptedAudioUrl != null) {
                    contentTemp = "Audio";
                } else if (encryptedMediaUrls != null && encryptedMediaUrls.length > 0) {
                    contentTemp = "Media";
                } else if (encryptedFileUrls != null && encryptedFileUrls.length > 0) {
                    contentTemp = "File";
                } else {
                    lastMessage.content = lastMessage.content || "[Unable to decrypt message]";
                    contentTemp = lastMessage.content;
                }
                lastMessage.mediaUrls = encryptedMediaUrls
                    ? await decryptArray(encryptedMediaUrls)
                    : [];
                lastMessage.fileUrls = encryptedFileUrls
                    ? await decryptArray(encryptedFileUrls)
                    : [];
                lastMessage.audioUrl = encryptedAudioUrl
                    ? await decryptMessage(encryptedAudioUrl)
                    : null;
            } catch (error) {
                console.error(`Error decrypting incoming message:`, error);
                lastMessage.content = "[Error: Unable to decrypt message]";
                lastMessage.mediaUrls = [];
                lastMessage.fileUrls = [];
                lastMessage.audioUrl = null;
            }
            setLastMessages((prevLastMessages) => ({
                ...prevLastMessages,
                [chatId]: contentTemp,
            }));
        });

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
                const encryptedAudioUrl =
                    receivedMessage.senderId === currentUserId
                        ? receivedMessage.audioUrlForSender
                        : receivedMessage.audioUrlForReceiver;
                var contentTemp;
                if (encryptedContent != null) {
                    receivedMessage.content = await decryptMessage(encryptedContent);
                    contentTemp = receivedMessage.content;
                } else if (encryptedAudioUrl != null) {
                    contentTemp = "Audio";
                } else if (encryptedMediaUrls != null && encryptedMediaUrls.length > 0) {
                    contentTemp = "Media";
                } else if (encryptedFileUrls != null && encryptedFileUrls.length > 0) {
                    contentTemp = "File";
                } else {
                    receivedMessage.content = receivedMessage.content || "[Unable to decrypt message]";
                    contentTemp = receivedMessage.content;
                }
                receivedMessage.mediaUrls = encryptedMediaUrls
                    ? await decryptArray(encryptedMediaUrls)
                    : [];
                receivedMessage.fileUrls = encryptedFileUrls
                    ? await decryptArray(encryptedFileUrls)
                    : [];
                receivedMessage.audioUrl = encryptedAudioUrl
                    ? await decryptMessage(encryptedAudioUrl)
                    : null;
            } catch (error) {
                console.error(`Error decrypting incoming message:`, error);
                receivedMessage.content = "[Error: Unable to decrypt message]";
                receivedMessage.mediaUrls = [];
                receivedMessage.fileUrls = [];
                receivedMessage.audioUrl = null;
            }
            console.log("HUY:", receivedMessage.content);
            setMessages((prevMessages) => [...prevMessages, receivedMessage]);
            setLastMessages((prevLastMessages) => ({
                ...prevLastMessages,
                [receivedMessage.senderId === currentUserId
                    ? receivedMessage.receiverId
                    : receivedMessage.senderId]: contentTemp,
            }));
        });

        newConnection.on("UpdateMessage", async (updatedMessage) => {
            console.log("Received updated message via SignalR:", updatedMessage);
            if (updatedMessage.encryptedForSender && updatedMessage.senderId === currentUserId) {
                updatedMessage.content = await decryptMessage(updatedMessage.encryptedForSender);
            } else if (updatedMessage.encryptedForReceiver && updatedMessage.receiverId === currentUserId) {
                updatedMessage.content = await decryptMessage(updatedMessage.encryptedForReceiver);
            }
            if (updatedMessage.mediaUrlsForSender && updatedMessage.senderId === currentUserId) {
                updatedMessage.mediaUrls = await decryptArray(updatedMessage.mediaUrlsForSender);
            } else if (updatedMessage.mediaUrlsForReceiver && updatedMessage.receiverId === currentUserId) {
                updatedMessage.mediaUrls = await decryptArray(updatedMessage.mediaUrlsForReceiver);
            }
            if (updatedMessage.fileUrlsForSender && updatedMessage.senderId === currentUserId) {
                updatedMessage.fileUrls = await decryptArray(updatedMessage.fileUrlsForSender);
            } else if (updatedMessage.fileUrlsForReceiver && updatedMessage.receiverId === currentUserId) {
                updatedMessage.fileUrls = await decryptArray(updatedMessage.fileUrlsForReceiver);
            }
            if (updatedMessage.audioUrlForSender && updatedMessage.senderId === currentUserId) {
                updatedMessage.audioUrl = await decryptMessage(updatedMessage.audioUrlForSender);
            } else if (updatedMessage.audioUrlForReceiver && updatedMessage.receiverId === currentUserId) {
                updatedMessage.audioUrl = await decryptMessage(updatedMessage.audioUrlForReceiver);
            }
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg.id === updatedMessage.id ? updatedMessage : msg
                )
            );
        });

        newConnection.on("MessageDeleted", (messageId) => {
            console.log("Message deleted:", messageId);
            setMessages((prevMessages) =>
                prevMessages.filter((msg) => msg.id !== messageId)
            );
        });

        newConnection.onclose(async () => {
            console.warn("SignalR connection lost. Reconnecting...");
            try {
                await hubConnection.start();
                console.log("SignalR reconnected.");
            } catch (err) {
                console.error("Failed to reconnect to SignalR:", err);
            }
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
            await Promise.all(
                contactData.map(async (chat) => {
                    try {
                        const lastMessage = await fetchLastMessage(chat.id, currentUserId);
                        if (lastMessage) {
                            const encryptedContent =
                                lastMessage.senderId === currentUserId
                                    ? lastMessage.encryptedForSender
                                    : lastMessage.encryptedForReceiver;
                            var decryptedContent;
                            console.log(lastMessage.mediaUrlsForReceiver);
                            if (encryptedContent != null) {
                                decryptedContent = await decryptMessage(encryptedContent);
                            } else if (lastMessage.audioUrlForReceiver != null) {
                                decryptedContent = "Audio";
                            } else if (lastMessage.mediaUrlsForReceiver != null && lastMessage.mediaUrlsForReceiver.length > 0) {
                                decryptedContent = "Media";
                            } else if (lastMessage.fileUrlsForReceiver != null && lastMessage.fileUrlsForReceiver.length > 0) {
                                decryptedContent = "File";
                            }
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

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "";
        return format(new Date(timestamp), "HH:mm");
    };

    const fetchMessages = async (chatId) => {
        try {
            const response = await fetch(
                `/api/Message/getMessagesBetweenUsers?userId1=${currentUserId}&userId2=${chatId}`,
                { method: "GET", headers: { "Content-Type": "application/json" } }
            );
            if (!response.ok) {
                console.error("Error fetching messages:", response.status);
                return;
            }
            const messagesData = response.status !== 204 ? await response.json() : [];
            if (!messagesData || messagesData.length === 0) {
                console.warn("No messages to process.");
                setMessages([]);
                return;
            }
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
                        const encryptedAudioUrl =
                            msg.senderId === currentUserId
                                ? msg.audioUrlForSender
                                : msg.audioUrlForReceiver;
                        msg.timestamp = new Date(msg.timestamp);
                        if (encryptedContent != null) {
                            msg.content = await decryptMessage(encryptedContent);
                        }
                        msg.mediaUrls = encryptedMediaUrls ? await decryptArray(encryptedMediaUrls) : [];
                        msg.fileUrls = encryptedFileUrls ? await decryptArray(encryptedFileUrls) : [];
                        msg.audioUrl = encryptedAudioUrl ? await decryptMessage(encryptedAudioUrl) : null;
                    } catch (error) {
                        console.error(`Error decrypting message with ID ${msg.id}:`, error);
                        msg.content = "[Error: Unable to decrypt message]";
                        msg.mediaUrls = [];
                        msg.fileUrls = [];
                        msg.audioUrl = null;
                    }
                    return msg;
                })
            );
            setMessages(decryptedMessages || []);
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

    const handleChatClick = async (receiverId) => {
        setSelectedChatId(receiverId);
        fetchMessages(receiverId);
        const chatId = currentUserId < receiverId
            ? `${currentUserId}-${receiverId}`
            : `${receiverId}-${currentUserId}`;
        if (hubConnection) {
            await hubConnection.invoke("JoinGroup", chatId);
            console.log(`Joined group: ${chatId}`);
        }
    };

    const handleImageChange = (info) => {
        if (info.file.status === "done") {
            const uploadedUrl = info.file.response.url;
            setUploadedImageUrls((prev) => [...prev, uploadedUrl]);
            console.log("Image uploaded:", uploadedUrl);
        }
    };

    const handleImageRemove = async (file) => {
        try {
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
        if (info.file.status === "done") {
            const uploadedUrl = info.file.response.url;
            setUploadedFileUrls((prev) => [...prev, uploadedUrl]);
            console.log("File uploaded:", uploadedUrl);
        }
    };

    const handleFileRemove = async (file) => {
        try {
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
            const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), (c) =>
                c.charCodeAt(0)
            ).buffer;
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
            const encoder = new TextEncoder();
            const encodedMessage = encoder.encode(message);
            const encryptedMessage = await window.crypto.subtle.encrypt(
                {
                    name: "RSA-OAEP",
                },
                publicKey,
                encodedMessage
            );
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
            const encryptedMessageBuffer = Uint8Array.from(
                atob(encryptedMessageBase64),
                (c) => c.charCodeAt(0)
            ).buffer;
            console.log("Encrypted message buffer:", encryptedMessageBuffer);
            const privateKeyBase64 = localStorage.getItem("privateKey");
            if (!privateKeyBase64) {
                throw new Error("Private key not found in localStorage");
            }
            const privateKeyBuffer = Uint8Array.from(
                atob(privateKeyBase64),
                (c) => c.charCodeAt(0)
            ).buffer;
            console.log("Private key buffer:", privateKeyBuffer);
            if (privateKeyBuffer.byteLength < 1200) {
                throw new Error("Private key is too short, invalid format.");
            }
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
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "RSA-OAEP" },
                privateKey,
                encryptedMessageBuffer
            );
            console.log("Decrypted buffer:", decryptedBuffer);
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
        if (!message && uploadedImageUrls.length === 0 && uploadedFileUrls.length === 0) {
            console.warn("No content to send");
            return;
        }
        console.log("Message content:", message || "No text");
        console.log("Uploaded image URLs:", uploadedImageUrls);
        console.log("Uploaded file URLs:", uploadedFileUrls);
        try {
            const receiverKeyResponse = await fetch(`/api/Keys/getPublicKey/${selectedChatId}`);
            const senderKeyResponse = await fetch(`/api/Keys/getPublicKey/${currentUserId}`);
            if (!receiverKeyResponse.ok || !senderKeyResponse.ok) {
                throw new Error("Failed to fetch public keys");
            }
            const receiverPublicKey = await receiverKeyResponse.text();
            const senderPublicKey = await senderKeyResponse.text();
            const encryptedForReceiver = message
                ? await encryptMessage(message, receiverPublicKey)
                : null;
            const encryptedForSender = message
                ? await encryptMessage(message, senderPublicKey)
                : null;
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
            const messageType = uploadedImageUrls.length > 0
                ? 1
                : uploadedFileUrls.length > 0
                    ? 2
                    : 0;
            const messageDto = {
                senderId: currentUserId,
                receiverId: selectedChatId,
                encryptedForSender,
                encryptedForReceiver,
                messageType,
                mediaUrlsForSender: encryptedMediaUrlsForSender,
                fileUrlsForSender: encryptedFileUrlsForSender,
                mediaUrlsForReceiver: encryptedMediaUrlsForReceiver,
                fileUrlsForReceiver: encryptedFileUrlsForReceiver,
            };
            console.log("Sending message DTO:", messageDto);
            const response = await fetch("/api/Message/createMessage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(messageDto),
            });
            if (response.ok) {
                fetchMessages(selectedChatId);
                setLastMessages((prevLastMessages) => ({
                    ...prevLastMessages,
                    [selectedChatId]: message || "",
                }));
                setMessage(null);
                setUploadedImageUrls([]);
                setUploadedFileUrls([]);
                setImageModalKey((prev) => prev + 1);
                setFileModalKey((prev) => prev + 1);
            } else {
                console.error("Error sending message:", response.status);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const sendAudioMessage = async (audioBlob) => {
        const formData = new FormData();
        // Для аудио оставляем имя поля "audioFile"
        formData.append("audioFile", audioBlob);
        try {
            console.log(audioBlob);
            const uploadResponse = await fetch("/api/files/uploadAudio", {
                method: "POST",
                body: formData,
            });
            if (!uploadResponse.ok) {
                console.error("Audio upload failed:", uploadResponse.status);
                return;
            }
            const { url: audioUrl } = await uploadResponse.json();
            const receiverKeyResponse = await fetch(`/api/Keys/getPublicKey/${selectedChatId}`);
            const senderKeyResponse = await fetch(`/api/Keys/getPublicKey/${currentUserId}`);
            if (!receiverKeyResponse.ok || !senderKeyResponse.ok) {
                throw new Error("Failed to fetch public keys");
            }
            const receiverPublicKey = await receiverKeyResponse.text();
            const senderPublicKey = await senderKeyResponse.text();
            const encryptedAudioUrlForReceiver = await encryptMessage(audioUrl, receiverPublicKey);
            const encryptedAudioUrlForSender = await encryptMessage(audioUrl, senderPublicKey);
            const messageDto = {
                senderId: currentUserId,
                receiverId: selectedChatId,
                messageType: 3,
                audioUrlForSender: encryptedAudioUrlForSender,
                audioUrlForReceiver: encryptedAudioUrlForReceiver,
            };
            const createMessageResponse = await fetch("/api/Message/createMessage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(messageDto),
            });
            if (createMessageResponse.ok) {
                fetchMessages(selectedChatId);
                console.log("Audio message sent!");
            } else {
                console.error("Failed to send audio message:", createMessageResponse.status);
            }
        } catch (error) {
            console.error("Error uploading or sending audio:", error);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            recorder.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };
            recorder.onstop = () => {
                clearInterval(timerRef.current);
                setRecordingTime(0);
                const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
                audioChunks.current = [];
                sendAudioMessage(audioBlob);
                stream.getTracks().forEach((track) => track.stop());
            };
            recorder.start();
            setIsRecording(true);
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error starting audio recording:", error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
        }
        setIsRecording(false);
        clearInterval(timerRef.current);
    };

    // ★★★ Функции для работы с камерой ★★★
    const openCameraModal = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraModalVisible(true);
        } catch (error) {
            console.error("Error accessing camera:", error);
        }
    };

    const closeCameraModal = () => {
        setIsCameraModalVisible(false);
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
            setCameraStream(null);
        }
    };

    // Вместо немедленной отправки, после съемки фото добавляем URL в uploadedImageUrls
    const sendCapturedImage = async (imageBlob) => {
        try {
            const formData = new FormData();
            // Передаем имя поля "file" (путь теперь "/api/files/upload")
            formData.append("file", imageBlob, "photo.jpg");
            const uploadResponse = await fetch("/api/files/upload", {
                method: "POST",
                body: formData,
            });
            if (!uploadResponse.ok) {
                console.error("Image upload failed:", uploadResponse.status);
                return;
            }
            const { url: imageUrl } = await uploadResponse.json();
            console.log("Captured image uploaded. URL:", imageUrl);
            // Добавляем URL в массив изображений, чтобы они шифровались вместе с остальными медиа при отправке
            setUploadedImageUrls((prev) => [...prev, imageUrl]);
        } catch (error) {
            console.error("Error sending captured image:", error);
        }
    };
    const capturePhoto = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
            if (blob) {
                await sendCapturedImage(blob);
                closeCameraModal();
            }
        }, "image/jpeg");
    };
    // Аналогично для видео: после записи видео обновляем uploadedFileUrls
    const sendCapturedVideo = async (videoBlob) => {
        try {
            const formData = new FormData();
            formData.append("file", videoBlob, "video.webm");
            const uploadResponse = await fetch("/api/files/upload", {
                method: "POST",
                body: formData,
            });
            if (!uploadResponse.ok) {
                console.error("Video upload failed:", uploadResponse.status);
                return;
            }
            const { url: videoUrl } = await uploadResponse.json();
            console.log("Captured video uploaded. URL:", videoUrl);
            setUploadedFileUrls((prev) => [...prev, videoUrl]);
        } catch (error) {
            console.error("Error sending captured video:", error);
        }
    };
    const startVideoRecording = () => {
        if (!cameraStream) return;
        videoChunks.current = [];
        const recorder = new MediaRecorder(cameraStream, { mimeType: "video/webm" });
        videoRecorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                videoChunks.current.push(event.data);
            }
        };
        recorder.onstop = async () => {
            const videoBlob = new Blob(videoChunks.current, { type: "video/webm" });
            await sendCapturedVideo(videoBlob);
            closeCameraModal();
        };
        recorder.start();
        setIsVideoRecording(true);
    };

    const stopVideoRecording = () => {
        if (videoRecorderRef.current && videoRecorderRef.current.state !== "inactive") {
            videoRecorderRef.current.stop();
            setIsVideoRecording(false);
        }
    };
    const renderMessage = (msg) => {
        const isCurrentUserSender = msg.senderId === currentUserId;
        return (
            <div
                key={msg.id}
                className={`message ${isCurrentUserSender ? "sent" : "received"}`}
                onContextMenu={(e) => handleContextMenu(e, msg)}
            >
                {editingMessage && editingMessage.id === msg.id ? (
                    <div className="edit-message-container">
                        <Input.TextArea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            rows={3}
                            style={{ marginBottom: "8px" }}
                        />
                        <Space>
                            <Button type="primary" onClick={handleSaveEdit}>
                                Сохранить
                            </Button>
                            <Button
                                onClick={() => {
                                    setEditingMessage(null);
                                    setEditedText("");
                                }}
                            >
                                Отменить
                            </Button>
                        </Space>
                    </div>
                ) : (
                    <>
                        <div className="message-bubble">
                            {msg.content && <p className="message-content">{msg.content}</p>}
                            {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                                <div className="image-gallery">
                                    {msg.mediaUrls.map((url, index) => (
                                        <Image
                                            key={index}
                                            width={200}
                                            src={url}
                                            alt={`Uploaded media ${index + 1}`}
                                            style={{ margin: "8px 0" }}
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
                                            style={{ display: "block", margin: "4px 0" }}
                                        >
                                            Download File {index + 1}
                                        </Button>
                                    ))}
                                </div>
                            )}
                            {msg.audioUrl && (
                                <div className="audio-player">
                                    <audio controls>
                                        <source src={msg.audioUrl} type="audio/mpeg" />
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            )}
                        </div>
                        <span className="message-time">{formatTimestamp(msg.timestamp)}</span>
                    </>
                )}
                {contextMenuVisible && selectedMessage?.id === msg.id && (
                    <div
                        className="context-menu"
                        style={{
                            position: "absolute",
                            top: `${menuPosition.y + 5}px`,
                            left: `${menuPosition.x - 300}px`,
                            zIndex: 1000,
                            background: "#fff",
                            border: "1px solid #ccc",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
                            padding: "8px 0",
                            borderRadius: "8px",
                            minWidth: "120px",
                            fontSize: "14px",
                        }}
                    >
                        <div
                            className="context-menu-item"
                            onClick={() => handleEditMessage(msg.id)}
                            style={{
                                padding: "10px 16px",
                                cursor: "pointer",
                                color: "#333",
                                transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                            ✏️ Редактировать
                        </div>
                        <div
                            className="context-menu-item"
                            onClick={() => handleDeleteMessage(msg)}
                            style={{
                                padding: "10px 16px",
                                cursor: "pointer",
                                color: "#e63946",
                                transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#ffe5e5")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                            🗑️ Удалить
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderMessagesOrPlaceholder = () => {
        if (!messages || messages.length === 0) {
            return (
                <div className="no-messages-placeholder">
                    <img
                        src="/src/assets/EmptyChat.svg"
                        alt="No messages"
                        style={{ width: "200px", marginBottom: "10px" }}
                    />
                    <p style={{ color: "#888", fontSize: "18px", textAlign: "center" }}>
                        Напишите свое первое сообщение!
                    </p>
                </div>
            );
        }
        return messages.map((msg) => renderMessage(msg));
    };

    const renderChatPlaceholder = () => {
        if (!selectedChatId) {
            return (
                <div className="no-chat-placeholder">
                    <img src="/src/assets/SelectChat.svg" alt="No chat selected" />
                    <p>Начните общение!</p>
                </div>
            );
        }
        return renderMessagesOrPlaceholder();
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
                                description={lastMessages[chat.id]}
                            />
                        </List.Item>
                    )}
                />
            </Sider>
            <Layout>
                <Content className="chat-content">
                    <div className="chat-messages" onClick={handleCloseContextMenu}>
                        {renderChatPlaceholder()}
                        <div ref={messagesEndRef} />
                    </div>
                    {isEmojiPickerVisible && (
                        <div className="emoji-picker">
                            <Picker
                                onEmojiClick={(emojiObject) => {
                                    console.log("Emoji selected:", emojiObject);
                                    handleEmojiClick(emojiObject);
                                }}
                            />
                        </div>
                    )}
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
                                        <Button
                                            icon={<PictureOutlined />}
                                            shape="circle"
                                            onClick={handleImageModalOpen}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Send File">
                                        <Button
                                            icon={<FileOutlined />}
                                            shape="circle"
                                            onClick={handleFileModalOpen}
                                        />
                                    </Tooltip>
                                    <Tooltip title={isRecording ? `Cancel Recording (${recordingTime}s)` : "Start Recording"}>
                                        <Button
                                            icon={isRecording ? <StopOutlined /> : <AudioOutlined />}
                                            shape="circle"
                                            onClick={isRecording ? stopRecording : startRecording}
                                            type={isRecording ? "danger" : "default"}
                                        />
                                    </Tooltip>
                                    {isRecording && (
                                        <div className="recording-indicator">
                                            <span>Recording: {recordingTime}s</span>
                                            <Button type="link" danger onClick={stopRecording}>
                                                Stop
                                            </Button>
                                        </div>
                                    )}
                                    <Tooltip title="Open Camera">
                                        <Button
                                            icon={<CameraOutlined />}
                                            shape="circle"
                                            onClick={openCameraModal}
                                        />
                                    </Tooltip>
                                    <Button
                                        icon={<SmileOutlined />}
                                        onClick={() => setIsEmojiPickerVisible(!isEmojiPickerVisible)}
                                    />
                                    <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} />
                                </Space>
                            }
                        />
                    </div>
                </Content>
            </Layout>

            {/* Модальное окно для Image Upload */}
            <Modal
                title={<span className="custom-modal-title">Select Image</span>}
                visible={isImageModalVisible}
                onCancel={handleModalClose}
                closable={false}
                footer={null}
            >
                <Upload
                    key={imageModalKey}
                    name="file"
                    accept="image/*"
                    action="/api/files/upload"
                    onRemove={handleImageRemove}
                    onChange={handleImageChange}
                >
                    <Button>Click to Upload Image</Button>
                </Upload>
            </Modal>

            {/* Модальное окно для File Upload */}
            <Modal
                title={<span className="custom-modal-title">Select File</span>}
                visible={isFileModalVisible}
                onCancel={handleModalClose}
                closable={false}
                footer={null}
            >
                <Upload
                    key={fileModalKey}
                    name="file"
                    accept=".txt, .pdf, .doc, .docx, .zip, .rar, .7z, image/*"
                    action="/api/files/upload"
                    onRemove={handleFileRemove}
                    onChange={handleFileChange}
                >
                    <Button icon={<FileOutlined />}>Click to Upload</Button>
                </Upload>
            </Modal>

            {/* Модальное окно для камеры */}
            <Modal
                title={<span className="custom-modal-title">Camera</span>}
                visible={isCameraModalVisible}
                onCancel={closeCameraModal}
                closable={true}
                footer={null}
            >
                <div className="camera-container" style={{ textAlign: "center" }}>
                    <video ref={videoRef} autoPlay playsInline style={{ width: "100%", maxHeight: "400px" }} />
                    <div style={{ marginTop: "16px" }}>
                        <Button onClick={capturePhoto} style={{ marginRight: "8px" }}>
                            Take Photo
                        </Button>
                        {isVideoRecording ? (
                            <Button onClick={stopVideoRecording} type="primary" danger>
                                Stop Recording
                            </Button>
                        ) : (
                            <Button onClick={startVideoRecording} type="primary">
                                Record Video
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>
        </Layout>
    );
}

export default ChatPage;
