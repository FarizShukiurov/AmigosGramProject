import { useState, useEffect } from 'react';
import './Contacts.css';
import AddContactIcon from '/src/assets/AddContact.svg';
import DeleteIcon from '/src/assets/Delete.svg';
import ContactIcon from '/src/assets/ContactsDark.svg';

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [ownContacts, setOwnContacts] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetailCard, setShowDetailCard] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [contactDetails, setContactDetails] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false); // State to manage confirmation for deletion

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
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.statusText}`);
            }

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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailToSend),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Failed to add contact: ${errorMessage}`);
            }

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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ contactId })
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Failed to delete contact: ${errorMessage}`);
            }

            await fetchOwnContacts();
            closeDetailCard(); // Close the detail card after deletion
        } catch (error) {
            console.error('Error deleting contact:', error);
        }
    };

    useEffect(() => {
        fetchOwnContacts();
    }, []);

    useEffect(() => {
        fetchContacts(searchText);
    }, [searchText]);

    const handleAddContact = (contact) => {
        setSelectedUser(contact);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    const isContactAdded = (contact) => {
        return ownContacts.some((ownContact) => ownContact.id === contact.id);
    };

    const handleAvatarClick = (contact) => {
        setContactDetails(contact);
        setShowDetailCard(true);
    };

    const closeDetailCard = () => {
        setShowDetailCard(false);
        setContactDetails(null);
        setConfirmDelete(false); // Reset confirmation state
    };

    const confirmDeleteContact = (contact) => {
        setContactDetails(contact);
        setConfirmDelete(true); // Show confirmation for deletion
    };

    const handleConfirmDelete = () => {
        if (contactDetails) {
            handleDeleteContact(contactDetails.id);
        }
        closeDetailCard(); // Close the detail card after deletion
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
                                <img
                                    src={contact.avatarUrl || ContactIcon}
                                    alt="Contact"
                                    className="contact-icon"
                                    onClick={() => handleAvatarClick(contact)} // Click to show detail card
                                />
                                <h4>{contact.userName}</h4>
                            </div>
                            {isContactAdded(contact) ? (
                                <button className="delete-contact" onClick={() => confirmDeleteContact(contact)}>
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
                        <h2 className="modal-title">Add Contact for {selectedUser.userName}</h2>
                        <img src={selectedUser.avatarUrl || ContactIcon} alt="Selected User" className="modal-avatar" />
                        <p className="modal-email">Email: {selectedUser.email}</p>
                        <button className="modal-button" onClick={handleSubmitContact}>Add Contact</button>
                        <button className="modal-button close-button" onClick={closeModal}>Close</button>
                    </div>
                </div>
            )}

            {showDetailCard && contactDetails && !confirmDelete && (
                <div className="detail-card">
                    <div className="detail-card-content">
                        <img src={contactDetails.avatarUrl || ContactIcon} alt="Contact" className="detail-avatar" />
                        <h4>{contactDetails.userName}</h4>
                        <p>Email: {contactDetails.email}</p>
                        {/* Add any additional details you want to display */}
                        <button className="detail-card-button close-detail" onClick={closeDetailCard}>Close</button>
                    </div>
                </div>
            )}

            {confirmDelete && contactDetails && (
                <div className="confirmation-dialog">
                    <div className="confirmation-content">
                        <h3>Are you sure you want to delete {contactDetails.userName}?</h3>
                        <button className="confirmation-button confirm" onClick={handleConfirmDelete}>Yes, Delete</button>
                        <button className="confirmation-button cancel" onClick={closeDetailCard}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contacts;
