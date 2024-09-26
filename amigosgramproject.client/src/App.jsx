/* eslint-disable no-unused-vars */
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Layout from './components/Layout';
import Contacts from './components/Contacts';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Layout />}>
                    <Route path="contacts" element={<Contacts />} />
                    

                </Route>
                <Route path="*" element={"Not found" }></Route>
            </Routes>
        </Router>
    );
}

export default App;
