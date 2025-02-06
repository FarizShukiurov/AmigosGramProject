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

    const base64ToArrayBuffer = (base64) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };

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

    // ================== Добавление участников ==================
    const handleAddParticipants = async () => {
        if (!newParticipants.length) {
            antdMessage.warning("No new participants selected.");
            return;
        }
        try {
            // Добавлено: если в groupSettings нет encryptionKey, генерируем новый ключ и сохраняем его
            let groupKey = groupSettings.encryptionKey;
            if (!groupKey) {
                groupKey = generateGroupKey();
                setGroupSettings((prev) => ({ ...prev, encryptionKey: groupKey }));
            }
            const encryptedKeys = await prepareEncryptedKeysForGroup(groupKey, newParticipants);
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
        return (
            <List
                dataSource={contacts}
                renderItem={(contact) => (
                    <List.Item key={contact.id} className="participant-item">
                        <Checkbox
                            checked={newParticipants.includes(contact.id)}
                            onChange={() => toggleParticipant(contact.id)}
                            className="participant-checkbox"
                        />
                        <List.Item.Meta
                            avatar={
                                <Avatar>
                                    {contact.userName
                                        ? contact.userName[0]
                                        : contact.email
                                            ? contact.email[0]
                                            : "?"}
                                </Avatar>
                            }
                            title={contact.userName || contact.email || "Unknown"}
                        />
                    </List.Item>
                )}
            />
        );
    };

    const toggleParticipant = (contactId) => {
        console.log("Toggling participant:", contactId);
        setNewParticipants((prev) =>
            prev.includes(contactId)
                ? prev.filter((id) => id !== contactId)
                : [...prev, contactId]
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
                                <Tooltip title="Add Participants">
                                    <Button
                                        type="default"
                                        icon={<UserAddOutlined />}
                                        onClick={handleAddParticipantsModalOpen}
                                        className="add-participants-button"
                                    />
                                </Tooltip>
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
                                    avatar={<Avatar>{contact.userName?.[0]}</Avatar>}
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
                <List
                    dataSource={contacts || []}
                    renderItem={(contact) => (
                        <List.Item key={contact.id}>
                            <Checkbox
                                checked={newParticipants.includes(contact.id)}
                                onChange={() => toggleParticipant(contact.id)}
                            />
                            <List.Item.Meta
                                avatar={<Avatar>{contact.userName?.[0] || contact.email?.[0] || "?"}</Avatar>}
                                title={contact.userName || contact.email || "Unknown"}
                            />
                        </List.Item>
                    )}
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
        </Layout>
    );
};

export default GroupChatPage;
