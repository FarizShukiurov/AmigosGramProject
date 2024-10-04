import { useState, useEffect } from 'react';
import './Contacts.css';
import AddContactIcon from '/src/assets/AddContact.svg';  // ���� � ������ ���������� ��������
import DeleteIcon from '/src/assets/Delete.svg';  // ���� � ������ �������� ��������
import ContactIcon from '/src/assets/ContactsDark.svg';  // ���� � ������ �������� (�� �������)

const Contacts = () => {
    const [contacts, setContacts] = useState([]);        // ��� ����������� ������
    const [ownContacts, setOwnContacts] = useState([]);  // ��� ����������� ���������
    const [searchText, setSearchText] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // ������� ��� ��������� ����������� ���������
    const fetchOwnContacts = async () => {
        try {
            const response = await fetch(`/contacts/GetContacts`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch own contacts: ${response.statusText}`);
            }

            const ownUsers = await response.json();
            console.log('Fetched own contacts:', ownUsers);  // ��� �������
            setOwnContacts(ownUsers);
            setContacts(ownUsers); // ���������� �������� �� ����������� ��������
        } catch (error) {
            console.error('Error fetching own contacts:', error);
        }
    };

    // ������� ��� ������ ���������
    const fetchContacts = async (searchText) => {
        if (!searchText || searchText.trim() === "") {
            setContacts(ownContacts);  // ���� �����, �������� ����������� ��������
            return;
        }

        try {
            const response = await fetch(`/Account/SearchAccount?nickname=${encodeURIComponent(searchText)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.statusText}`);
            }

            const users = await response.json();
            console.log('Fetched search contacts:', users);  // ��� �������
            setContacts(users);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    };

    // ���������� ��������
    const handleSubmitContact = async (e) => {
        e.preventDefault();

        const emailToSend = selectedUser.email; // ���������� ������ email

        try {
            const response = await fetch(`/contacts/AddContact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailToSend), // ���������� ������ ������
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Failed to add contact: ${errorMessage}`);
            }

            await fetchOwnContacts(); // ��������� ������ ����������� ���������
            closeModal(); // ��������� ����� ����� ��������� ����������
        } catch (error) {
            console.error('Error adding contact:', error);
        }
    };

    // �������� ��������
    const handleDeleteContact = async (contactId) => {
        try {
            const response = await fetch('/contacts/DeleteContact', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ contactId }) // �������� contactId � ���� �������
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Failed to delete contact: ${errorMessage}`);
            }

            // �������� ������ ��������� ����� ��������
            await fetchOwnContacts();
        } catch (error) {
            console.error('Error deleting contact:', error);
        }
    };

    // ��������� ����������� �������� ��� ������������
    useEffect(() => {
        fetchOwnContacts();
    }, []);

    // ������ �� ������� ������ � �������� ������� ������ ��� ���������
    useEffect(() => {
        fetchContacts(searchText);
    }, [searchText]);

    // ������� ��� ����������� ���������� ���� ���������� ��������
    const handleAddContact = (contact) => {
        setSelectedUser(contact);
        setShowModal(true);
    };

    // �������� ���������� ����
    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    // ��������, �������� �� ������� � �����������
    const isContactAdded = (contact) => {
        return ownContacts.some((ownContact) => ownContact.id === contact.id);
    };

    return (
        <div className="contacts-container">
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by username..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </div>

            <div className="contacts-list">
                {contacts.length === 0 ? (
                    <p>No contacts found.</p>
                ) : (
                    contacts.map((contact) => (
                        <div key={contact.id} className="contact-item">
                            <div className="contact-info">
                                <img src={ContactIcon} alt="Contact" className="contact-icon" />
                                <h4>{contact.userName}</h4>
                            </div>
                            {isContactAdded(contact) ? (
                                <button className="delete-contact" onClick={() => handleDeleteContact(contact.id)}>
                                    <img src={DeleteIcon} alt="Delete" className="delete-icon" />
                                </button>
                            ) : (
                                <button className="add-contact" onClick={() => handleAddContact(contact)}>
                                    <img src={AddContactIcon} alt="Add Contact" className="add-icon" />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {showModal && selectedUser && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Add Contact for {selectedUser.userName}</h2>
                        <p>Email: {selectedUser.email}</p>
                        <button onClick={handleSubmitContact}>Add Contact</button>
                        <button onClick={closeModal}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contacts;
