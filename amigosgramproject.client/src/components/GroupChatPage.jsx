import { useState, useEffect, useRef } from "react";
import {
    Layout,
    Input,
    Button,
    List,
    Avatar,
    Tooltip,
    Modal,
    Space,
    Dropdown,
    Menu,
    message as antdMessage,
    Upload,
    Checkbox,
} from "antd";
import {
    PlusOutlined,
    UserAddOutlined,
    SendOutlined,
    SearchOutlined,
    FileOutlined,
    PictureOutlined,
    AudioOutlined,
    StopOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import "./GroupChatPage.css";

const { Sider, Content } = Layout;

const GroupChatPage = () => {
    const [groupParticipants, setGroupParticipants] = useState([]);
    const [groupChats, setGroupChats] = useState([]);
    const [selectedGroupChatId, setSelectedGroupChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [lastMessages, setLastMessages] = useState({});
    const [imageModalKey, setImageModalKey] = useState(0);
    const [fileModalKey, setFileModalKey] = useState(0);
    const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
    const [uploadedFileUrls, setUploadedFileUrls] = useState([]);
    const [search, setSearch] = useState("");
    const [newGroupModalVisible, setNewGroupModalVisible] = useState(false);
    const [groupSettingsModalVisible, setGroupSettingsModalVisible] = useState(false);
    const [removeParticipantsModalVisible, setRemoveParticipantsModalVisible] = useState(false);
    const [participantsToRemove, setParticipantsToRemove] = useState([]);
    const [addParticipantsModalVisible, setAddParticipantsModalVisible] = useState(false);
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const [isFileModalVisible, setIsFileModalVisible] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDescription, setNewGroupDescription] = useState("");
    const [contacts, setContacts] = useState([]);
    const [currentUserId, setCurrentUserId] = useState();
    const [newGroupAvatar, setNewGroupAvatar] = useState(null);
    const [groupSettings, setGroupSettings] = useState({
        id: null,
        groupName: "",
        avatarUrl: "",
        participants: [],
        encryptionKey: null,
    });
    const [isRecording, setIsRecording] = useState(false);
    const [newParticipants, setNewParticipants] = useState([]);
    const messagesEndRef = useRef(null);

    // Логирование для отладки
    useEffect(() => {
        console.log("GroupChats:", groupChats);
    }, [groupChats]);

    useEffect(() => {
        if (selectedGroupChatId) {
            fetchGroupParticipants(selectedGroupChatId).then((participants) => {
                console.log("Group participants:", participants);
                setGroupParticipants(participants);
            });
        } else {
            setGroupParticipants([]);
        }
    }, [selectedGroupChatId]);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await fetch("/api/Contacts/GetContacts");
                if (!response.ok) {
                    throw new Error("Failed to fetch contacts.");
                }
                const data = await response.json();
                console.log("Fetched contacts:", data);
                setContacts(data);
            } catch (error) {
                console.error("Failed to load contacts:", error);
                antdMessage.error("Failed to load contacts.");
            }
        };

        const fetchUserGroups = async () => {
            if (!currentUserId) return;
            try {
                const response = await fetch(`/api/Group/GetUserGroups?userId=${currentUserId}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch user groups.");
                }
                const groups = await response.json();
                console.log("Fetched groups:", groups);
                setGroupChats(groups);
            } catch (error) {
                console.error("Failed to load user groups:", error);
                antdMessage.error("Failed to load user groups.");
            }
        };

        fetchContacts();
        fetchUserGroups();
    }, [currentUserId]);

    useEffect(() => {
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
        fetchCurrentUserId();
    }, []);

    const handleSendMessage = () => {
        if (!currentMessage.trim()) {
            antdMessage.warning("Message cannot be empty");
            return;
        }
        const newMsg = {
            id: Date.now(),
            senderId: currentUserId,
            content: currentMessage,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMsg]);
        setCurrentMessage("");
        scrollToBottom();
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleOpenGroupSettings = (group) => {
        setGroupSettings(group);
        setGroupSettingsModalVisible(true);
    };

    const handleCloseNewGroupModal = () => {
        setNewGroupModalVisible(false);
        setNewGroupName("");
        setNewGroupDescription("");
        setNewParticipants([]);
    };

    const handleImageModalOpen = () => {
        setIsImageModalVisible(true);
    };

    const handleFileModalOpen = () => {
        setIsFileModalVisible(true);
    };

    const handleModalClose = () => {
        setIsImageModalVisible(false);
        setIsFileModalVisible(false);
    };

    const handleUpdateGroup = () => {
        setGroupChats((prev) =>
            prev.map((chat) =>
                chat.id === groupSettings.id
                    ? { ...chat, groupName: groupSettings.groupName, avatarUrl: groupSettings.avatarUrl }
                    : chat
            )
        );
        setGroupSettingsModalVisible(false);
        antdMessage.success("Group updated successfully!");
    };

    const handleDeleteGroup = () => {
        setGroupChats((prev) => prev.filter((chat) => chat.id !== groupSettings.id));
        setGroupSettingsModalVisible(false);
        antdMessage.success("Group deleted successfully!");
    };

    // Функция для получения публичного ключа пользователя
    const fetchUserPublicKey = async (userId) => {
        try {
            const response = await fetch(`/api/Keys/getPublicKey/${userId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch public key for user ${userId}`);
            }
            const publicKeyBase64 = await response.text();
            const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
            const userPublicKey = await window.crypto.subtle.importKey(
                "spki",
                publicKeyBuffer,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256",
                },
                true,
                ["encrypt"]
            );
            return userPublicKey;
        } catch (error) {
            console.error(`Error fetching public key for user ${userId}:`, error);
            throw error;
        }
    };
    function ensureBase64Padding(base64) {
        // Убираем пробелы, если они есть
        base64 = base64.replace(/\s+/g, "");
        // Добавляем "=" до кратности 4
        while (base64.length % 4 !== 0) {
            base64 += "=";
        }
        return base64;
    }

    function base64ToArrayBuffer(base64) {
        const padded = ensureBase64Padding(base64);
        const binaryString = atob(padded);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    const arrayBufferToBase64 = (buffer) => {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    const encryptGroupKeyForUser = async (groupKey, userPublicKey) => {
        if (!(groupKey instanceof ArrayBuffer)) {
            console.error("Group key must be an ArrayBuffer!", groupKey);
            throw new Error("Group key must be an ArrayBuffer");
        }
        const encryptedKey = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            userPublicKey,
            groupKey
        );
        return arrayBufferToBase64(encryptedKey);
    };

    const generateGroupKey = () => {
        const key = window.crypto.getRandomValues(new Uint8Array(32));
        return key.buffer;
    };

    const prepareEncryptedKeysForGroup = async (groupKey, participants) => {
        const encryptedKeys = {};
        for (const participantId of participants) {
            const userPublicKey = await fetchUserPublicKey(participantId);
            const keyToEncrypt = groupKey instanceof ArrayBuffer ? groupKey : groupKey.buffer;
            const encryptedKey = await encryptGroupKeyForUser(keyToEncrypt, userPublicKey);
            encryptedKeys[participantId] = encryptedKey;
        }
        return encryptedKeys;
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || !newParticipants.length) {
            antdMessage.warning("Group name and participants are required.");
            return;
        }
        try {
            const groupKey = generateGroupKey();
            const allParticipants = [...newParticipants, currentUserId];
            const encryptedKeys = await prepareEncryptedKeysForGroup(groupKey, allParticipants);
            const groupDto = {
                name: newGroupName,
                description: newGroupDescription || "",
                adminId: currentUserId,
                participants: allParticipants.map((participantId) => ({
                    userId: participantId,
                    encryptedGroupKey: encryptedKeys[participantId],
                })),
            };
            const response = await fetch("/api/Group/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(groupDto),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create group: ${errorText}`);
            }
            const { groupId } = await response.json();
            antdMessage.success(`Group created successfully! ID: ${groupId}`);
            setNewGroupModalVisible(false);
            setNewGroupName("");
            setNewGroupDescription("");
            setNewParticipants([]);
        } catch (error) {
            console.error("Error creating group:", error);
            antdMessage.error("Failed to create group.");
        }
    };

    const handleGroupAvatarChange = (file) => {
        setNewGroupAvatar(file);
    };

    const handleImageChange = (info) => {
        if (info.file.status === "done") {
            const uploadedUrl = info.file.response.url;
            console.log("Image uploaded:", uploadedUrl);
        }
    };

    const handleImageRemove = async (file) => {
        try {
            const response = await fetch(`/api/files/delete/${file.response.fileId}`, {
                method: "DELETE",
            });
            if (response.ok) {
                antdMessage.success("Image successfully deleted");
            } else {
                antdMessage.error("Image delete failed");
            }
        } catch (error) {
            antdMessage.error("Image delete failed");
        }
    };

    const handleFileChange = (info) => {
        if (info.file.status === "done") {
            const uploadedUrl = info.file.response.url;
            console.log("File uploaded:", uploadedUrl);
        }
    };

    const handleFileRemove = async (file) => {
        try {
            const response = await fetch(`/api/files/delete/${file.response.fileId}`, {
                method: "DELETE",
            });
            if (response.ok) {
                antdMessage.success("File successfully deleted");
            } else {
                antdMessage.error("File delete failed");
            }
        } catch (error) {
            antdMessage.error("File delete failed");
        }
    };

    const handleAddParticipantsModalOpen = () => {
        setAddParticipantsModalVisible(true);
    };

    const handleAddParticipantsModalClose = () => {
        setAddParticipantsModalVisible(false);
    };
    async function decryptGroupKey(encryptedGroupKey, privateKeyString) {
        // Предполагается, что privateKeyString уже является чистой base64 строкой (без PEM‑заголовков)
        const cleanedPrivateKey = ensureBase64Padding(privateKeyString);
        const privateKeyBuffer = base64ToArrayBuffer(cleanedPrivateKey);

        // Импортируем приватный ключ в формате PKCS#8
        const privateKey = await window.crypto.subtle.importKey(
            "pkcs8",
            privateKeyBuffer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            true,
            ["decrypt"]
        );

        // Конвертируем зашифрованный групповой ключ в ArrayBuffer
        const encryptedKeyBuffer = base64ToArrayBuffer(encryptedGroupKey);

        // Расшифровываем групповой ключ
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedKeyBuffer
        );

        // Возвращаем расшифрованный ключ как ArrayBuffer (при необходимости можно преобразовать его в строку или другой формат)
        return decryptedBuffer;
    };
    // ================== Добавление участников ==================
    const handleAddParticipants = async () => {
        if (!newParticipants.length) {
            antdMessage.warning("No new participants selected.");
            return;
        }
        try {
            // Получаем приватный ключ из localStorage (он должен быть сохранён как чистая base64 строка)
            const currentUserPrivateKeyString = localStorage.getItem("privateKey");
            if (!currentUserPrivateKeyString) {
                throw new Error("Private key not found in localStorage.");
            }

            // Запрашиваем зашифрованный групповой ключ с сервера
            const keyResponse = await fetch(`/api/Group/GetGroupKey/${selectedGroupChatId}/${currentUserId}`);
            if (!keyResponse.ok) {
                throw new Error(`HTTP error! Status: ${keyResponse.status}`);
            }
            console.log("Key Response:", keyResponse);
            const keyData = await keyResponse.json();
            console.log("Key Data:", keyData);
            const encryptedGroupKey = keyData.encryptedGroupKey;
            console.log("Encrypted Group Key:", encryptedGroupKey);

            // Расшифровываем групповой ключ с использованием приватного ключа
            const groupKey = await decryptGroupKey(encryptedGroupKey, currentUserPrivateKeyString);
            console.log("Decrypted Group Key (ArrayBuffer):", groupKey);

            // Подготавливаем зашифрованные ключи для новых участников на основе расшифрованного groupKey
            const encryptedKeys = await prepareEncryptedKeysForGroup(groupKey, newParticipants);
            console.log("Prepared Encrypted Keys:", encryptedKeys);

            // Формируем тело запроса для добавления участников
            const requestBody = {
                groupId: selectedGroupChatId,
                participants: newParticipants.map((participantId) => ({
                    userId: participantId,
                    encryptedGroupKey: encryptedKeys[participantId],
                })),
            };

            console.log("Request body for adding participants:", requestBody);
            const response = await fetch("/api/Group/AddParticipants", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                throw new Error(`Failed to add participants: ${await response.text()}`);
            }
            // Обновляем локальное состояние участников
            const newParticipantsData = newParticipants.map((id) => ({ userId: id }));
            setGroupParticipants((prev) => [...prev, ...newParticipantsData]);
            setNewParticipants([]);
            setAddParticipantsModalVisible(false);
            antdMessage.success("Participants added successfully!");
        } catch (error) {
            console.error("Error adding participants:", error);
            antdMessage.error("Failed to add participants.");
        }
    };

    // Здесь просто отображаем все контакты, без фильтрации
    const renderContactsForModal = () => {
        // Фильтруем контакты, исключая тех, кто уже присутствует в группе.
        const filteredContacts = contacts.filter(
            (contact) =>
                !groupParticipants.some(
                    (participant) =>
                        participant.userId.trim().toLowerCase() === contact.id.trim().toLowerCase()
                )
        );

        if (filteredContacts.length === 0) {
            return <div>No users to add.</div>;
        }

        return (
            <List
                dataSource={filteredContacts}
                renderItem={(contact) => (
                    <List.Item key={contact.id} className="participant-item">
                        <Checkbox
                            checked={newParticipants.includes(contact.id)}
                            onChange={() => toggleParticipant(contact.id)}
                            className="participant-checkbox"
                        />
                        <List.Item.Meta
                            avatar={
                                contact.avatarUrl ? (
                                    <Avatar src={contact.avatarUrl} />
                                ) : (
                                    <Avatar>
                                        {contact.userName
                                            ? contact.userName[0]
                                            : contact.email
                                                ? contact.email[0]
                                                : "?"}
                                    </Avatar>
                                )
                            }
                            title={contact.userName || contact.email || "Unknown"}
                        />
                    </List.Item>
                )}
            />
        );
    };

    const renderRemoveContactsForModal = () => {
        if (!groupParticipants || groupParticipants.length === 0) {
            return <div>No participants available to remove.</div>;
        }

        // Исключаем текущего пользователя из списка участников
        const participantsToRender = groupParticipants.filter(
            (participant) => participant.userId !== currentUserId
        );

        if (participantsToRender.length === 0) {
            return <div>No participants available to remove.</div>;
        }

        return (
            <List
                dataSource={participantsToRender}
                renderItem={(participant) => {
                    // Ищем данные участника в контактах
                    const contact = contacts.find((c) => c.id === participant.userId);
                    const displayName = contact
                        ? (contact.userName || contact.nickname || participant.userId)
                        : (participant.userName || participant.userId);
                    const avatarSrc = contact ? contact.avatarUrl : participant.avatarUrl;

                    return (
                        <List.Item key={participant.userId} className="participant-item">
                            <Checkbox
                                checked={participantsToRemove.includes(participant.userId)}
                                onChange={() => toggleParticipantRemoval(participant.userId)}
                                className="participant-checkbox"
                            />
                            <List.Item.Meta
                                avatar={
                                    avatarSrc ? (
                                        <Avatar src={avatarSrc} />
                                    ) : (
                                        <Avatar>{displayName[0]}</Avatar>
                                    )
                                }
                                title={displayName}
                            />
                        </List.Item>
                    );
                }}
            />
        );
    };

    // Handle для удаления пользователей

    const handleRemoveParticipants = async () => {
        if (participantsToRemove.length === 0) {
            antdMessage.warning("Please select at least one participant to remove.");
            return;
        }

        // Вычисляем список оставшихся участников (исключая удаляемых)
        const remainingParticipants = groupParticipants.filter(
            (participant) => !participantsToRemove.includes(participant.userId)
        );
        const remainingUserIds = remainingParticipants.map((participant) => participant.userId);

        try {
            // Генерируем новый групповой ключ (например, ArrayBuffer)
            const newGroupKey = generateGroupKey();

            // Шифруем новый ключ для каждого оставшегося участника
            // Функция prepareEncryptedKeysForGroup возвращает объект вида: { [userId]: encryptedKey }
            const encryptedKeys = await prepareEncryptedKeysForGroup(newGroupKey, remainingUserIds);

            // Формируем массив обновлённых данных участников
            const updatedParticipants = remainingUserIds.map((userId) => ({
                UserId: userId,
                EncryptedGroupKey: encryptedKeys[userId],
            }));

            // Формируем тело запроса согласно RemoveParticipantsRequest
            const removeRequest = {
                GroupId: selectedGroupChatId,         // Идентификатор группы
                SenderId: currentUserId,                // Идентификатор отправителя (админа)
                ParticipantIds: participantsToRemove,   // Массив id участников для удаления
                UpdatedParticipants: updatedParticipants,
            };

            // Отправляем DELETE-запрос на сервер
            const response = await fetch("/api/Group/RemoveParticipants", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(removeRequest),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            antdMessage.success("Participants removed successfully and group key updated!");

            // Обновляем локальное состояние: удаляем участников из списка группы
            setGroupParticipants(remainingParticipants);
            setParticipantsToRemove([]);
        } catch (error) {
            console.error("Error removing participants:", error);
            antdMessage.error("Failed to remove participants.");
        }
    };


    const toggleParticipant = (contactId) => {
        console.log("Toggling participant:", contactId);
        setNewParticipants((prev) =>
            prev.includes(contactId)
                ? prev.filter((id) => id !== contactId)
                : [...prev, contactId]
        );
    };

    const toggleParticipantRemoval = (participantId) => {
        setParticipantsToRemove((prev) =>
            prev.includes(participantId)
                ? prev.filter((id) => id !== participantId)
                : [...prev, participantId]
        );
    };

    const fetchGroupParticipants = async (groupId) => {
        try {
            const response = await fetch(`/api/Group/GetGroupMembers/${groupId}`);
            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log("Data from fetchGroupParticipants:", data);
            return data;
        } catch (error) {
            console.error(error);
            return [];
        }
    };
    // Функция дешифровки группового сообщения
    const decryptMessage = async (encryptedMessageBase64, groupId, currentUserId) => {
        try {
            console.log("Fetching encrypted group key...");
            // Запрашиваем зашифрованный групповой ключ с сервера
            const groupKeyResponse = await fetch(`/api/Group/GetGroupKey/${groupId}/${currentUserId}`);
            if (!groupKeyResponse.ok) {
                throw new Error("Failed to fetch group key");
            }
            const groupKeyJson = await groupKeyResponse.json();
            const encryptedGroupKeyBase64 = groupKeyJson.encryptedGroupKey;
            console.log("Encrypted group key (base64):", encryptedGroupKeyBase64);

            // Дешифруем групповой ключ с помощью приватного ключа
            const decryptedGroupKeyBuffer = await decryptGroupKey(encryptedGroupKeyBase64);

            // Импортируем расшифрованный групповой ключ как симметричный ключ для AES-GCM
            const symmetricKey = await window.crypto.subtle.importKey(
                "raw",
                decryptedGroupKeyBuffer,
                { name: "AES-GCM" },
                false,
                ["decrypt"]
            );
            console.log("Symmetric group key imported successfully.");

            // Преобразуем зашифрованное сообщение из base64 в Uint8Array
            const encryptedMessageArray = Uint8Array.from(
                atob(encryptedMessageBase64),
                (c) => c.charCodeAt(0)
            );
            console.log("Encrypted message array:", encryptedMessageArray);

            // Предполагаем, что первые 12 байт – это IV для AES-GCM
            const iv = encryptedMessageArray.slice(0, 12);
            const ciphertext = encryptedMessageArray.slice(12).buffer;

            // Дешифруем сообщение с использованием AES-GCM
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                symmetricKey,
                ciphertext
            );
            console.log("Decrypted message buffer:", decryptedBuffer);
            const decoder = new TextDecoder();
            const decryptedMessage = decoder.decode(decryptedBuffer);
            console.log("Decrypted message:", decryptedMessage);
            return decryptedMessage;
        } catch (error) {
            console.error("Error decrypting group message:", error);
            return "[Error: Unable to decrypt message]";
        }
    };
    const decryptArray = async (encryptedArray, groupId, currentUserId) => {
        if (!encryptedArray || encryptedArray.length === 0) return [];
        const decryptedArray = [];
        for (const encryptedItem of encryptedArray) {
            const decryptedItem = await decryptMessage(encryptedItem, groupId, currentUserId);
            decryptedArray.push(decryptedItem);
        }
        return decryptedArray;
    };
    const fetchMessages = async (groupId) => {
        try {
            // Обращаемся к групповому endpoint для получения сообщений группы
            const response = await fetch(`/api/GroupMessage/getMessages?groupId=${groupId}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            if (!response.ok) {
                console.error("Error fetching group messages:", response.status);
                return;
            }
            const messagesData = response.status !== 204 ? await response.json() : [];
            if (!messagesData || messagesData.length === 0) {
                console.warn("No group messages to process.");
                setMessages([]);
                return;
            }
            const decryptedMessages = await Promise.all(
                messagesData.map(async (msg) => {
                    try {
                        // Для групповых сообщений у нас используется единый набор полей.
                        // Если сообщение содержит зашифрованный текст, расшифровываем его:
                        if (msg.EncryptedContent != null) {
                            msg.content = await decryptMessage(msg.EncryptedContent, groupId, currentUserId);
                        }
                        // Аналогично для изображений, файлов и аудио
                        msg.mediaUrls = msg.EncryptedMediaUrls ? await decryptArray(msg.EncryptedMediaUrls, groupId, currentUserId) : [];
                        msg.fileUrls = msg.EncryptedFileUrls ? await decryptArray(msg.EncryptedFileUrls, groupId, currentUserId) : [];
                        msg.audioUrl = msg.EncryptedAudioUrl ? await decryptMessage(msg.EncryptedAudioUrl, groupId, currentUserId) : null;
                        // Приводим время к объекту Date
                        msg.timestamp = new Date(msg.Timestamp);
                    } catch (error) {
                        console.error(`Error decrypting group message with ID ${msg.Id}:`, error);
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
            console.error("An error occurred while fetching group messages:", error);
        }
    };
    const encryptGroupMessage = async (message, symmetricKeyBase64) => {
        try {
            // Преобразуем симметричный ключ из base64 в ArrayBuffer
            const symmetricKeyBuffer = Uint8Array.from(atob(symmetricKeyBase64), c => c.charCodeAt(0)).buffer;
            // Импортируем симметричный ключ для AES-GCM
            const symmetricKey = await window.crypto.subtle.importKey(
                "raw",
                symmetricKeyBuffer,
                { name: "AES-GCM" },
                false,
                ["encrypt"]
            );
            // Генерируем случайный IV (рекомендуется 12 байт для AES-GCM)
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encoder = new TextEncoder();
            const encodedMessage = encoder.encode(message);
            const encryptedBuffer = await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                },
                symmetricKey,
                encodedMessage
            );
            // Объединяем IV и зашифрованные данные, чтобы IV можно было использовать при дешифровке
            const combined = new Uint8Array(iv.byteLength + encryptedBuffer.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encryptedBuffer), iv.byteLength);
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error("Error encrypting group message:", error);
            throw error;
        }
    };
    const encryptArray = async (array, symmetricKeyBase64) => {
        if (!array || array.length === 0) return [];
        const encryptedArray = [];
        for (const item of array) {
            const encryptedItem = await encryptGroupMessage(item, symmetricKeyBase64);
            encryptedArray.push(encryptedItem);
        }
        return encryptedArray;
    };

    // Вспомогательная функция для преобразования ArrayBuffer в base64-строку

    const sendMessage = async () => {
        if (!currentMessage && uploadedImageUrls.length === 0 && uploadedFileUrls.length === 0) {
            console.warn("No content to send");
            return;
        }
        console.log("Message content:", currentMessage || "No text");
        console.log("Uploaded image URLs:", uploadedImageUrls);
        console.log("Uploaded file URLs:", uploadedFileUrls);
        try {
            // Получаем зашифрованный групповой ключ для текущего пользователя
            const groupKeyResponse = await fetch(`/api/Group/GetGroupKey/${selectedGroupChatId}/${currentUserId}`);
            if (!groupKeyResponse.ok) {
                throw new Error("Failed to fetch group key");
            }
            const groupKeyJson = await groupKeyResponse.json();
            const encryptedGroupKey = groupKeyJson.encryptedGroupKey; // Например, "dptcwMxSWl..."
            console.log("Encrypted group key:", encryptedGroupKey);

            // Получаем приватный ключ пользователя из localStorage
            const privateKeyString = localStorage.getItem("privateKey");
            if (!privateKeyString) {
                throw new Error("Private key not found in localStorage");
            }

            // Расшифровываем групповой ключ с помощью функции decryptGroupKey
            const decryptedGroupKeyBuffer = await decryptGroupKey(encryptedGroupKey, privateKeyString);
            // Преобразуем полученный симметричный ключ в base64-строку
            const symmetricKeyBase64 = arrayBufferToBase64(decryptedGroupKeyBuffer);
            console.log("Decrypted symmetric key (base64):", symmetricKeyBase64);

            // Шифруем сообщение, если оно есть, с использованием симметричного ключа
            const encryptedContent = currentMessage
                ? await encryptGroupMessage(currentMessage, symmetricKeyBase64)
                : null;
            // Шифруем ссылки на изображения и файлы
            const encryptedMediaUrls = uploadedImageUrls.length > 0
                ? await encryptArray(uploadedImageUrls, symmetricKeyBase64)
                : [];
            const encryptedFileUrls = uploadedFileUrls.length > 0
                ? await encryptArray(uploadedFileUrls, symmetricKeyBase64)
                : [];
            // Определяем тип сообщения: 1 - изображение, 2 - файл, 0 - текстовое
            const messageType = uploadedImageUrls.length > 0
                ? 1
                : uploadedFileUrls.length > 0
                    ? 2
                    : 0;

            // Формируем DTO для группового сообщения
            const groupMessageDto = {
                senderId: currentUserId,
                groupId: selectedGroupChatId, // Идентификатор группы
                encryptedContent: encryptedContent,
                messageType: messageType,
                encryptedMediaUrls: encryptedMediaUrls,
                encryptedFileUrls: encryptedFileUrls,
            };

            console.log("Sending group message DTO:", groupMessageDto);
            // Отправляем запрос на создание группового сообщения
            const response = await fetch("/api/GroupMessage/createMessage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(groupMessageDto),
            });
            if (response.ok) {
                // Обновляем список сообщений для выбранной группы
                fetchMessages(selectedGroupChatId);
                setLastMessages((prevLastMessages) => ({
                    ...prevLastMessages,
                    [selectedGroupChatId]: currentMessage || "",
                }));
                // Сбрасываем состояние после успешной отправки
                setCurrentMessage(null);
                setUploadedImageUrls([]);
                setUploadedFileUrls([]);
                setImageModalKey((prev) => prev + 1);
                setFileModalKey((prev) => prev + 1);
            } else {
                console.error("Error sending group message:", response.status);
            }
        } catch (error) {
            console.error("Error sending group message:", error);
        }
    };


    const renderGroupMenu = (group) => (
        <Menu>
            <Menu.Item icon={<EditOutlined />} onClick={() => handleOpenGroupSettings(group)}>
                Edit Settings
            </Menu.Item>
        </Menu>
    );

    return (
        <Layout className="group-chat-page">
            <Sider className="sidebar" width={300}>
                <div className="header">
                    <h2>Group Chats</h2>
                    <Tooltip title="Create Group">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={() => setNewGroupModalVisible(true)}
                            className="create-group-button"
                        />
                    </Tooltip>
                </div>
                <div className="search-bar">
                    <Input
                        placeholder="Search Groups"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        prefix={<SearchOutlined />}
                    />
                </div>
                <List
                    itemLayout="horizontal"
                    dataSource={groupChats.filter((chat) =>
                        chat.name?.toLowerCase().includes(search.toLowerCase())
                    )}
                    renderItem={(chat) => (
                        <Dropdown overlay={renderGroupMenu(chat)} trigger={["contextMenu"]}>
                            <List.Item
                                onClick={() => {
                                    setSelectedGroupChatId(chat.id);
                                    setGroupSettings(chat);
                                }}
                                className={`chat-item ${chat.id === selectedGroupChatId ? "active" : ""}`}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar>{chat.name?.[0]}</Avatar>}
                                    title={chat.name}
                                    description={`${chat.participantsCount} Participants`}
                                />
                            </List.Item>
                        </Dropdown>
                    )}
                />
            </Sider>

            <Layout>
                <Content className="chat-content">
                    {selectedGroupChatId ? (
                        <>
                            <div className="chat-header">
                                <Avatar size={50} src={groupSettings.avatarUrl}>
                                    {groupSettings.groupName?.[0]}
                                </Avatar>
                                <h3 className="group-name">{groupSettings.groupName}</h3>
                                <div className="header-buttons">
                                    <Tooltip title="Add Participants">
                                        <Button
                                            type="default"
                                            icon={<UserAddOutlined />}
                                            onClick={handleAddParticipantsModalOpen}
                                            className="add-participants-button"
                                        />
                                    </Tooltip>
                                    <Tooltip title="Remove Participants">
                                        <Button
                                            type="default"
                                            icon={<DeleteOutlined />}
                                            onClick={() => setRemoveParticipantsModalVisible(true)}
                                            className="remove-participants-button"
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                            <div className="chat-messages">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`message ${msg.senderId === currentUserId ? "sent" : "received"}`}
                                    >
                                        <p>{msg.content}</p>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="chat-input">
                                <Input
                                    placeholder="Type your message..."
                                    value={currentMessage}
                                    onChange={(e) => setCurrentMessage(e.target.value)}
                                    suffix={
                                        <Space>
                                            <Tooltip title="Send Image">
                                                <Button icon={<PictureOutlined />} shape="circle" onClick={handleImageModalOpen} />
                                            </Tooltip>
                                            <Tooltip title="Send File">
                                                <Button icon={<FileOutlined />} shape="circle" onClick={handleFileModalOpen} />
                                            </Tooltip>
                                            <Tooltip title={isRecording ? "Stop Recording" : "Start Recording"}>
                                                <Button icon={isRecording ? <StopOutlined /> : <AudioOutlined />} shape="circle" type={isRecording ? "danger" : "default"} />
                                            </Tooltip>
                                            <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage} />
                                        </Space>
                                    }
                                />
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <h3>Select a group chat or create a new one</h3>
                        </div>
                    )}
                </Content>
            </Layout>

            {/* Modal: Create Group */}
            <Modal
                title={<span className="custom-modal-title">Create Group Chat</span>}
                visible={newGroupModalVisible}
                onCancel={handleCloseNewGroupModal}
                footer={null}
                closable={false}
            >
                <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                    <Upload
                        accept="image/*"
                        beforeUpload={(file) => {
                            handleGroupAvatarChange(file);
                            return false;
                        }}
                        showUploadList={false}
                    >
                        <Avatar
                            src={newGroupAvatar ? URL.createObjectURL(newGroupAvatar) : null}
                            size={64}
                            icon={<EditOutlined />}
                            style={{ marginRight: "10px" }}
                        />
                    </Upload>
                    <div style={{ flex: 1 }}>
                        <Input
                            placeholder="Group Name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            style={{ marginBottom: "5px" }}
                        />
                        <Input.TextArea
                            placeholder="Group Description"
                            value={newGroupDescription}
                            onChange={(e) => setNewGroupDescription(e.target.value)}
                        />
                    </div>
                </div>
                <div style={{ maxHeight: "150px", overflowY: "auto", marginTop: "10px" }}>
                    <List
                        dataSource={contacts}
                        renderItem={(contact) => (
                            <List.Item key={contact.id} className={newParticipants.includes(contact.id) ? "selected" : ""}>
                                <Checkbox
                                    checked={newParticipants.includes(contact.id)}
                                    onChange={() => toggleParticipant(contact.id)}
                                    style={{ marginRight: "10px" }}
                                />
                                <List.Item.Meta
                                    avatar={<Avatar src={contact.avatarUrl}></Avatar>}
                                    title={contact.userName}
                                />
                            </List.Item>
                        )}
                    />
                </div>
                <Button type="primary" onClick={handleCreateGroup} style={{ marginTop: "10px" }}>
                    Create Group
                </Button>
            </Modal>

            {/* Modal: Group Settings */}
            <Modal
                title={<span className="custom-modal-title">Group Settings</span>}
                visible={groupSettingsModalVisible}
                onCancel={() => setGroupSettingsModalVisible(false)}
                footer={null}
                closable={true}
            >
                <div className="group-avatar-settings">
                    <Avatar size={50} src={groupSettings?.avatarUrl || null}>
                        {groupSettings?.groupName?.[0] || "?"}
                    </Avatar>
                    <Button icon={<EditOutlined />} onClick={() => document.getElementById("avatar-upload").click()}>
                        Edit Avatar
                    </Button>
                    <input
                        id="avatar-upload"
                        type="file"
                        style={{ display: "none" }}
                        onChange={(e) => handleGroupAvatarChange(e.target.files[0])}
                    />
                </div>
                <Input
                    placeholder="Group Name"
                    value={groupSettings?.groupName || ""}
                    onChange={(e) => setGroupSettings((prev) => ({ ...prev, groupName: e.target.value }))}
                />
                <Input.TextArea
                    placeholder="Group Description"
                    value={groupSettings?.description || ""}
                    onChange={(e) => setGroupSettings((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    style={{ marginTop: "10px" }}
                />
                <div style={{ marginTop: "10px" }}>
                    <Button type="danger" onClick={handleDeleteGroup}>
                        Delete Group
                    </Button>
                    <Button type="primary" onClick={handleUpdateGroup} style={{ marginLeft: "10px" }}>
                        Save Changes
                    </Button>
                </div>
            </Modal>

            {/* Modal: Image Upload */}
            <Modal
                title={<span className="custom-modal-title">Select Image</span>}
                visible={isImageModalVisible}
                onCancel={handleModalClose}
                footer={null}
                closable={false}
            >
                <Upload
                    accept="image/*"
                    action="/api/files/upload"
                    onChange={handleImageChange}
                    onRemove={handleImageRemove}
                >
                    <Button>Click to Upload Image</Button>
                </Upload>
            </Modal>

            {/* Modal: File Upload */}
            <Modal
                title={<span className="custom-modal-title">Select File</span>}
                visible={isFileModalVisible}
                onCancel={handleModalClose}
                footer={null}
                closable={false}
            >
                <Upload
                    accept=".txt, .pdf, .doc, .docx, .zip, .rar, .7z"
                    action="/api/files/upload"
                    onChange={handleFileChange}
                    onRemove={handleFileRemove}
                >
                    <Button icon={<FileOutlined />}>Click to Upload</Button>
                </Upload>
            </Modal>
            {/* Modal: Add Participants */}
            <Modal
                title={<span className="custom-modal-title">Add Participants</span>}
                visible={addParticipantsModalVisible}
                onCancel={handleAddParticipantsModalClose}
                footer={null}
                closable={false}
            >
                {renderContactsForModal()}
                <Button type="primary" onClick={handleAddParticipants} style={{ marginTop: "10px" }}>
                    Add Participants
                </Button>
            </Modal>
            <Modal
                title={<span className="custom-modal-title">Remove Participants</span>}
                visible={removeParticipantsModalVisible}
                onCancel={() => setRemoveParticipantsModalVisible(false)}
                footer={null}
                closable={false}
                className="remove-participants-modal" // Класс для переопределения стилей
            >
                {renderRemoveContactsForModal()}
                <Button
                    type="primary"
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveParticipants}
                    style={{ marginTop: "10px" }}
                >
                    Remove Participants
                </Button>
            </Modal>
        </Layout>
    );
};

export default GroupChatPage;
