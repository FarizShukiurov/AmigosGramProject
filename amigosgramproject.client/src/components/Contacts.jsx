import { useState, useEffect } from 'react';
import { Input, List, Avatar, Modal, Button, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import './Contacts.css';

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [ownContacts, setOwnContacts] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [contactDetails, setContactDetails] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const fetchOwnContacts = async () => {
        try {
            const response = await fetch(`/contacts/GetContacts`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) throw new Error(`Failed to fetch own contacts: ${response.statusText}`);
            const ownUsers = await response.json();
            setOwnContacts(ownUsers);
            setContacts(ownUsers);
        } catch (error) {
            console.error('Error fetching own contacts:', error);
        }
    };

    const fetchContacts = async (searchText) => {
        if (!searchText || searchText.trim() === "") {
            setContacts(ownContacts);
            return;
        }
        try {
            const response = await fetch(`/Account/SearchAccount?nickname=${encodeURIComponent(searchText)}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
            const users = await response.json();
            setContacts(users);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    };

    const handleSubmitContact = async (e) => {
        e.preventDefault();
        const emailToSend = selectedUser.email;

        try {
            const response = await fetch(`/contacts/AddContact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailToSend)
            });

            if (!response.ok) throw new Error(`Failed to add contact: ${await response.text()}`);
            await fetchOwnContacts();
            closeModal();
        } catch (error) {
            console.error('Error adding contact:', error);
        }
    };

    const handleDeleteContact = async (contactId) => {
        try {
            const response = await fetch('/contacts/DeleteContact', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contactId })
            });

            if (!response.ok) throw new Error(`Failed to delete contact: ${await response.text()}`);
            await fetchOwnContacts();
            closeDetailCard();
        } catch (error) {
            console.error('Error deleting contact:', error);
        }
    };

    useEffect(() => { fetchOwnContacts(); }, []);
    useEffect(() => { fetchContacts(searchText); }, [searchText]);

    const handleAddContact = (contact) => {
        setSelectedUser(contact);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    const isContactAdded = (contact) => ownContacts.some((ownContact) => ownContact.id === contact.id);

    const handleAvatarClick = (contact) => {
        setContactDetails(contact);
    };

    const closeDetailCard = () => {
        setContactDetails(null);
        setConfirmDelete(false);
    };

    return (
        <div className="contacts-container">
            {/* Search Input */}
            <Input.Search
                placeholder="Search by username..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="ant-input-search"
                style={{ marginBottom: '16px', width: '100%', }}
            />

            {/* Contacts List */}
            <List
                itemLayout="horizontal"
                dataSource={contacts}
                renderItem={contact => (
                    <List.Item
                        className="ant-list-item"
                        actions={[
                            isContactAdded(contact) ? (
                                <Popconfirm
                                    title={`Are you sure you want to delete ${contact.userName}?`}
                                    onConfirm={() => handleDeleteContact(contact.id)}
                                    okText="Yes"
                                    cancelText="No"
                                >
                                    <Button
                                        icon={<DeleteOutlined />}
                                        type="danger"
                                        className="contact-delete-btn"
                                    />
                                </Popconfirm>
                            ) : (
                                <Button
                                    icon={<PlusOutlined />}
                                    onClick={() => handleAddContact(contact)}
                                />
                            )
                        ]}
                    >
                        <List.Item.Meta
                            avatar={
                                <Avatar
                                    src={contact.avatarUrl}
                                    icon={!contact.avatarUrl ? <UserOutlined /> : undefined}
                                    onClick={() => handleAvatarClick(contact)}
                                    className="contact-avatar"
                                />
                            }
                            title={contact.userName}
                            description={contact.email}
                        />
                    </List.Item>
                )}
            />
            <Modal
                title={<span className="custom-modal-title">Add Contact for {selectedUser?.userName}</span>}
                visible={showModal}
                onCancel={closeModal}
                onOk={handleSubmitContact}
                okText="Add Contact"
            >
                <Avatar
                    size={64}
                    src={selectedUser?.avatarUrl}
                    icon={!selectedUser?.avatarUrl ? <UserOutlined /> : undefined}
                    className="modal-avatar"
                />
                <p>Email: {selectedUser?.email}</p>
            </Modal>

            {/* Contact Details Modal */}
            <Modal
                title={contactDetails?.userName}
                visible={!!contactDetails && !confirmDelete}
                onCancel={closeDetailCard}
                footer={[
                    <Button key="close" onClick={closeDetailCard}>Close</Button>,
                    <Button
                        key="delete"
                        type="danger"
                        onClick={() => setConfirmDelete(true)}
                    >
                        Delete Contact
                    </Button>
                ]}
            >
                <Avatar
                    size={64}
                    src={contactDetails?.avatarUrl}
                    icon={!contactDetails?.avatarUrl ? <UserOutlined /> : undefined}
                    className="detail-avatar"
                />
                <p>Email: {contactDetails?.email}</p>
            </Modal>
        </div>

    );
};

export default Contacts;
