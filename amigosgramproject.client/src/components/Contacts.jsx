import { useState, useEffect } from 'react';
import './Contacts.css';
import AddContactIcon from '/src/assets/AddContact.svg';  // Путь к иконке добавления контакта
import DeleteIcon from '/src/assets/Delete.svg';  // Путь к иконке удаления контакта
import ContactIcon from '/src/assets/ContactsDark.svg';  // Путь к иконке контакта (по желанию)

const Contacts = () => {
    const [contacts, setContacts] = useState([]);        // Для результатов поиска
    const [ownContacts, setOwnContacts] = useState([]);  // Для собственных контактов
    const [searchText, setSearchText] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Функция для получения собственных контактов
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
            console.log('Fetched own contacts:', ownUsers);  // Для отладки
            setOwnContacts(ownUsers);
            setContacts(ownUsers); // Установите контакты на собственные контакты
        } catch (error) {
            console.error('Error fetching own contacts:', error);
        }
    };

    // Функция для поиска контактов
    const fetchContacts = async (searchText) => {
        if (!searchText || searchText.trim() === "") {
            setContacts(ownContacts);  // Если пусто, показать собственные контакты
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
            console.log('Fetched search contacts:', users);  // Для отладки
            setContacts(users);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    };

    // Добавление контакта
    const handleSubmitContact = async (e) => {
        e.preventDefault();

        const emailToSend = selectedUser.email; // Отправляем строку email

        try {
            const response = await fetch(`/contacts/AddContact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailToSend), // Отправляем только строку
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Failed to add contact: ${errorMessage}`);
            }

            await fetchOwnContacts(); // Обновляем список собственных контактов
            closeModal(); // Закрываем модал после успешного добавления
        } catch (error) {
            console.error('Error adding contact:', error);
        }
    };

    // Удаление контакта
    const handleDeleteContact = async (contactId) => {
        try {
            const response = await fetch('/contacts/DeleteContact', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ contactId }) // Передаем contactId в теле запроса
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Failed to delete contact: ${errorMessage}`);
            }

            // Обновите список контактов после удаления
            await fetchOwnContacts();
        } catch (error) {
            console.error('Error deleting contact:', error);
        }
    };

    // Загружаем собственные контакты при монтировании
    useEffect(() => {
        fetchOwnContacts();
    }, []);

    // Следим за строкой поиска и вызываем функцию поиска при изменении
    useEffect(() => {
        fetchContacts(searchText);
    }, [searchText]);

    // Функция для отображения модального окна добавления контакта
    const handleAddContact = (contact) => {
        setSelectedUser(contact);
        setShowModal(true);
    };

    // Закрытие модального окна
    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    // Проверка, добавлен ли контакт в собственные
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
