import { useState,useEffect, useRef } from "react";
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
import { Checkbox } from "antd";

const { Sider, Content } = Layout;

const GroupChatPage = () => {
    const [groupChats, setGroupChats] = useState([]);
    const [selectedGroupChatId, setSelectedGroupChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [search, setSearch] = useState("");
    const [newGroupModalVisible, setNewGroupModalVisible] = useState(false);
    const [groupSettingsModalVisible, setGroupSettingsModalVisible] = useState(false);
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
    });
    const [isRecording, setIsRecording] = useState(false);
    const [newParticipants, setNewParticipants] = useState([]);
    const messagesEndRef = useRef(null);
    useEffect(() => {
        console.log("Current groupChats state:", groupChats); // Логируйте состояние
    }, [groupChats]);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await fetch("/api/Contacts/GetContacts");
                if (!response.ok) {
                    throw new Error("Failed to fetch contacts.");
                }
                const data = await response.json();
                setContacts(data);
                console.log(data);
            } catch (error) {
                console.error("Failed to load contacts:", error);
                antdMessage.error("Failed to load contacts.");
            }
        };
        fetchContacts();
        const fetchUserGroups = async () => {
            if (!currentUserId) return;

            try {
                const response = await fetch(`/api/Group/GetUserGroups?userId=${currentUserId}`, {
                    method: "GET",
                    headers: { Accept: "application/json" },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch user groups.");
                }

                const groups = await response.json();
                console.log("Fetched groups:", groups); // Логируйте данные
                setGroupChats(groups); // Обновляем состояние
            } catch (error) {
                console.error("Failed to load user groups:", error);
                antdMessage.error("Failed to load user groups.");
            }
        };
        fetchUserGroups();
    }, [currentUserId]);

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

    useEffect(() => {
        fetchCurrentUserId();
    }, [currentUserId]);

    // Функция для отправки сообщений
    const handleSendMessage = () => {
        if (!currentMessage.trim()) {
            antdMessage.warning("Message cannot be empty");
            return;
        }

        const newMessage = {
            id: Date.now(),
            senderId: "currentUserId",
            content: currentMessage,
            timestamp: new Date().toISOString(),
        };

        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setCurrentMessage("");
        scrollToBottom();
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Открытие настроек группы
    const handleOpenGroupSettings = (group) => {
        setGroupSettings(group);
        setGroupSettingsModalVisible(true);
    };
    // Добавьте эту функцию в ваш код
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

    // Обновление данных группы
    const handleUpdateGroup = () => {
        setGroupChats((prevChats) =>
            prevChats.map((chat) =>
                chat.id === groupSettings.id
                    ? { ...chat, groupName: groupSettings.groupName, avatarUrl: groupSettings.avatarUrl }
                    : chat
            )
        );
        setGroupSettingsModalVisible(false);
        antdMessage.success("Group updated successfully!");
    };

    // Удаление группы
    const handleDeleteGroup = () => {
        setGroupChats((prevChats) => prevChats.filter((chat) => chat.id !== groupSettings.id));
        setGroupSettingsModalVisible(false);
        antdMessage.success("Group deleted successfully!");
    };

    const fetchUserPublicKey = async (userId) => {
        try {
            // Отправляем запрос на сервер
            const response = await fetch(`/api/Keys/getPublicKey/${userId}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch public key for user ${userId}`);
            }

            // Получаем публичный ключ в виде строки
            const publicKeyBase64 = await response.text();

            // Преобразуем Base64-строку в ArrayBuffer
            const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);

            // Импортируем публичный ключ для использования в Web Crypto API
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

            return userPublicKey; // Возвращаем импортированный ключ
        } catch (error) {
            console.error(`Error fetching public key for user ${userId}:`, error);
            throw error; // Прокидываем ошибку выше
        }
    };


    // шифровка из бейс в аррей
    const base64ToArrayBuffer = (base64) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };

    // шифровка из аррей в бейс 
    const arrayBufferToBase64 = (buffer) => {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    // шифровка груп ключа для юсера
    const encryptGroupKeyForUser = async (groupKey, userPublicKey) => {
        const encryptedKey = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP",
            },
            userPublicKey, // Публичный ключ участника
            groupKey // Симметричный групповой ключ
        );
        return arrayBufferToBase64(encryptedKey); // Возвращаем зашифрованный ключ в Base64
    };

    // Генерация 256-битного симметричного ключа для группы
    const generateGroupKey = () => {
        const key = window.crypto.getRandomValues(new Uint8Array(32));
        return key; // Uint8Array
    };
    //подготовка списка зашифрованнх ключей для участников 
    const prepareEncryptedKeysForGroup = async (groupKey, participants) => {
        const encryptedKeys = {};

        for (const participantId of participants) {
            // Получаем публичный ключ участника с сервера
            const userPublicKey = await fetchUserPublicKey(participantId);

            // Шифруем групповой ключ для участника
            const encryptedKey = await encryptGroupKeyForUser(groupKey, userPublicKey);

            encryptedKeys[participantId] = encryptedKey; // Сохраняем зашифрованный ключ
        }

        return encryptedKeys; // Возвращаем объект { userId: encryptedKey }
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

            const { groupId } = await response.json(); // Получаем идентификатор группы
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

    // Добавление участника


    const handleImageChange = (info) => {
        if (info.file.status === "done") {
            const uploadedUrl = info.file.response.url; // Предполагается, что сервер возвращает URL
            // Сюда добавьте логику для отправки изображения
            console.log("Image uploaded:", uploadedUrl);
        }
    };

    const handleImageRemove = async (file) => {
        try {
            const response = await fetch(`/api/files/delete/${file.response.fileId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                antdMessage.success('Image successfully deleted');
            } else {
                antdMessage.error('Image delete failed');
            }
        } catch (error) {
            antdMessage.error('Image delete failed');
        }
    };

    const handleFileChange = (info) => {
        if (info.file.status === "done") {
            const uploadedUrl = info.file.response.url;
            // Логика для отправки файла
            console.log("File uploaded:", uploadedUrl);
        }
    };

    const handleFileRemove = async (file) => {
        try {
            const response = await fetch(`/api/files/delete/${file.response.fileId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                antdMessage.success('File successfully deleted');
            } else {
                antdMessage.error('File delete failed');
            }
        } catch (error) {
            antdMessage.error('File delete failed');
        }
    };
    const handleAddParticipantsModalOpen = () => {
        setAddParticipantsModalVisible(true);
    };

    const handleAddParticipantsModalClose = () => {
        setAddParticipantsModalVisible(false);
    };
    const handleAddParticipants = () => {
        const updatedParticipants = [
            ...new Set([...groupSettings.participants, ...newParticipants]), // Убираем дубликаты
        ];
        setGroupSettings((prevSettings) => ({
            ...prevSettings,
            participants: updatedParticipants,
        }));
        setAddParticipantsModalVisible(false);
        antdMessage.success("Participants added successfully!");
    };

    const renderGroupMenu = (group) => (
        <Menu>
            <Menu.Item icon={<EditOutlined />} onClick={() => handleOpenGroupSettings(group)}>
                Edit Settings
            </Menu.Item>
        </Menu>
    );
    const toggleParticipant = (contactId) => {
        console.log("Toggling participant:", contactId);
        setNewParticipants((prev) =>
            prev.includes(contactId)
                ? prev.filter((id) => id !== contactId)
                : [...prev, contactId]
        );
    };

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
                                onClick={() => setSelectedGroupChatId(chat.id)}
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
                                    {groupSettings.groupName[0]}
                                </Avatar>
                                <h3 className="group-name">{groupSettings.groupName}</h3>
                                <Tooltip title="Add Participants">
                                    <Button
                                        type="default"
                                        icon={<UserAddOutlined />}
                                        onClick={handleAddParticipantsModalOpen}  // Открыть модальное окно
                                        className="add-participants-button"
                                    />
                                </Tooltip>

                            </div>
                            <div className="chat-messages">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`message ${msg.senderId === "currentUserId" ? "sent" : "received"}`}
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
                                                <Button
                                                    icon={<PictureOutlined />}
                                                    shape="circle"
                                                    onClick={handleImageModalOpen} // Открыть модальное окно для изображения
                                                />
                                            </Tooltip>
                                            <Tooltip title="Send File">
                                                <Button
                                                    icon={<FileOutlined />}
                                                    shape="circle"
                                                    onClick={handleFileModalOpen} // Открыть модальное окно для файлов
                                                />
                                            </Tooltip>
                                            <Tooltip title={isRecording ? "Stop Recording" : "Start Recording"}>
                                                <Button
                                                    icon={isRecording ? <StopOutlined /> : <AudioOutlined />}
                                                    shape="circle"
                                                    type={isRecording ? "danger" : "default"}
                                                />
                                            </Tooltip>
                                            <Button
                                                type="primary"
                                                icon={<SendOutlined />}
                                                onClick={handleSendMessage}
                                            />
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
                onCancel={() => handleCloseNewGroupModal()}
                footer={null}
                closable={false}
            >
                <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                    <Upload
                        accept="image/*"
                        beforeUpload={(file) => {
                            handleGroupAvatarChange(file);
                            return false; // Prevent automatic upload
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
                            <List.Item
                                className={newParticipants.includes(contact.id) ? "selected" : ""}
                            >
                                <Checkbox
                                    checked={newParticipants.includes(contact.id)}
                                    onChange={() => toggleParticipant(contact.id)}
                                    style={{ marginRight: "10px" }}
                                />
                                <List.Item.Meta
                                    avatar={<Avatar>{contact.userName[0]}</Avatar>}
                                    title={contact.userName}
                                />
                            </List.Item>
                        )}
                    />
                </div>
                <Button
                    type="primary"
                    onClick={handleCreateGroup}
                    style={{ marginTop: "10px" }}
                >
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
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => document.getElementById("avatar-upload").click()}
                    >
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
                    onChange={(e) =>
                        setGroupSettings((prev) => ({ ...prev, groupName: e.target.value }))
                    }
                />

                <Input.TextArea
                    placeholder="Group Description"
                    value={groupSettings?.description || ""}
                    onChange={(e) =>
                        setGroupSettings((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    style={{ marginTop: "10px" }}
                />

                <List
                    dataSource={contacts || []}
                    renderItem={(contact) => (
                        <List.Item>
                            <Checkbox
                                checked={newParticipants.includes(contact.id)}
                                onChange={() => toggleParticipant(contact.id)}
                            />
                            <List.Item.Meta
                                avatar={<Avatar>{contact?.userName?.[0] || contact?.email?.[0] || "?"}</Avatar>}
                                title={contact?.userName || contact?.email || "Unknown"}
                            />
                        </List.Item>
                    )}
                />

                <Button
                    type="danger"
                    style={{ marginTop: "10px" }}
                    onClick={handleDeleteGroup}
                >
                    Delete Group
                </Button>
                <Button
                    type="primary"
                    style={{ marginTop: "10px", marginLeft: "10px" }}
                    onClick={handleUpdateGroup}
                >
                    Save Changes
                </Button>
            </Modal>


            {/* Модальное окно для изображений */}
            <Modal
                title={<span className="custom-modal-title">Select Image</span>}
                visible={isImageModalVisible}
                onCancel={handleModalClose}
                footer={null}
                closable={false} // Убираем крестик
            >
                <Upload
                    accept="image/*"
                    action="/api/files/upload"
                    onChange={handleImageChange} // Здесь ваша функция для обработки изменений
                    onRemove={handleImageRemove} // Удаление файла
                >
                    <Button>Click to Upload Image</Button>
                </Upload>
            </Modal>

            {/* Модальное окно для файлов */}
            <Modal
                title={<span className="custom-modal-title">Select File</span>}
                visible={isFileModalVisible}
                onCancel={handleModalClose}
                footer={null}
                closable={false} // Убираем крестик
            >
                <Upload
                    accept=".txt, .pdf, .doc, .docx, .zip, .rar, .7z"
                    action="/api/files/upload"
                    onChange={handleFileChange} // Здесь ваша функция для обработки изменений
                    onRemove={handleFileRemove} // Удаление файла
                >
                    <Button icon={<FileOutlined />}>Click to Upload</Button>
                </Upload>
            </Modal>
            <Modal
                title={<span className="custom-modal-title">Add Participants</span>}
                visible={addParticipantsModalVisible}
                onCancel={handleAddParticipantsModalClose}
                footer={null}
                closable={false}
            >
                <List
                    dataSource={contacts || []}
                    renderItem={(contact) => (
                        <List.Item className="participant-item">
                            <Checkbox
                                checked={newParticipants.includes(contact.id)}
                                onChange={() => toggleParticipant(contact.id)}
                                className="participant-checkbox" // Класс для чекбокса
                            />
                            <List.Item.Meta
                                avatar={<Avatar>{contact?.userName?.[0] || contact?.email?.[0] || "?"}</Avatar>}
                                title={contact?.userName || contact?.email || "Unknown"}
                            />
                        </List.Item>

                    )}
                />


                <Button
                    type="primary"
                    onClick={handleAddParticipants}
                    style={{ marginTop: "10px" }}
                >
                    Add Participants
                </Button>
            </Modal>



        </Layout>
    );
};

export default GroupChatPage;
