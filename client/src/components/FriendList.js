import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {io} from 'socket.io-client';
import axios from 'axios';
import { DeleteMsg, GetAllMsgs, SendMasg, addMessage, deleteMessage } from '../redux/MsgSlice';
import { useNavigate } from 'react-router-dom';
import { Emojis, emojis } from '../EmojiSet';

const socket = io("http://localhost:2000");

function FriendList() {
    const [message, setMessage] = useState('');
    const [selectedFriend, setSelectedFriend] = useState(null);
    const currentUser = useSelector((state) => state.user.user);
    const [room, setRoom] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState({});
    const msgs = useSelector((state) => state.msg.msgs);
    const [image, setImage] = useState(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const generateAvatarUrl = (username) => {
        return `https://api.dicebear.com/9.x/thumbs/svg?seed=${username}&flip=true&backgroundColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=solid,gradientLinear&backgroundRotation=0,10,20&shapeColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,transparent`;
    };

    useEffect(() => {
        socket.on('updateOnlineUsers', (users) => {
            setOnlineUsers(users);
        });

        return () => {
            socket.off('updateOnlineUsers');
        };
    }, []);

    const JoinRoom = (room, friend) => {
        socket.emit('joinRoom', room);
        setRoom(room);
        setSelectedFriend(friend);
    };

    const sendMessage = (room, imageUrl) => {
        if (imageUrl === '') {
            const messageData = { message, room, userId: currentUser._id };
            socket.emit('message', messageData);
            dispatch(SendMasg(messageData));
            setMessage('');
        } else {
            const msg = `${message} ${imageUrl}`.trim();
            const messageData = { message: msg, room, userId: currentUser._id };
            socket.emit('message', messageData);
            dispatch(SendMasg(messageData));
            setMessage('');
            setImage(null);
            document.getElementById('fileInput').value = null;
        }
    };

    const formatMessage = (msg) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return msg.replace(urlRegex, (url) => {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const isImage = imageExtensions.some(ext => url.endsWith(ext));
            return isImage ? `<img src="${url}" className="img-fluid" alt="Image" />` : `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
    };

    useEffect(() => {
        const handleMessageReceived = (newMessage) => {
            dispatch(addMessage(newMessage));
        };

        const handleDeleteMessage = (deletedMessageId) => {
            dispatch(deleteMessage(deletedMessageId));
        };

        socket.on('Message_received', handleMessageReceived);
        socket.on('Message_deleted', handleDeleteMessage);

        return () => {
            socket.off('Message_received', handleMessageReceived);
            socket.off('Message_deleted', handleDeleteMessage);
        };
    }, [dispatch]);

    useEffect(() => {
        if (room !== null) {
            dispatch(GetAllMsgs({ room }));
        }
    }, [room, dispatch]);

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleDeleteMsg = (id) => {
        socket.emit('deleteMessage', { id, room });
    };

    const [Loading, setLoading] = useState(false);

    const handleImageUpload = async (room_) => {
        if (image) {
            const formData = new FormData();
            formData.append('file', image);
            formData.append('upload_preset', 'preset');

            try {
                setLoading(true);
                const response = await axios.post(
                    `https://api.cloudinary.com/v1_1/dqkvgv7mh/image/upload`,
                    formData
                );

                const imageUrl = response.data.secure_url;
                sendMessage(room_, imageUrl);
                setLoading(false)
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        } else {
            sendMessage(room_, '');
        }
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter' && selectedFriend) {
                handleImageUpload(selectedFriend.room);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedFriend, handleImageUpload]);

    const messageListRef = useRef(null); 
    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [msgs, selectedFriend]);

    const [openEmojis, setOpenEmojis] = useState(false);

    const OnlineUsersCount = () => {
        return currentUser?.friends.filter((el) => Object.values(onlineUsers).includes(el.freindId));
    }
    
    return (
        <div className='container-fluid'>
            <div>
                <h2>Friends List</h2>
                <div className='friendsBackGroud'>
                    <div className='section-1-Friends'>
                    {currentUser?.friends.length > 0 ? currentUser?.friends.map((el) => (
                            <div className='conti friendListing' key={el.username}> 
                                <button onClick={() => JoinRoom(el.room, el)}>
                                    <div className='friendInfoListing'>
                                        <div>
                                            {el.imageUrl ? <img src={el.imageUrl} alt={el.username} /> : <img src={generateAvatarUrl(el.username)} alt={el.username} />}
                                            {onlineUsers && Object.values(onlineUsers).includes(el.freindId) && (
                                                <span className="online-status"></span>
                                            )}
                                        </div>
                                        <p>{el.username}</p>
                                    </div>
                                </button>
                            </div>
                        )) :
                        <div className='noFriends conti'>
                            <p>No Friends Go Get Some</p>
                            <button><a href='https://savageblog.vercel.app/' target='_blank'>Savage Blog</a></button>
                            <p>Or check our servers</p>
                            <button onClick={() => navigate('/servers')}>Check Servers</button>
                        </div>}</div>
                        <div className='chatting'>
                            {selectedFriend !== null ? (
                                <div className='conti'>
                                    <div className='mb-3' style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <h2>Chatting with <b>{selectedFriend.username}</b></h2>
                                        <button className='cancelBtn' onClick={() => setSelectedFriend(null)}><i class="fa-solid fa-xmark"></i></button>
                                    </div>
                                    <div className='messageList' ref={messageListRef}>
                                        {msgs?.map((el) => (
                                            <div key={el._id} className='message'>
                                                <div className='innermsg'>
                                                    <div>
                                                        {el.user.imageUrl ? <img src={el.user.imageUrl} alt={el.user.username} className='profilePicMsg' /> : <img src={generateAvatarUrl(el.user?.username)} className='profilePicMsg' alt={el.user.username} />}
                                                        <span>{el.user.username}</span>
                                                    </div>
                                                    <p dangerouslySetInnerHTML={{ __html: formatMessage(el.body) }} />
                                                </div>
                                                {currentUser._id === el.userId ? <button className='deleteMsgBtn' onClick={() => handleDeleteMsg(el._id)}><i className="fa-solid fa-trash"></i></button> : <></>}                                        
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className='inputs'>
                                        <div className="file-upload-button">
                                            <button className="upload-button inputbtn">
                                                <i class="fa-solid fa-paperclip"></i>
                                                <input
                                                    type="file"
                                                    id="fileInput"
                                                    onChange={handleImageChange}
                                                    className="file-input"
                                                    onKeyDown={(e) => {if(e.key === "Enter") {e.preventDefault()}}}
                                                />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Message..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className='messageSend'
                                        />
                                        <button className='inputbtn' onClick={() => setOpenEmojis(!openEmojis)}><i className="fa-solid fa-face-smile"></i></button>                                

                                        <button className='inputbtn' onClick={() => handleImageUpload(selectedFriend.room)}>{Loading ? <i class="fa fa-spinner fa-pulse fa-2x fa-fw fa-lg"></i> : <i class="fa-solid fa-paper-plane"></i>}</button>
                                        {openEmojis && <Emojis setMessage={setMessage} />}
                                        <div>
                                            {image ? <><button className='cancelBtn' onClick={() => {setImage(null); document.getElementById('fileInput').value = ""}}><i class="fa-solid fa-xmark"></i></button> <img src={URL.createObjectURL(image)} alt="Preview" className="post-image-preview" /> </>: null}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                            <div className='conti'>
                                <h3>Online Friends</h3>
                                {OnlineUsersCount()?.length > 0 ? OnlineUsersCount().map((el) => 
                                    <div>
                                        <div className='OnlineFriends'>                                        
                                            <>
                                                <span className="online-status"></span>
                                                {el.imageUrl ? <img src={el.imageUrl} alt={el.username} /> : <img src={generateAvatarUrl(el.username)} alt={el.username} />}
                                                <p>{el.username}</p>
                                            </>                                        
                                        </div>                                    
                                    </div>
                                ): <>No Online Friends</>}
                            </div>
                    )}</div>                    
                </div>
            </div>
        </div>
    );
}

export default FriendList;
