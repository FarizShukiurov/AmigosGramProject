# AmigosGramProject

**AmigosGramProject** is a cutting-edge real-time chat application that provides a seamless and secure platform for communication. Designed with a focus on usability, speed, and security, the project enables users to exchange messages, share media, and maintain private, encrypted conversations.

## Key Features

### Messaging
- **Real-Time Communication**: Messages are delivered instantly using SignalR for real-time updates.
- **Message Editing and Deletion**: Modify or delete previously sent messages effortlessly.
- **Dynamic Group Switching**: Join and switch between chat groups without delay.

### Media Sharing
- **Image Sharing**: Upload and share high-quality images in chats.
- **File Sharing**: Share various file formats, including PDFs, documents, and archives.
- **Audio Recording**: Built-in audio recorder to capture and send voice messages seamlessly.
- **Secure Media Transfers**: All media and file links are encrypted for privacy.

### Security
- **End-to-End Encryption (E2EE)**:
  - Messages and media are encrypted using **RSA-OAEP** with \`SHA-256\`, ensuring that only the intended recipient can decrypt the data.
  - Encryption keys are dynamically fetched and managed securely.
- **Media Encryption**:
  - Media files (e.g., images, audio, and documents) are encrypted both during transmission and at rest, protecting them from unauthorized access.

### Enhanced User Experience
- **Emoji Support**: Add emojis to messages with a user-friendly emoji picker.
- **Custom Context Menu**: Right-click on messages to access options like editing and deletion.
- **Timestamped Messages**: Each message is labeled with a precise time of sending or receiving.
- **Mobile Responsiveness**: The UI is fully responsive and works seamlessly on mobile devices.
- **Thematic Design**: Dark mode-inspired design for better aesthetics and reduced eye strain.

---

## Technology Stack

### Frontend
- **React.js**: A fast and scalable framework for building the user interface.
- **Ant Design (AntD)**: Provides polished and responsive components.
- **SignalR**: Enables real-time communication between the client and the server.
- **Emoji Picker**: Adds support for selecting and embedding emojis in messages.

### Backend
- **ASP.NET Core**: A robust framework for creating scalable APIs.
- **Entity Framework (EF)**: Simplifies database interactions with models and migrations.
- **SignalR Hub**: Manages real-time connections and event broadcasting.

### Database
- **SQL Server**: Stores user information, message history, and encrypted media links.

### Security
- **RSA Encryption**:
  - Public and private keys are used to encrypt/decrypt sensitive data.
  - Messages, media, and files are encrypted on the sender's side and decrypted by the recipient.
- **AES (Optional)**: For encrypting larger files or additional data securely.

---

## Features in Detail

### **End-to-End Encryption (E2EE)**
- **Why E2EE?**
  End-to-End Encryption ensures that only the sender and recipient can read the messages, even if intercepted during transmission.
  
- **How It Works**:
  1. A user's **public key** is retrieved from the backend during message sending.
  2. Messages are encrypted with the recipient's public key before being sent.
  3. The recipient uses their **private key** to decrypt the message.

- **Encrypted Data**:
  - Text Messages.
  - Media URLs (images, files, audio).
  - Group communication is also encrypted, ensuring privacy even in shared spaces.

---

### **Audio and Media Sharing**
1. **Audio Recording**:
   - Record high-quality voice messages directly in the chat window.
   - Supports instant playback before sending.
   - Audio files are encrypted during upload and securely delivered to recipients.

2. **Image Sharing**:
   - Share images of various formats (JPEG, PNG, etc.).
   - Media previews are displayed directly within the chat.
   - Thumbnail generation is implemented for faster loading.

3. **File Sharing**:
   - Upload and share files such as PDFs, Word documents, or archives.
   - File links are securely encrypted to prevent unauthorized access.

---

## Installation and Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (for running the React app).
- [Visual Studio](https://visualstudio.microsoft.com/) or an equivalent IDE (for the ASP.NET Core backend).
- SQL Server (for the database).

### Steps

1. **Clone the Repository**:
   \`\`\`bash
   git clone https://github.com/FarizShukiurov/AmigosGramProject.git
   cd AmigosGramProject
   \`\`\`

2. **Frontend Setup**:
   \`\`\`bash
   cd ClientApp
   npm install
   npm start
   \`\`\`

3. **Backend Setup**:
   - Open the project in Visual Studio.
   - Configure the connection string in \`appsettings.json\` to point to your SQL Server.
   - Apply database migrations:
     \`\`\`bash
     dotnet ef database update
     \`\`\`
   - Start the backend server:
     \`\`\`bash
     dotnet run
     \`\`\`

4. **Run the Application**:
   - Open the frontend at \`http://localhost:3000\`.
   - The backend API will run on \`http://localhost:5000\` (or a similar default port).

---

## Folder Structure

- **ClientApp**: Contains the React.js frontend.
- **Server**: Contains the ASP.NET Core backend.
- **Shared**: Includes shared models and helper services.
- **Database**: Contains migration files and database schema.

---

## Future Enhancements

- **Video Calling**: Add one-on-one and group video call functionality.
- **Search Functionality**: Search through chat history by keywords or media types.
- **Themes**: Introduce light and dark theme options.
- **Improved Group Features**: Support roles, permissions, and notifications for group chats.

---

## Contributing

Contributions are welcome! If you'd like to contribute:
1. Fork the repository.
2. Create a new branch with your feature/fix.
3. Submit a pull request for review.
