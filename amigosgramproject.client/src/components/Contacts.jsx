import { useState, useEffect } from 'react';
import { Input, List, Avatar, Button, Spin, Tabs, Modal, Popconfirm, Tooltip } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons'; // ��������� ������ �������
import './Contacts.css';

const { TabPane } = Tabs;

const Contacts = () => {
    const [activeTab, setActiveTab] = useState('contacts');
    const [contacts, setContacts] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);

    useEffect(() => {
        console.log("Incoming Requests:", incomingRequests);
        console.log("Outgoing Requests:", outgoingRequests);
        console.log("Blocked Users:", blockedUsers);
        fetchContacts();
        fetchContactRequests();
    }, []);

    const fetchContacts = async () => {
    setLoading(true);
    try {
        const response = await fetch('/api/Contacts/GetContacts', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch contacts');
        }

        const data = await response.json();
        console.log("Fetched contacts:", data);  // �������� ���������� ��������

        // ���������, ��� ������ ������� ����� ContactId
        setContacts(data.map(contact => {
            console.log(contact.ContactId);  // �������� ContactId ������� ��������
            return contact;
        }));
    } catch (error) {
        console.error('Error fetching contacts:', error);
    } finally {
        setLoading(false);
    }
};



    // ������� ��� �������� ��������
    const handleDeleteContact = async (contactId) => {
        setLoading(true);
        try {
            const response = await fetch('/api/Contacts/DeleteContact', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ contactId }),
            });
            if (!response.ok) throw new Error('Failed to delete contact');
            setContacts((prev) => prev.filter((contact) => contact.id !== contactId));
        } catch (error) {
            console.error('Error deleting contact:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchContactRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/Contacts/GetContactRequests', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch contact requests');
            }

            const data = await response.json();
            console.log('Fetched data:', data);

            const { incoming, outgoing, blocked } = data;

            console.log('Incoming:', incoming);
            console.log('Outgoing:', outgoing);
            console.log('Blocked:', blocked);

            setIncomingRequests(incoming || []);
            setOutgoingRequests(outgoing || []);
            setBlockedUsers(blocked || []); // ���������, ��� ������������� ������������ �����������
        } catch (error) {
            console.error('Error fetching contact requests:', error);
        } finally {
            setLoading(false);
        }
    };






    // ������� ��� ��������� ������
    const handleSearch = async (value) => {
        if (!value) return; // ���� ��������� ���� ������, �� ��������� ������
        setLoading(true);
        try {
            // ��������� ������ ������� ���������
            const response = await fetch(`/Account/SearchAccount?nickname=${encodeURIComponent(value)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            // �������� �� ���������� ������
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // �������� �� ��� ��������
            const contentType = response.headers.get('Content-Type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response');
            }

            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Error searching accounts:', error);
            alert('There was an issue with the search. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleRespondToRequest = async (requestId, action) => {
        setLoading(true);
        console.log(requestId, "Handling request action:", action);

        try {
            const response = await fetch('/api/Contacts/RespondToContactRequest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ContactId: requestId,
                    Action: action,
                }),
            });

            const responseBody = await response.text();
            let result;

            if (!response.ok) {
                throw new Error(`Failed to respond to contact request: ${responseBody}`);
            }

            try {
                result = JSON.parse(responseBody);
            } catch (jsonError) {
                console.log("Server returned non-JSON response. Using fallback.");
                result = { message: responseBody };
            }

            if (action === "Block") {
                const blockedUser = result.blockedUser || { contactId: requestId };
                console.log("Adding to blockedUsers:", blockedUser);

                setBlockedUsers((prevBlockedUsers) => {
                    if (!Array.isArray(prevBlockedUsers)) {
                        console.warn("blockedUsers was not an array. Reinitializing as empty array.");
                        return [blockedUser];
                    }
                    return [...prevBlockedUsers, blockedUser];
                });
            }

            fetchContactRequests(); // ��������� ������
        } catch (error) {
            console.error('Error responding to contact request:', error);
        } finally {
            setLoading(false);
        }
    };




    // ������� ��� �������� ������������� �������
    const handleDeleteRequest = async (contactId) => {
        console.log("Deleting request with ID:", contactId);  // ��������, ����� ID ����������

        if (!contactId) {
            console.error("Error: contactId is undefined or invalid.");
            return;  // ���� ID �� ����������, ���������� ����������
        }

        setLoading(true);
        try {
            const response = await fetch('/api/Contacts/DeleteContactRequest', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ contactId }),  // ���������� contactId � ���� �������
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete contact request: ${errorText}`);
            }

            setOutgoingRequests((prevRequests) => prevRequests.filter((req) => req.contactId !== contactId));  // ������� ������ �� ���������
        } catch (error) {
            console.error('Error deleting contact request:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnblockUser = async (contactId) => {
        if (!contactId) {
            console.error("Invalid contactId provided for unblock.");
            return;
        }

        setLoading(true); // �������� ��������
        try {
            const response = await fetch('/api/Contacts/UnblockContact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ contactId }), // ������� ID ��������
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to unblock user: ${errorText}`);
            }

            console.log(`User with contactId ${contactId} successfully unblocked.`);

            // ������� ������������ �� ������ ���������������
            setBlockedUsers((prevBlockedUsers) =>
                prevBlockedUsers.filter((user) => user.contactId !== contactId)
            );

            // ��������� ������ ������ �������� � ���������
            fetchContactRequests();
        } catch (error) {
            console.error('Error unblocking user:', error);
        } finally {
            setLoading(false); // ��������� ��������
        }
    };



    // �������� �������
    const viewProfile = (profile) => {
        setSelectedProfile(profile);
        setProfileModalVisible(true);
    };

    // �������� ���������� ���� �������
    const closeProfileModal = () => {
        setProfileModalVisible(false);
        setSelectedProfile(null);
    };

    // ������� ��� �������� ������� �� ���������� � �������
    const sendContactRequest = async (contact) => {
        console.log("Sending request for contact:", contact); // �������� �������

        setLoading(true);
        try {
            // ��������� DTO, �������� ���� Status
            const contactRequestDTO = {
                ContactId: contact.ContactId,   // ID ��������
                UserName: contact.UserName,     // ��� ������������
                AvatarUrl: contact.AvatarUrl,   // URL ������� ������������
                Status: 0,              // ��������� ������ �������
            };

            console.log("DTO being sent:", contactRequestDTO); // �������� DTO

            // ���������� ������ �� ������
            const response = await fetch('/api/Contacts/SendContactRequest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(contactRequestDTO), // ���������� DTO
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to send contact request: ${errorText}`);
            }

            console.log('Contact request successfully sent.');

            // ����� �������� ������� ��������� ������ ��������
            fetchContactRequests(); // ��������� ������ ��������� ��������
        } catch (error) {
            console.error('Error sending contact request:', error);
        } finally {
            setLoading(false);
        }
    };





    const renderList = (list, isContact = false) => (
        <List
            dataSource={list}
            renderItem={(contact) => {
                console.log("Rendering contact:", contact); // �������� ������� ����� ��������

                const isRequestSent = Array.isArray(outgoingRequests) && outgoingRequests.some((req) => req.contactId === contact.contactId);
                const isIncomingRequest = Array.isArray(incomingRequests) && incomingRequests.some((req) => req.contactId === contact.contactId);
                const isBlocked = Array.isArray(blockedUsers) && blockedUsers.some((blocked) => blocked.contactId === contact.contactId);

                return (
                    <List.Item className="list-item">
                        <List.Item.Meta
                            avatar={<Avatar src={contact.avatarUrl} icon={!contact.avatarUrl && <UserOutlined />} />}
                            title={contact.userName}
                            description={contact.email}
                        />
                        <div className="actions">
                            <Button onClick={() => viewProfile(contact)}>View Profile</Button>
                            {isBlocked ? (
                                // ������������� ������������
                                <Tooltip title="Unblock user">
                                    <Popconfirm
                                        title="Are you sure you want to unblock this user?"
                                        onConfirm={() => {
                                            console.log("Unblocking user:", contact);
                                            if (contact.contactId) {
                                                handleUnblockUser(contact.contactId); // �������������� ������������
                                            } else {
                                                console.error("No contactId available for unblock:", contact);
                                            }
                                        }}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <Button>Unblock</Button>
                                    </Popconfirm>
                                </Tooltip>
                            ) : isContact ? (
                                // ��������
                                <Tooltip title="Delete contact">
                                    <Popconfirm
                                        title="Are you sure you want to delete this contact?"
                                        onConfirm={() => {
                                            console.log("Contact being deleted:", contact);
                                            if (contact.id) {
                                                handleDeleteContact(contact.id); // ������� �������
                                            } else {
                                                console.error("No contactId available for this contact:", contact);
                                            }
                                        }}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <Button icon={<DeleteOutlined />} danger />
                                    </Popconfirm>
                                </Tooltip>
                            ) : isIncomingRequest ? (
                                // �������� �������
                                <div>
                                    <Button
                                        onClick={() => {
                                            console.log("Accepting request:", contact);
                                            if (contact.contactId) {
                                                handleRespondToRequest(contact.contactId, "Accept"); // ������� ������
                                            } else {
                                                console.error("No contactId available for accept:", contact);
                                            }
                                        }}
                                    >
                                        Accept
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            console.log("Declining request:", contact);
                                            if (contact.contactId) {
                                                handleRespondToRequest(contact.contactId, "Decline"); // ��������� ������
                                            } else {
                                                console.error("No contactId available for decline:", contact);
                                            }
                                        }}
                                    >
                                        Decline
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            console.log("Blocking request:", contact);
                                            if (contact.contactId) {
                                                handleRespondToRequest(contact.contactId, "Block"); // ������������� ������
                                            } else {
                                                console.error("No contactId available for block:", contact);
                                            }
                                        }}
                                    >
                                        Block
                                    </Button>
                                </div>
                            ) : isRequestSent ? (
                                // ��������� �������
                                <Button
                                    onClick={() => {
                                        console.log("Request being deleted:", contact);
                                        if (contact.contactId) {
                                            handleDeleteRequest(contact.contactId); // ������� ������
                                        } else {
                                            console.error("No contactId available for request:", contact);
                                        }
                                    }}
                                >
                                    Delete Request
                                </Button>
                            ) : (
                                // ����� ������
                                <Button
                                    onClick={() =>
                                        sendContactRequest({
                                            ContactId: contact.id,
                                            UserName: contact.userName,
                                            AvatarUrl: contact.avatarUrl,
                                        })
                                    }
                                >
                                    Send Request
                                </Button>
                            )}
                        </div>
                    </List.Item>
                );
            }}
        />
    );


    return (
        <div className="contacts-page">
            <h1 className="page-title">Contacts</h1>
            <Tabs activeKey={activeTab} onChange={setActiveTab} className="tabs-container">
                <TabPane tab="Contacts" key="contacts">
                    {loading ? <Spin size="large" /> : renderList(contacts, true)}
                </TabPane>
                <TabPane tab="Search" key="search">
                    <Input.Search
                        placeholder="Search for users..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onSearch={handleSearch}
                        className="search-input"
                    />
                    {loading ? (
                        <Spin size="large" />
                    ) : (
                        <List
                            dataSource={searchResults}
                            renderItem={(contact) => {
                                console.log("Rendering contact:", contact);

                                // ��������� �������, ����� ���������� ��������� ��������
                                if (contacts.some((c) => c.contactId === contact.contactId)) {
                                    // ���� ������� ��� ��������
                                    return (
                                        <List.Item className="list-item">
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar
                                                        src={contact.avatarUrl}
                                                        icon={!contact.avatarUrl && <UserOutlined />}
                                                    />
                                                }
                                                title={contact.userName}
                                                description={contact.email}
                                            />
                                            <div className="actions">
                                                <Button onClick={() => viewProfile(contact)}>
                                                    View Profile
                                                </Button>
                                                <Tooltip title="Delete contact">
                                                    <Popconfirm
                                                        title="Are you sure you want to delete this contact?"
                                                        onConfirm={() => handleDeleteContact(contact.contactId)}
                                                        okText="Yes"
                                                        cancelText="No"
                                                    >
                                                        <Button danger>Delete Contact</Button>
                                                    </Popconfirm>
                                                </Tooltip>
                                            </div>
                                        </List.Item>
                                    );
                                } else if (
                                    incomingRequests.some((req) => req.contactId === contact.contactId)
                                ) {
                                    // ���� ��� �������� ������
                                    return (
                                        <List.Item className="list-item">
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar
                                                        src={contact.avatarUrl}
                                                        icon={!contact.avatarUrl && <UserOutlined />}
                                                    />
                                                }
                                                title={contact.userName}
                                                description={contact.email}
                                            />
                                            <div className="actions">
                                                <Button onClick={() => handleRespondToRequest(contact.id, "Accept")}>
                                                    Accept
                                                </Button>
                                                <Button onClick={() => handleRespondToRequest(contact.id, "Decline")}>
                                                    Decline
                                                </Button>
                                                <Button onClick={() => handleRespondToRequest(contact.id, "Block")}>
                                                    Block
                                                </Button>
                                            </div>
                                        </List.Item>
                                    );
                                } else if (
                                    outgoingRequests.some((req) => req.contactId === contact.id)
                                ) {
                                    // ���� ��� ��������� ������
                                    return (
                                        <List.Item className="list-item">
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar
                                                        src={contact.avatarUrl}
                                                        icon={!contact.avatarUrl && <UserOutlined />}
                                                    />
                                                }
                                                title={contact.userName}
                                                description={contact.email}
                                            />
                                            <div className="actions">
                                                <Button onClick={() => handleDeleteRequest(contact.id)}>
                                                    Delete Request
                                                </Button>
                                            </div>
                                        </List.Item>
                                    );
                                } else {
                                    // ���� ������� �� � ������� (����� ������)
                                    return (
                                        <List.Item className="list-item">
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar
                                                        src={contact.avatarUrl}
                                                        icon={!contact.avatarUrl && <UserOutlined />}
                                                    />
                                                }
                                                title={contact.userName}
                                                description={contact.email}
                                            />
                                            <div className="actions">
                                                <Button
                                                    onClick={() =>
                                                        sendContactRequest({
                                                            ContactId: contact.id,
                                                            UserName: contact.userName,
                                                            AvatarUrl: contact.avatarUrl,
                                                        })
                                                    }
                                                >
                                                    Send Request
                                                </Button>
                                            </div>
                                        </List.Item>
                                    );
                                }
                            }}
                        />
                    )}
                </TabPane>


                <TabPane tab="Outgoing Requests" key="outgoing">
                    {loading ? <Spin size="large" /> : renderList(outgoingRequests)}
                </TabPane>
                <TabPane tab="Incoming Requests" key="incoming">
                    {loading ? <Spin size="large" /> : renderList(incomingRequests)}
                </TabPane>
                <TabPane tab="Blocked" key="blocked">
                    {loading ? <Spin size="large" /> : renderList(blockedUsers)}
                </TabPane>
            </Tabs>

            <Modal
                visible={profileModalVisible}
                onCancel={closeProfileModal}
                footer={null}
                className="profile-modal"
            >
                {selectedProfile && (
                    <div className="profile-content">
                        <Avatar size={80} src={selectedProfile.avatarUrl} icon={!selectedProfile.avatarUrl && <UserOutlined />} />
                        <h2 className="profile-name">{selectedProfile.userName}</h2>
                        <p className="profile-email">{selectedProfile.email}</p>
                        <p className="profile-bio">{selectedProfile.bio}</p>
                    </div>
                )}
            </Modal>
        </div>

    );
};

export default Contacts;
