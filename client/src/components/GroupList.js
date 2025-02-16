import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {io} from 'socket.io-client';
import { GetAllMsgs, SendMasg, addMessage, deleteMessage } from '../redux/MsgSlice';
import { GetAllGroups, KickOutGroup, LeaveGroup } from '../redux/UserSlice';
import Swal from 'sweetalert2';
import { createGroup, UpdateGroup } from '../redux/GroupSlice';
import axios from 'axios';
import { Emojis } from '../EmojiSet';
import { CreateComp } from './ModalComps';


const socket = io(process.env.REACT_APP_LINK);

const MAX_LENGTH_NAME = 30;

function GroupList() {
    const [message, setMessage] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const currentUser = useSelector((state) => state.user.user);
    const [room, setRoom] = useState(null);
    const msgs = useSelector((state) => state.msg.msgs);
    const groups = useSelector((state) => state.user.groups);
    const [image, setImage] = useState(null);
    const [imageGroup, setImageGroup] = useState(null);

    const [nameLength, setNameLength] = useState(0);
    const dispatch = useDispatch();

    

    const generateAvatarUrl = (username) => {
        return `https://api.dicebear.com/9.x/thumbs/svg?seed=${username}&flip=true&backgroundColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=solid,gradientLinear&backgroundRotation=0,10,20&shapeColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,transparent`;
    };

    const JoinRoom = (room, group) => {
        socket.emit('joinRoom', room);
        setRoom(room);
        setSelectedGroup(group);
    };

    const sendMessage = (room, imageUrl) => {
        if (!imageUrl) {
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
            document.getElementById('fileInput').value = "";
        }
    };

    const handleDeleteMsg = (id) => {
        socket.emit('deleteMessage', { id, room });
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

        const handleUserAdded = ({ groupId, user }) => {
            if (selectedGroup && selectedGroup._id === groupId) {
                setSelectedGroup(prevGroup => ({
                    ...prevGroup,
                    members: [...prevGroup.members, user]
                }));
            }
        };

        socket.on('Message_received', handleMessageReceived);
        socket.on('Message_deleted', handleDeleteMessage);
        socket.on('User_added', handleUserAdded);

        return () => {
            socket.off('Message_received', handleMessageReceived);
            socket.off('Message_deleted', handleDeleteMessage);
            socket.off('User_added', handleUserAdded);
        };
    }, [dispatch, selectedGroup]);

    useEffect(() => {
        if (room !== null) {
            dispatch(GetAllMsgs({ room }));
        }
    }, [room, dispatch]);

    const [ping, setPing] = useState(false);
    useEffect(() => {
        if (currentUser?._id) {
            dispatch(GetAllGroups(currentUser._id));
        }
    }, [currentUser, dispatch, ping]);

    const KickUser = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "Do you really want to kick this user?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, kick them!'
        });
    
        if (result.isConfirmed) {
            await dispatch(KickOutGroup({ groupId: selectedGroup?._id, userId: id }));
            setPing(!ping);
            setSelectedGroup(prevGroup => ({
                ...prevGroup,
                members: prevGroup.members.filter(member => member._id !== id)
            }));
            Swal.fire(
                'Kicked!',
                'User has been kicked.',
                'success'
            );
        }
    };
    

    const AddUser = async (id) => {
        socket.emit("addUserToGroup", { groupId: selectedGroup._id, userId: id });        
        Alert("User added successfully!", "success");
    };

    const LeaveGroupFront = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "Do you really want to leave this group?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, leave group!'
        });
    
        if (result.isConfirmed) {
            await dispatch(LeaveGroup({ groupId: selectedGroup?._id, userId: currentUser._id }));
            setPing(!ping);
            setSelectedGroup(null);
            Swal.fire(
                'Left Group!',
                'You have left the group.',
                'info'
            );
        }
    };
    

    const UpdateGroupFunc = async ({ id, imageUrl, groupName }) => {        
        if(groupName.length > MAX_LENGTH_NAME){
            Swal.fire('Warning', 'Group name exceeds the maximum length!', 'warning');
            return;
        }
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "Do you want to update the group information?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update it!'
        });
    
        if (result.isConfirmed) {
            await dispatch(UpdateGroup({ id, imageUrl, groupName, bio: '' }));
            setPing(!ping);
            setSelectedGroup(prevGroup => ({
                ...prevGroup,
                groupName,
                imageUrl
            }));
            Swal.fire(
                'Updated!',
                'Group information has been updated.',
                'success'
            );
        }
    };

    const [friendsList, setFriendsList] = useState([]);
    const CreateGroupFront = async () => {
        if (friendsList.length < 3) {
            Swal.fire(
                'Not enough members!',
                'You need at least 3 members to create a group.',
                'warning'
            );
            return;
        }
    
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "Do you want to create this group?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, create it!'
        });
    
        if (result.isConfirmed) {
            await dispatch(createGroup({ users: friendsList, author: currentUser._id }));
            setPing(!ping);
            handleClose();
            Swal.fire(
                'Created!',
                'Your group has been created.',
                'success'
            );
        }
    };
    

    const [create, setCreate] = useState(false);

    const isMember = (id) => {
        return selectedGroup?.members.some(member => member._id === id);
    };

    const AddingMembers = () => {
        return (
            <>
                <h4>Adding Members</h4>
                <div className='friendAdd' style={{backgroundColor: "#ebdcf5"}}>
                    {currentUser?.friends.map((el) => (
                        <div key={el.freindId}>
                            <div className='AllMemblist friendAddlist'>
                                {isMember(el.freindId) ? null : <>
                                <p>{el.username}</p> <button onClick={() => AddUser(el.freindId)}>
                                    {friendsList.includes(el.freindId) ? "in" : "Add"}
                                </button> </>}
                            </div>
                            
                        </div>
                    ))}
                </div>
                
            </>
        );
    };

    const KickingMembers = () => {
        const isAuthor = (id) => {
            return selectedGroup?.author._id === id;
        };

        const isCurrentUserAuthor = () => {
            return currentUser._id === selectedGroup?.author._id;
        };

        return (
            <>
                <h4>All Members</h4>
                <div className='friendAdd' style={{backgroundColor: "#ebdcf5"}}>
                    {selectedGroup?.members.map((el) => (
                        <div key={el._id}>
                            <div className='AllMemblist friendAddlist'>
                                <p>{el.username}
                                {isAuthor(el._id) ? " (Author)" : ""}</p>
                                {isCurrentUserAuthor() && !isAuthor(el._id) ? (
                                    <button onClick={() => KickUser(el._id)}>Kick</button>
                                ) : null}
                            </div>
                            
                        </div>
                    ))}
                </div>
            </>
        );
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };
    const handleImageChangeGroup = (e) => {
        setImageGroup(e.target.files[0]);
    };

    const[Loading, setLoading] = useState(false);

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
                setLoading(false);
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        } else {
            sendMessage(room_, '');
        }
    };

    const handleImageUploadGroup = async () => {
        if (imageGroup) {
            const formData = new FormData();
            formData.append('file', imageGroup);
            formData.append('upload_preset', 'preset');
    
            try {
                const response = await axios.post(
                    `https://api.cloudinary.com/v1_1/dqkvgv7mh/image/upload`,
                    formData
                );
    
                const imageUrl = response.data.secure_url;
                const groupName = document.getElementById('groupNameValue').value ? document.getElementById('groupNameValue').value : selectedGroup.groupName;
                
                await UpdateGroupFunc({ id: selectedGroup._id, imageUrl, groupName });    
                
                setImageGroup(null);
                document.getElementById('groupImageValue').value = '';
                document.getElementById('groupNameValue').value = '';
                setNameLength(0);
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        } else {
            const groupName = document.getElementById('groupNameValue').value !== "" ? document.getElementById('groupNameValue').value : selectedGroup.groupName;
            await UpdateGroupFunc({ id: selectedGroup._id, imageUrl: selectedGroup.imageUrl, groupName });
        }
    };

    const handleCreateAction = () => {
        setCreate(!create);
        setFriendsList([currentUser?._id]);        
    }    

    const [showCreate, setShowCreate] = useState(false);

    const handleClose = () => setShowCreate(false);
    const handleShow = () => setShowCreate(true);

    const [settingsS, SetSettings] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter' && selectedGroup) {
                handleImageUpload(selectedGroup.room);
            }
        };
    
        window.addEventListener('keydown', handleKeyDown);
    
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedGroup, handleImageUpload])
    

    const messageListRef = useRef(null); 
    
    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [msgs, selectedGroup, settingsS]);

    const [openEmojis, setOpenEmojis] = useState(false);

    return (
        <div>
            <div className='conti'>
                <div className="">
                    
                    {create ? (
                        <>
                            <CreateComp
                                currentUser={currentUser}
                                friendsList={friendsList}
                                CreateGroupFront={CreateGroupFront}
                                handleClose={handleClose}
                                setFriendsList={setFriendsList}
                                showCreate={showCreate}
                                handleCreateAction={handleCreateAction}
                            />
                        </>
                    ) : null}
                    <div className='friendsBackGroud'>                    
                        <div className='section-1-Friends'>
                            <button className='AddButton' onClick={() => {handleCreateAction(); handleShow()}}><i class="fa-solid fa-plus"></i></button>
                            {groups?.length > 0 ? groups?.map((el) => (
                                <div className='conti friendListing' key={el._id}>
                                    <button onClick={() => {JoinRoom(el.room, el); SetSettings(false);}}>
                                        <div className="friendInfoListing">
                                            <div>
                                                {el.imageUrl !== "" ? <img src={el.imageUrl} alt={el.groupName} /> : <img src={generateAvatarUrl(el.groupName)} alt={el.groupName} />}
                                            </div>
                                            <p>{el.groupName}</p>
                                        </div>                                        
                                    </button>
                                    {selectedGroup?._id === el._id ?
                                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}><div className='Selected'></div></div>
                                        : null
                                    }
                                </div>
                            )) : <div className='conti'>No Groups</div>}
                        </div>
                        {settingsS ? 
                            <div className='chatting'>
                                <div className='settings'>
                                    <div className='conti'>
                                        <div>
                                            <button className='cancelBtn mb-3' onClick={() => SetSettings(false)}><i class="fa-solid fa-arrow-left"></i></button>
                                            <KickingMembers />
                                            <AddingMembers />
                                            <h4 className='mt-3' style={{textAlign: 'center'}}>Update group</h4>
                                            <div className='updateGroup'>
                                                <input type='text' placeholder={selectedGroup.groupName} id='groupNameValue' onChange={(e) => setNameLength(e.target.value.length)} />
                                                <p style={{ color: nameLength > MAX_LENGTH_NAME ? 'red' : 'black' }}>
                                                    {nameLength} / {MAX_LENGTH_NAME}
                                                </p>
                                                <input type='file' id='groupImageValue' onChange={handleImageChangeGroup} onKeyDown={(e) => {if(e.key === "Enter") {e.preventDefault()}}}/>
                                                <div className='mt-3'>
                                                    {imageGroup ? <><button className='cancelBtn' onClick={() => {setImageGroup(null); document.getElementById('groupImageValue').value = ""}}><i class="fa-solid fa-xmark"></i></button> <img src={URL.createObjectURL(imageGroup)} alt="Preview" className="post-image-preview" /> </>: null}
                                                </div>                                                
                                                <button className='mt-3' onClick={handleImageUploadGroup}>Update</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>                            
                            :                        
                            <div className='chatting'>
                                {selectedGroup !== null ? (
                                    <div className='conti'>
                                        <div className='mb-3' style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                            <h2>Chatting with <b>{selectedGroup.groupName}</b></h2>
                                            <div style={{display: 'flex', gap: "10px", alignItems: 'center'}}>
                                                <button className='cancelBtn' onClick={LeaveGroupFront}><i class="fa-solid fa-right-from-bracket"></i></button>
                                                {currentUser._id === selectedGroup?.author._id ? <button className='cancelBtn' onClick={() => SetSettings(!settingsS)}><i class="fa-solid fa-gear"></i></button> : null}
                                                
                                                <button className='cancelBtn' onClick={() => setSelectedGroup(null)}><i class="fa-solid fa-xmark"></i></button>
                                            </div>
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

                                            <button className='inputbtn' onClick={() => handleImageUpload(selectedGroup.room)}>{Loading ? <i class="fa fa-spinner fa-pulse fa-2x fa-fw fa-lg"></i> : <i class="fa-solid fa-paper-plane"></i>}</button>
                                            {openEmojis && <Emojis setMessage={setMessage} />}
                                            <div>
                                                {image ? <><button className='cancelBtn' onClick={() => {setImage(null); document.getElementById('fileInput').value = ""}}><i class="fa-solid fa-xmark"></i></button> <img src={URL.createObjectURL(image)} alt="Preview" className="post-image-preview" /> </>: null}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className='conti'>
                                        select a group to start chatting
                                    </div>
                                )}
                            </div>
                        }
                    </div>                   
                    
                </div>
            </div>
        </div>
    );
}

export function Alert(text, type) {
	const Toast = Swal.mixin({
		toast: true,
		position: 'top-end',
		iconColor: 'white',
		customClass: {
			popup: 'colored-toast',
		},
		showCancelButton: false,
		showConfirmButton: false,
		showDenyButton: false,
		timer: 1500,
		timerProgressBar: true,
	  })		  
	  ;(async () => {
		await Toast.fire({
		  icon: type,
		  title: text,
		})  
	})()
}


export default GroupList;
