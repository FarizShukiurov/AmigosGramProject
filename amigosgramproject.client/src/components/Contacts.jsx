/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import './Contacts.css';

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Функция для получения пользователей через fetch
    const fetchContacts = async (searchText) => {
        try {
            const response = await fetch(`https://your-api-url.com/api/users?search=${searchText}`);
            if (response.ok) {
                const users = await response.json();
                setContacts(users); // dto
            } else {
                console.error('Failed to fetch users');
            }
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
                        <svg className="contact-icon" /* Your SVG here */ />
                        <div>
                            <h4>{contact.name}</h4>
                            <p>{contact.subhead}</p>
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
