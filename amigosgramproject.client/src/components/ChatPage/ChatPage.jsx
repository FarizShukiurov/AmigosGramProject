import './chatPage.css'
import List from './list/List'
import Chat from './chat/Chat'
const ChatPage = () => {
    return (
        <div className='chatPage'>
            <List/>
            <Chat/>
        </div>
    )
}
export default ChatPage