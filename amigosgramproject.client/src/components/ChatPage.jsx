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
} from "@ant-design/icons";
import Picker from "emoji-picker-react"
import "./ChatPage.css";

const { Sider, Content } = Layout;

function ChatPage() {
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
    const timerRef = useRef(null); // Счетчик времени запис
    const [recordingTime, setRecordingTime] = useState(0);
    const messagesEndRef = useRef(null);
    const [previousChatId, setPreviousChatId] = useState(null); 
    ///
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [editedText, setEditedText] = useState("");
    const [editingMessage, setEditingMessage] = useState(null);

    const [imageModalKey, setImageModalKey] = useState(0);
    const [fileModalKey, setFileModalKey] = useState(0);

    const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);

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
                // Покидаем предыдущую группу, если есть
                if (previousChatId) {
                    await hubConnection.invoke("LeaveGroup", previousChatId);
                    console.log(`Left group: ${previousChatId}`);
                }

                // Присоединяемся к новой группе
                if (selectedChatId) {
                    const newGroupId = getChatGroupId(currentUserId, selectedChatId);
                    await hubConnection.invoke("JoinGroup", newGroupId);
                    console.log(`Joined group: ${newGroupId}`);

                    // Сохраняем идентификатор текущей группы
                    setPreviousChatId(newGroupId);
                }
            } catch (error) {
                console.error("Error switching groups:", error);
            }
        };

        switchGroup();
    }, [hubConnection, selectedChatId, currentUserId]);



    const handleContextMenu = (event, message) => {
        if (message.senderId !== currentUserId) return; // Только для своих сообщений
        event.preventDefault(); // Отключить стандартное меню браузера

        const OFFSET_X = 200; // Смещение меню влево (в пикселях)
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
            setEditingMessage(messageToEdit); // Устанавливаем редактируемое сообщение
            setEditedText(messageToEdit.content); // Заполняем текст для редактирования
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

            // Обновляем только изменённые поля локально, чтобы не затереть медиа
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg.id === updatedMessage.id
                        ? {
                            ...msg, // Сохраняем старые данные
                            content: isContentEmpty ? "" : editedText, // Обновляем текст
                            mediaUrls: msg.mediaUrls, // Сохраняем существующие медиа
                            fileUrls: msg.fileUrls, // Сохраняем файлы
                            audioUrl: msg.audioUrl, // Сохраняем аудио
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

            // Расшифровываем ссылки на медиа
            const decryptedMediaUrls = message.mediaUrlsForSender?.length
                ? await decryptArray(message.mediaUrlsForSender)
                : [];
            console.log(decryptedMediaUrls.length > 0 ? "Decrypted Media URLs:" : "No Media URLs to decrypt.", decryptedMediaUrls);

            // Расшифровываем ссылки на файлы
            const decryptedFileUrls = message.fileUrlsForSender?.length
                ? await decryptArray(message.fileUrlsForSender)
                : [];
            console.log(decryptedFileUrls.length > 0 ? "Decrypted File URLs:" : "No File URLs to decrypt.", decryptedFileUrls);

            // Расшифровываем ссылку на аудио
            const decryptedAudioUrl = message.audioUrlForSender
                ? await decryptMessage(message.audioUrlForSender)
                : null;
            console.log(decryptedAudioUrl ? "Decrypted Audio URL:" : "No Audio URL to decrypt.", decryptedAudioUrl);


            // Формируем DTO с расшифрованными ссылками
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
                // Покидаем предыдущую группу, если есть
                if (previousChatId) {
                    await hubConnection.invoke("LeaveGroup", previousChatId);
                    console.log(`Left group: ${previousChatId}`);
                }

                // Присоединяемся к новой группе
                if (selectedChatId) {
                    const newGroupId = getChatGroupId(currentUserId, selectedChatId);
                    await hubConnection.invoke("JoinGroup", newGroupId);
                    console.log(`Joined group: ${newGroupId}`);

                    // Сохраняем идентификатор текущей группы
                    setPreviousChatId(newGroupId);
                }
            } catch (error) {
                console.error("Error switching groups:", error);
            }
        };

        switchGroup();
    }, [hubConnection, selectedChatId, currentUserId]);

    ///


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

                // Определяем, какие данные нужно расшифровать
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

                // Проверки и расшифровка данных
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

                // Устанавливаем значения по умолчанию в случае ошибки
                receivedMessage.content = "[Error: Unable to decrypt message]";
                receivedMessage.mediaUrls = [];
                receivedMessage.fileUrls = [];
                receivedMessage.audioUrl = null;
            }

            // Обновляем состояние
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

            // Если сообщение зашифровано, расшифровываем текст
            if (updatedMessage.encryptedForSender && updatedMessage.senderId === currentUserId) {
                updatedMessage.content = await decryptMessage(updatedMessage.encryptedForSender);
            } else if (updatedMessage.encryptedForReceiver && updatedMessage.receiverId === currentUserId) {
                updatedMessage.content = await decryptMessage(updatedMessage.encryptedForReceiver);
            }

            // Расшифровываем медиа, файлы и аудио
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

            // Обновляем состояние сообщений
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

            // Загрузка и обработка последнего сообщения для каждого чата
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
                            console.log(lastMessage.mediaUrlsForReceiver)
                            if (encryptedContent != null) {
                                decryptedContent = await decryptMessage(encryptedContent);
                            }
                            else if (lastMessage.audioUrlForReceiver != null) {
                                decryptedContent = "Audio"
                            }
                            else if (lastMessage.mediaUrlsForReceiver != null && lastMessage.mediaUrlsForReceiver.length > 0) {
                                decryptedContent = "Media"
                            }
                            else if (lastMessage.fileUrlsForReceiver != null && lastMessage.fileUrlsForReceiver.length > 0) {
                                decryptedContent = "File"
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

            // Проверяем, есть ли тело ответа
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

                        // Расшифровка контента
                        if (encryptedContent != null) {
                            msg.content = await decryptMessage(encryptedContent);
                        }

                        // Расшифровка медиа и файловых ссылок
                        msg.mediaUrls = encryptedMediaUrls ? await decryptArray(encryptedMediaUrls) : [];
                        msg.fileUrls = encryptedFileUrls ? await decryptArray(encryptedFileUrls) : [];

                        // Расшифровка аудиоссылки
                        msg.audioUrl = encryptedAudioUrl ? await decryptMessage(encryptedAudioUrl) : null;
                    } catch (error) {
                        console.error(`Error decrypting message with ID ${msg.id}:`, error);

                        // Устанавливаем значения по умолчанию в случае ошибки
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

        // Формируем chatId из текущего пользователя (SenderId) и получателя (ReceiverId)
        const chatId = currentUserId < receiverId
            ? `${currentUserId}-${receiverId}`
            : `${receiverId}-${currentUserId}`;

        // Подключение к группе
        if (hubConnection) {
            await hubConnection.invoke("JoinGroup", chatId);
            console.log(`Joined group: ${chatId}`);
        }
    };



    const handleImageChange = (info) => {
        if (info.file.status === "done") {
            const uploadedUrl = info.file.response.url; // Предполагается, что сервер возвращает URL
            setUploadedImageUrls((prev) => [...prev, uploadedUrl]);
            console.log("Image uploaded:", uploadedUrl);
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
        if (info.file.status === "done") {
            const uploadedUrl = info.file.response.url; // Предполагается, что сервер возвращает URL
            setUploadedFileUrls((prev) => [...prev, uploadedUrl]);
            console.log("File uploaded:", uploadedUrl);
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
        // Проверка на пустое сообщение
        if (!message && uploadedImageUrls.length === 0 && uploadedFileUrls.length === 0) {
            console.warn("No content to send");
            return;
        }

        console.log("Message content:", message || "No text");
        console.log("Uploaded image URLs:", uploadedImageUrls);
        console.log("Uploaded file URLs:", uploadedFileUrls);

        try {
            // Получение публичных ключей
            const receiverKeyResponse = await fetch(`/api/Keys/getPublicKey/${selectedChatId}`);
            const senderKeyResponse = await fetch(`/api/Keys/getPublicKey/${currentUserId}`);

            if (!receiverKeyResponse.ok || !senderKeyResponse.ok) {
                throw new Error("Failed to fetch public keys");
            }

            const receiverPublicKey = await receiverKeyResponse.text();
            const senderPublicKey = await senderKeyResponse.text();

            // Шифрование текстового сообщения
            const encryptedForReceiver = message
                ? await encryptMessage(message, receiverPublicKey)
                : null;
            const encryptedForSender = message
                ? await encryptMessage(message, senderPublicKey)
                : null;

            // Шифрование мультимедиа и файлов
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

            // Определение типа сообщения (1 - медиа, 2 - файлы, 0 - текст)
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
                    [selectedChatId]: message || "", // Отображаем текст или ничего
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

        formData.append("audioFile", audioBlob);

        try {
            // Шаг 1: Загрузка аудиофайла
            console.log(audioBlob);
            const uploadResponse = await fetch("/api/Files/uploadAudio", {
                method: "POST",
                body: formData,
            });

            if (!uploadResponse.ok) {
                console.error("Audio upload failed:", uploadResponse.status);
                return;
            }

            const { url: audioUrl } = await uploadResponse.json();

            // Шаг 2: Получение публичных ключей
            const receiverKeyResponse = await fetch(`/api/Keys/getPublicKey/${selectedChatId}`);
            const senderKeyResponse = await fetch(`/api/Keys/getPublicKey/${currentUserId}`);

            if (!receiverKeyResponse.ok || !senderKeyResponse.ok) {
                throw new Error("Failed to fetch public keys");
            }

            const receiverPublicKey = await receiverKeyResponse.text();
            const senderPublicKey = await senderKeyResponse.text();

            // Шаг 3: Шифрование ссылки на аудио
            const encryptedAudioUrlForReceiver = await encryptMessage(audioUrl, receiverPublicKey);
            const encryptedAudioUrlForSender = await encryptMessage(audioUrl, senderPublicKey);

            // Шаг 4: Создание DTO
            const messageDto = {
                senderId: currentUserId,
                receiverId: selectedChatId,
                messageType: 3, // Указываем тип сообщения как аудио
                audioUrlForSender: encryptedAudioUrlForSender, // Зашифрованная ссылка на аудио для отправителя
                audioUrlForReceiver: encryptedAudioUrlForReceiver, // Зашифрованная ссылка на аудио для получателя
            };

            // Шаг 5: Отправка сообщения на сервер
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
            // Запрос на доступ к микрофону
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
                audioChunks.current = []; // Очистка временного хранилища
                sendAudioMessage(audioBlob); // Отправка записанного аудио

                // Остановить поток, чтобы освободить микрофон
                stream.getTracks().forEach((track) => track.stop());
            };

            recorder.start();
            setIsRecording(true);

            // Запуск таймера
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

    const renderMessage = (msg) => {
        const isCurrentUserSender = msg.senderId === currentUserId;

        return (
            <div
                key={msg.id}
                className={`message ${isCurrentUserSender ? "sent" : "received"}`}
                onContextMenu={(e) => handleContextMenu(e, msg)} // Показываем контекстное меню при клике правой кнопкой
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
                        {/* Текстовое сообщение */}
                        {msg.content && <p>{msg.content}</p>}
                        
                        {/* Медиа сообщения */}
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

                        {/* Файловые сообщения */}
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

                        {/* Аудио сообщения */}
                        {msg.audioUrl && (
                            <div className="audio-player">
                                <audio controls>
                                    <source src={msg.audioUrl} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        )}
                    </>
                )}

                {/* Контекстное меню */}
                {contextMenuVisible && selectedMessage?.id === msg.id && (
                    <div
                        className="context-menu"
                        style={{
                            position: "absolute",
                            top: `${menuPosition.y}px`,
                            left: `${menuPosition.x}px`,
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
                            onClick={() => handleEditMessage(msg.id)} // Вызываем редактирование
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
                            onClick={() => handleDeleteMessage(msg)} // Удаляем сообщение
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
                        src="/src/assets/EmptyChat.svg" // Укажите путь к вашему изображению
                        alt="No messages"
                        style={{ width: "200px", marginBottom: "10px" }}
                    />
                    <p style={{ color: "#888", fontSize: "18px", textAlign: "center" }}>
                        Напишите свое первое сообщение!
                    </p>
                </div>
            );
        }

        // Если есть сообщения, отображаем их
        return messages.map((msg) => renderMessage(msg));
    };
    const renderChatPlaceholder = () => {
        if (!selectedChatId) {
            return (
                <div className="no-chat-placeholder">
                    <img
                        src="/src/assets/SelectChat.svg"
                        alt="No chat selected"
                    />
                    <p>
                        Начните общение!
                    </p>
                </div>
            );
        }

        // Если чат выбран, отобразим сообщения
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
                <Content className="chat-content" >
                    <div className="chat-messages" onClick={handleCloseContextMenu}>

                        {renderChatPlaceholder()}
                        {/* Reference to keep the scroll at the bottom */}
                        <div ref={messagesEndRef} />
                    </div>
                    {isEmojiPickerVisible && (
                        <div className="emoji-picker">
                            <Picker
                                onEmojiClick={(emojiObject) => {
                                    console.log("Emoji selected:", emojiObject);
                                    handleEmojiClick(emojiObject);
                                }}/>
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
                                        <Button icon={<PictureOutlined />} shape="circle" onClick={handleImageModalOpen} />
                                    </Tooltip>
                                    <Tooltip title="Send File">
                                        <Button icon={<FileOutlined />} shape="circle" onClick={handleFileModalOpen} />
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

            {/* Модальные окна */}
            <Modal
                title={<span className="custom-modal-title">Select Image</span>}
                visible={isImageModalVisible}
                onCancel={handleModalClose}
                closable={false}
                footer={null}
            >
                <Upload
                    key={imageModalKey} 
                    accept="image/*, .mp4"
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
                    key={fileModalKey}
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