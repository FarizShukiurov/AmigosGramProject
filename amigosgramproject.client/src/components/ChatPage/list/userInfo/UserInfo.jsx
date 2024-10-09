import "./userInfo.css"
import {useEffect, useState } from 'react'

const UserInfo = () => {
    const [avatarUrl, setAvatarUrl] = useState("/src/assets/AvatarDefault.svg");
    const [userName, setUsername] = useState("UserName")
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch("/api/Profile/get-user-data", {
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    credentials: "include",
                });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }

                const data = await response.json();

                if (data.avatarUrl) {
                    setAvatarUrl(data.avatarUrl);
                }
                if (data.username) {
                    setUsername(data.username)
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };
        fetchUserData();
    }, []);
    return (
        <div className='userInfo'>
            <div className="user">
                <img src={avatarUrl}></img> 
                <h2>{userName}</h2>
            </div>
            <div className="icons">
                <img src="/src/assets/more.svg"></img>
            </div>
        </div>
    )
}
export default UserInfo