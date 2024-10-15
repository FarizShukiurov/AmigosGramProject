
# AmigosGram Project

AmigosGram is a full-stack web application built with **ASP.NET Core** for the backend and **React** for the frontend. 
This project demonstrates a modern messaging application with a focus on clean architecture, responsive design, and efficient data flow.

## Project Structure

```plaintext
AmigosGramProject/
│
├── AmigosGramProject.Server/       # ASP.NET Core backend
│   ├── Program.cs                  # Entry point for the backend
│   └── AmigosGramProject.Server.csproj  # Backend project file
│
└── amigosgramproject.client/       # React frontend
    ├── package.json                # Frontend dependencies and scripts
    └── src/                        # Source code for React components
        ├── App.jsx                 # Main React component
        └── components/             # Additional React components
```

## Prerequisites

Ensure you have the following installed on your machine:
- **.NET SDK** (version 6.0 or later) - [Install .NET](https://dotnet.microsoft.com/download)
- **Node.js** (version 14 or later) - [Install Node.js](https://nodejs.org/)
- **npm** or **yarn** for managing frontend dependencies

## Setup Instructions

### 1. Clone the Repository
If not already done, clone the repository to your local machine:

```bash
git clone <your-repo-url>
cd AmigosGramProject
```

### 2. Backend Setup (ASP.NET Core)

Navigate to the backend folder and restore dependencies:

```bash
cd AmigosGramProject.Server
dotnet restore
```

Run the backend server:

```bash
dotnet run
```

The backend should now be running on `https://localhost:5001` by default.

### 3. Frontend Setup (React)

Navigate to the frontend directory and install dependencies:

```bash
cd amigosgramproject.client
npm install
```

Start the React development server:

```bash
npm start
```

The frontend will be available at `http://localhost:3000`.

## Running the Application

1. Ensure both the backend and frontend servers are running.
2. Open your browser and visit `http://localhost:3000`.
3. The React frontend will interact with the ASP.NET Core backend through API calls.

## Build and Deployment

### Backend
To publish the backend:

```bash
dotnet publish -c Release
```

### Frontend
To build the frontend for production:

```bash
npm run build
```

The production build will be available in the `build` folder.

## Technologies Used

- **ASP.NET Core** for backend services
- **React** for the frontend
- **Node.js** and **npm** for frontend dependencies
- **Git** for version control

## Contributing

Feel free to fork the repository and make contributions via pull requests.

## License

This project is licensed under the MIT License.
