import "./chatList.css"

const ChatList = () => {
    return (
        <div className='ChatList'>
            <div className='search'>
                <div className="searchBar">
                    <img src="src/assets/search.svg"></img>
                    <input placeholder="Search"></input>
                </div>
            </div>
            <div className="item">
                <img src="/src/assets/AvatarDefault.svg"></img>
                <div className="text">
                    <span>User Name</span>
                    <p>Hello World!</p>
                </div>
            </div>
            <div className="item">
                <img src="/src/assets/AvatarDefault.svg"></img>
                <div className="text">
                    <span>User Name</span>
                    <p>Hello World!</p>
                </div>
            </div>
            <div className="item">
                <img src="/src/assets/AvatarDefault.svg"></img>
                <div className="text">
                    <span>User Name</span>
                    <p>Hello World!</p>
                </div>
            </div>
            <div className="item">
                <img src="/src/assets/AvatarDefault.svg"></img>
                <div className="text">
                    <span>User Name</span>
                    <p>Hello World!</p>
                </div>
            </div>
            <div className="item">
                <img src="/src/assets/AvatarDefault.svg"></img>
                <div className="text">
                    <span>User Name</span>
                    <p>Hello World!</p>
                </div>
            </div>
        </div>
    )
}
export default ChatList