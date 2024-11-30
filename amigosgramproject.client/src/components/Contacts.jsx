import { useState, useEffect } from 'react';
import { Input, List, Avatar, Button, Spin, Tabs, Modal, Popconfirm, Tooltip } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons'; // Добавляем иконку корзины
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
    const [selectedContact, setSelectedContact] = useState(null);


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
        console.log("Fetched contacts:", data);  // Логируем полученные контакты

        // Убедитесь, что каждый контакт имеет ContactId
        setContacts(data.map(contact => {
            console.log(contact.ContactId);  // Логируем ContactId каждого контакта
            return contact;
        }));
    } catch (error) {
        console.error('Error fetching contacts:', error);
    } finally {
        setLoading(false);
    }
};



    // Функция для удаления контакта
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
            if (!response.ok) throw new Error('Failed to fetch contact requests');
            const data = await response.json();
            console.log('Fetched data:', data); // Логирование полученных данных

            // Правильная деструктуризация
            const { incoming, outgoing, blocked } = data;

            // Логируем каждую переменную
            console.log('Incoming:', incoming);
            console.log('Outgoing:', outgoing);
            console.log('Blocked:', blocked);

            // Устанавливаем состояние
            setIncomingRequests(incoming);
            setOutgoingRequests(outgoing);
            setBlockedUsers(blocked);
        } catch (error) {
            console.error('Error fetching contact requests:', error);
        } finally {
            setLoading(false);
        }
    };





    // Функция для обработки поиска
    const handleSearch = async (value) => {
        if (!value) return; // Если поисковое поле пустое, не выполнять запрос
        setLoading(true);
        try {
            // Формируем строку запроса правильно
            const response = await fetch(`/Account/SearchAccount?nickname=${encodeURIComponent(value)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            // Проверка на успешность ответа
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Проверка на тип контента
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

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to respond to contact request: ${errorText}`);
            }

            // После успешного ответа обновляем состояние
            fetchContactRequests();  // Перезагружаем запросы контактов
        } catch (error) {
            console.error('Error responding to contact request:', error);
        } finally {
            setLoading(false);
        }
    };
    // Функция для удаления отправленного запроса
    const handleDeleteRequest = async (contactId) => {
        console.log("Deleting request with ID:", contactId);  // Логируем, какой ID передается

        if (!contactId) {
            console.error("Error: contactId is undefined or invalid.");
            return;  // Если ID не существует, прекращаем выполнение
        }

        setLoading(true);
        try {
            const response = await fetch('/api/Contacts/DeleteContactRequest', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ contactId }),  // Отправляем contactId в теле запроса
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete contact request: ${errorText}`);
            }

            setOutgoingRequests((prevRequests) => prevRequests.filter((req) => req.contactId !== contactId));  // Удаляем запрос из состояния
        } catch (error) {
            console.error('Error deleting contact request:', error);
        } finally {
            setLoading(false);
        }
    };




    // Открытие профиля
    const viewProfile = (profile) => {
        setSelectedProfile(profile);
        setProfileModalVisible(true);
    };

    // Закрытие модального окна профиля
    const closeProfileModal = () => {
        setProfileModalVisible(false);
        setSelectedProfile(null);
    };

    // Функция для отправки запроса на добавление в контакт
    const sendContactRequest = async (contact) => {
        console.log("Sending request for contact:", contact); // Логируем контакт

        setLoading(true);
        try {
            // Формируем DTO, которое соответствует ContactRequestDTO на сервере
            const contactRequestDTO = {
                ContactId: contact.ContactId,   // ID контакта
                UserName: contact.UserName,     // Имя пользователя
                AvatarUrl: contact.AvatarUrl,   // URL аватара пользователя
            };

            console.log("DTO being sent:", contactRequestDTO); // Логируем DTO

            // Отправляем запрос на сервер
            const response = await fetch('/api/Contacts/SendContactRequest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(contactRequestDTO), // Отправляем DTO
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to send contact request: ${errorText}`);
            }

            // После отправки запроса обновляем данные запросов
            fetchContactRequests(); // Обновляем список исходящих запросов
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
                console.log("Rendering contact:", contact);  // Логируем контакт перед рендером
                return (
                    <List.Item className="list-item">
                        <List.Item.Meta
                            avatar={<Avatar src={contact.avatarUrl} icon={!contact.avatarUrl && <UserOutlined />} />}
                            title={contact.userName}
                            description={contact.email}
                        />
                        <div className="actions">
                            <Button onClick={() => viewProfile(contact)}>View Profile</Button>
                            {isContact ? (
                                <Tooltip title="Delete contact">
                                    <Popconfirm
                                        title="Are you sure you want to delete this contact?"
                                        onConfirm={() => {
                                            console.log("Contact being deleted:", contact);
                                            if (contact.contactId) {  // Проверяем contactId
                                                handleDeleteContact(contact.contactId);  // Передаем contactId
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
                            ) : (
                                // Входящие запросы (Incoming Requests)
                                Array.isArray(incomingRequests) && incomingRequests.some((req) => req.contactId === contact.contactId) ? (
                                    <div>
                                        <Button
                                            onClick={() => {
                                                console.log("Accepting request:", contact);
                                                if (contact.contactId) {
                                                    handleRespondToRequest(contact.contactId, "Accept");  // Отправляем запрос на принятие
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
                                                    handleRespondToRequest(contact.contactId, "Decline");  // Отправляем запрос на отклонение
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
                                                    handleRespondToRequest(contact.contactId, "Block");  // Отправляем запрос на блокировку
                                                } else {
                                                    console.error("No contactId available for block:", contact);
                                                }
                                            }}
                                        >
                                            Block
                                        </Button>
                                    </div>
                                ) : (
                                    // Исходящие запросы (Outgoing Requests)
                                    Array.isArray(outgoingRequests) && outgoingRequests.some((req) => req.contactId === contact.contactId) ? (
                                        <Button
                                            onClick={() => {
                                                console.log("Request being deleted:", contact);  // Логируем перед удалением запроса
                                                if (contact.contactId) {
                                                    handleDeleteRequest(contact.contactId);  // Передаем contactId для удаления запроса
                                                } else {
                                                    console.error("No contactId available for request:", contact);
                                                }
                                            }}
                                        >
                                            Delete Request
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => sendContactRequest({
                                                ContactId: contact.contactId,  // Используем contactId
                                                UserName: contact.userName,
                                                AvatarUrl: contact.avatarUrl,
                                            })}
                                        >
                                            Send Request
                                        </Button>
                                    )
                                )
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
                    {/* Кнопка отправки запроса на добавление контакта */}
                    <Button
                        type="primary"
                        onClick={() => sendContactRequest(selectedContact)}
                        disabled={!selectedContact}
                        style={{ marginLeft: 8 }}
                    >
                        Send Request
                    </Button>
                    {loading ? <Spin size="large" /> : renderList(searchResults)}
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
