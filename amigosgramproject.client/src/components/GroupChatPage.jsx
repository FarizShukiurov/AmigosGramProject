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
    const [newParticipants, setNewParticipants] = useState([]);
    const [newGroupDescription, setNewGroupDescription] = useState("");
    const [contacts, setContacts] = useState([]);
    const [newGroupAvatar, setNewGroupAvatar] = useState(null);
    const [groupSettings, setGroupSettings] = useState({
        id: null,
        groupName: "",
        avatarUrl: "",
        participants: [],
    });
    const [isRecording, setIsRecording] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await fetch("/api/Contacts/GetContacts");
                if (!response.ok) {
                    throw new Error("Failed to fetch contacts.");
                }
                const data = await response.json();
                setContacts(data);
            } catch (error) {
                console.error("Failed to load contacts:", error);
                antdMessage.error("Failed to load contacts.");
            }
        };
        fetchContacts();
    }, []);

    // ������� ��� �������� ���������
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

    // �������� �������� ������
    const handleOpenGroupSettings = (group) => {
        setGroupSettings(group);
        setGroupSettingsModalVisible(true);
    };
    // �������� ��� ������� � ��� ���
    const handleCloseNewGroupModal = () => {
        setNewGroupModalVisible(false);
        setNewGroupName(""); // �������� ��� ����� ������
        setNewParticipants([]); // �������� ��������� ����������
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

    // ���������� ������ ������
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

    // �������� ������
    const handleDeleteGroup = () => {
        setGroupChats((prevChats) => prevChats.filter((chat) => chat.id !== groupSettings.id));
        setGroupSettingsModalVisible(false);
        antdMessage.success("Group deleted successfully!");
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || !newParticipants.length) {
            antdMessage.warning("Group name and participants are required.");
            return;
        }

        const formData = new FormData();
        formData.append("name", newGroupName);
        formData.append("description", newGroupDescription);
        formData.append("participants", JSON.stringify(newParticipants));
        if (newGroupAvatar) {
            formData.append("avatar", newGroupAvatar);
        }

        try {
            await axios.post("/api/GroupChats/Create", formData);
            antdMessage.success("Group created successfully!");
            setNewGroupModalVisible(false);
            setNewGroupName("");
            setNewGroupDescription("");
            setNewParticipants([]);
            setNewGroupAvatar(null);
        } catch (error) {
            antdMessage.error("Failed to create group.");
        }
    };

    const handleGroupAvatarChange = (file) => {
        setNewGroupAvatar(file);
    };

    // ���������� ���������
    const handleAddParticipant = (contactId) => {
        setGroupSettings((prev) => ({
            ...prev,
            participants: [...prev.participants, contactId],
        }));
    };

    const handleImageChange = (info) => {
        if (info.file.status === "done") {
            const uploadedUrl = info.file.response.url; // ��������������, ��� ������ ���������� URL
            // ���� �������� ������ ��� �������� �����������
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
            // ������ ��� �������� �����
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
        setGroupSettings((prevSettings) => ({
            ...prevSettings,
            participants: [...prevSettings.participants, ...newParticipants],
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
                        chat.groupName.toLowerCase().includes(search.toLowerCase())
                    )}
                    renderItem={(chat) => (
                        <Dropdown overlay={renderGroupMenu(chat)} trigger={['contextMenu']}> 
                        <List.Item
                            onClick={() => setSelectedGroupChatId(chat.id)}  // ���������� ��������� ����
                            className={`chat-item ${chat.id === selectedGroupChatId ? "active" : ""}`}
                        >
                            <List.Item.Meta
                                avatar={<Avatar>{chat.groupName[0]}</Avatar>}  // ����������� ������ ����� ������ ��� ������
                                title={chat.groupName}
                                description={`${chat.participants} Participants`}
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
                                        onClick={handleAddParticipantsModalOpen}  // ������� ��������� ����
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
                                                    onClick={handleImageModalOpen} // ������� ��������� ���� ��� �����������
                                                />
                                            </Tooltip>
                                            <Tooltip title="Send File">
                                                <Button
                                                    icon={<FileOutlined />}
                                                    shape="circle"
                                                    onClick={handleFileModalOpen} // ������� ��������� ���� ��� ������
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
                onCancel={() => setNewGroupModalVisible(false)}
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
                                onClick={() => toggleParticipant(contact.id)}
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
                closable={false}
            >
                <div className="group-avatar-settings">
                    <Avatar size={50} src={groupSettings.avatarUrl}>
                        {groupSettings.groupName[0]}
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
                    value={groupSettings.groupName}
                    onChange={(e) =>
                        setGroupSettings((prev) => ({ ...prev, groupName: e.target.value }))
                    }
                />
                <List
                    dataSource={contacts}
                    renderItem={(contact) => (
                        <List.Item
                            key={contact.id || contact.name} // ���������, ��� ����������� ���������� key
                            onClick={() =>
                                setNewParticipants((prev) =>
                                    prev.includes(contact.id)
                                        ? prev.filter((id) => id !== contact.id)
                                        : [...prev, contact.id]
                                )
                            }
                            className={newParticipants.includes(contact.id) ? "selected" : ""}
                        >
                            <List.Item.Meta
                                avatar={<Avatar>{contact.name[0]}</Avatar>}
                                title={contact.name}
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
            {/* ��������� ���� ��� ����������� */}
            <Modal
                title={<span className="custom-modal-title">Select Image</span>}
                visible={isImageModalVisible}
                onCancel={handleModalClose}
                footer={null}
                closable={false} // ������� �������
            >
                <Upload
                    accept="image/*"
                    action="/api/files/upload"
                    onChange={handleImageChange} // ����� ���� ������� ��� ��������� ���������
                    onRemove={handleImageRemove} // �������� �����
                >
                    <Button>Click to Upload Image</Button>
                </Upload>
            </Modal>

            {/* ��������� ���� ��� ������ */}
            <Modal
                title={<span className="custom-modal-title">Select File</span>}
                visible={isFileModalVisible}
                onCancel={handleModalClose}
                footer={null}
                closable={false} // ������� �������
            >
                <Upload
                    accept=".txt, .pdf, .doc, .docx, .zip, .rar, .7z"
                    action="/api/files/upload"
                    onChange={handleFileChange} // ����� ���� ������� ��� ��������� ���������
                    onRemove={handleFileRemove} // �������� �����
                >
                    <Button icon={<FileOutlined />}>Click to Upload</Button>
                </Upload>
            </Modal>
            <Modal
                title={<span className="custom-modal-title">Add Participants</span>}
                visible={addParticipantsModalVisible}
                onCancel={handleAddParticipantsModalClose}
                footer={null}
                closable={false} // ������� �������
            >
                <List
                    dataSource={contacts}
                    renderItem={(contact) => (
                        <List.Item
                            onClick={() =>
                                setNewParticipants((prev) =>
                                    prev.includes(contact.id)
                                        ? prev.filter((id) => id !== contact.id)
                                        : [...prev, contact.id]
                                )
                            }
                            className={newParticipants.includes(contact.id) ? "selected" : ""}
                        >
                            <List.Item.Meta
                                avatar={<Avatar>{contact.name[0]}</Avatar>}
                                title={contact.name}
                            />
                        </List.Item>
                    )}
                />
                <Button
                    type="primary"
                    onClick={handleAddParticipants}  // ������� ��� ���������� ����������
                    style={{ marginTop: "10px" }}
                >
                    Add Participants
                </Button>
            </Modal>

        </Layout>
    );
};

export default GroupChatPage;
