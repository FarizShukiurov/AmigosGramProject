import { useState, useEffect } from 'react';
import './Contacts.css';

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchContacts = async (searchText) => {
        if (!searchText || searchText.trim() === "") {
            console.error("Search text is empty or invalid.");
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

    useEffect(() => {
        if (searchText.length > 0) {
            fetchContacts(searchText);
        } else {
            setContacts([]);
        }
    }, [searchText]);

    const handleAddContact = (contact) => {
        setSelectedUser(contact);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    const handleSubmitContact = (e) => {
        e.preventDefault();
        closeModal();
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
                {contacts.map(contact => (
                    <div key={contact.id} className="contact-item">
                        <svg className="contact-icon"/>
                        <div>
                            <h4>{contact.userName}</h4>
                        </div>
                        <button className="add-contact" onClick={() => handleAddContact(contact)}>Add Contact</button>
                    </div>
                ))}
            </div>

            {showModal && selectedUser && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Add Contact for {selectedUser.name}</h2>
                        <form onSubmit={handleSubmitContact}>
                            <input type="text" placeholder="First Name" required />
                            <input type="text" placeholder="Last Name" required />
                            <button type="submit">Submit</button>
                        </form>
                        <button onClick={closeModal}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Contacts;