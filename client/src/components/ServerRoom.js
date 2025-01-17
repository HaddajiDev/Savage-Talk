import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { GetServerOne, UpdateGroup } from '../redux/GroupSlice';
import {io} from 'socket.io-client';
import { addMessage, deleteMessage, GetAllMsgs, SendMasg } from '../redux/MsgSlice';
import axios from 'axios';
import { LeaveGroup } from '../redux/UserSlice';
import Swal from 'sweetalert2';
import { Emojis } from '../EmojiSet';

const socket = io("http://localhost:2000");
const MAX_LENGTH_NAME = 50;
const MAX_LENGTH_BIO = 100;

function ServerRoom() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [room, setRoom] = useState();
  const server = useSelector((state) => state.group.server);
  const msgs = useSelector((state) => state.msg.msgs); 
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const currentUser = useSelector((state) => state.user.user);
  
  const [selectedServer, setServer] = useState(null);

  const [imageGroup, setImageGroup] = useState(null);

  const [lock, setLock] = useState(false);
  const [nameLength, setNameLength] = useState(0);
  const [bioLength, setBioLength] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(GetServerOne({ serverId: id }));
  }, [dispatch]);

  const isUserInServer = (server) => {
    return server.members.some((member) => member.userId === currentUser?._id);
  };

  const [ping, setPing] = useState(false);

  useEffect(() => {
    if (server) {
      setServer(server);
    }
  }, [server]);

  useEffect(() => {
    if (selectedServer) {
      if (isUserInServer(selectedServer) === false) {
        setLock(true);
      }
      else{
        setLock(false);
      }
    }    
  }, [currentUser, selectedServer]);

  const AddUser = async (userId, state) => {
    await socket.emit("addUserToGroup", { groupId: selectedServer?._id, userId: userId });
    setLock(false);
    sleep(1000);
    window.location.reload();    
  };

  const generateAvatarUrl = (username) => {
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${username}&flip=true&backgroundColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=solid,gradientLinear&backgroundRotation=0,10,20&shapeColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,transparent`;
  };

  const JoinRoom = (room) => {
    socket.emit('joinRoom', room);
    setRoom(room);    
  };

  const formatMessage = (msg) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return msg.replace(urlRegex, (url) => {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const isImage = imageExtensions.some(ext => url.endsWith(ext));
      return isImage ? `<img src="${url}" className="msgImage" alt="Image" />` : `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
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

  useEffect(() => {
    const handleMessageReceived = (newMessage) => {
      dispatch(addMessage(newMessage));
    };

    const handleDeleteMessage = (deletedMessageId) => {
      dispatch(deleteMessage(deletedMessageId));
    };

    const handleUserKicked = ({ groupId, userId }) => {
      if (selectedServer?._id === groupId) {
        const updatedMembers = selectedServer.members.filter(member => member.userId !== userId);
        setServer({ ...selectedServer, members: updatedMembers });
      }
    };

    const handleUserAdded = ({ groupId, user }) => {
      if (selectedServer && selectedServer._id === groupId) {
        setServer(prevServer => ({
          ...prevServer,
          members: [...prevServer.members, user]
        }));
      }
    };

    socket.on('Message_received', handleMessageReceived);
    socket.on('Message_deleted', handleDeleteMessage);
    socket.on('User_added', handleUserAdded);
    socket.on("User_kicked", handleUserKicked);

    return () => {
      socket.off('Message_received', handleMessageReceived);
      socket.off('Message_deleted', handleDeleteMessage);
      socket.off('User_added', handleUserAdded);
      socket.off("User_kicked", handleUserKicked);      
    };
  }, [dispatch, selectedServer]);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
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
        setLoading(false);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    } else {
      sendMessage(room_, '');
    }
  };

  const handleDeleteMsg = (id) => {
    socket.emit('deleteMessage', { id, room });
  };

  const isMember = (id) => {
    return selectedServer?.members.some(member => member.userId === id);
  };

  const AddingMembers = () => {
    return (
      <>
        <h4>Adding Members</h4>
        <div className='friendAdd' style={{backgroundColor: "#ebdcf5"}}>
          {currentUser?.friends.map((el) => (
            <div key={el.freindId} >
              <div className='AllMemblist friendAddlist mt-1'>
                {isMember(el.freindId) ? null : (
                  <>
                    {el.username} <button onClick={() => AddUser(el.freindId, "")}>Add</button>
                  </>
                )}
              </div>
              
            </div>
          ))}
        </div>
        
      </>
    );
  };
  

  const LeaveGroupFront = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you really want to leave this server?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, leave it!'
    });

    if (result.isConfirmed) {
      await dispatch(LeaveGroup({ groupId: selectedServer?._id, userId: currentUser._id }));
      setPing(!ping);
      setServer(null);
      navigate('/servers');
      Swal.fire('Left!', 'You have left the server.', 'info');
    }
  };


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
    socket.emit("kickUserFromGroup", { groupId: selectedServer?._id, userId: id });
    setPing(!ping);
    Swal.fire('Kicked!', 'User has been kicked.', 'success');
  }
};
  const isAuthor = (id) => {
    return selectedServer?.author === id;
  };

  const KickingMembers = () => {  
    const isAuthor = (id) => {
      return selectedServer?.author === id;
    };

    const isCurrentUserAuthor = () => {
      return currentUser?._id === selectedServer?.author;
    };

    return (
      <>
        <h4>Kicking Members</h4>
        <div className='friendAdd' style={{backgroundColor: "#ebdcf5"}}>
          {selectedServer?.members.map((el) => (
            <div key={el.userId} className='AllMemblist friendAddlist mt-1'>
              {el.username}
              {isAuthor(el.userId) ? " (Author)" : ""}
              {isCurrentUserAuthor() && !isAuthor(el.userId) ? (
                <button onClick={() => KickUser(el.userId)}>Kick</button>
              ) : null}
            </div>
          ))}
        </div>
        
      </>
    );
  };

  useEffect(() => {
    JoinRoom(selectedServer?.room);
  }, [selectedServer]);

  useEffect(() => {
    dispatch(GetAllMsgs({ room: selectedServer?.room }));
  }, [selectedServer, dispatch]);


  const handleImageChangeGroup = (e) => {
    setImageGroup(e.target.files[0]);
  };


  const UpdateGroupFunc = async ({ id, imageUrl, groupName, bio }) => {
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
      await dispatch(UpdateGroup({ id, imageUrl, groupName, bio }));
      setPing(!ping);
      setServer(prevServer => ({
        ...prevServer,
        groupName,
        imageUrl,
        bio
      }));
      //Swal.fire('Updated!', 'Group information has been updated.', 'success');
      window.location.reload();
    }
  };

  const [LoadingUpdate, setLoadingUpdte] = useState(false);
  const handleImageUploadGroup = async () => {
    if (imageGroup) {
        const formData = new FormData();
        formData.append('file', imageGroup);
        formData.append('upload_preset', 'preset');

        try {
          setLoadingUpdte(true);
            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/dqkvgv7mh/image/upload`,
                formData
            );
            setLoadingUpdte(false);
            const imageUrl = response.data.secure_url;
            const groupName = document.getElementById('groupNameValue').value ? document.getElementById('groupNameValue').value : selectedServer.GroupName;
            const bio = document.getElementById('groupBioValue').value ? document.getElementById('groupBioValue').value : selectedServer.bio;
            await UpdateGroupFunc({ id: selectedServer._id, imageUrl, groupName, bio });    
            
            setImageGroup(null);
            document.getElementById('groupImageValue').value = '';
            document.getElementById('groupNameValue').value = '';
            document.getElementById('groupBioValue').value = '';
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    } else {
        const bio = document.getElementById('groupBioValue').value ? document.getElementById('groupBioValue').value : selectedServer.bio;  
        const groupName = document.getElementById('groupNameValue').value !== "" ? document.getElementById('groupNameValue').value : selectedServer.GroupName;
        await UpdateGroupFunc({ id: selectedServer._id, imageUrl: selectedServer.imageUrl, groupName, bio });
        document.getElementById('groupNameValue').value = '';
        document.getElementById('groupBioValue').value = '';
    }
};


  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && selectedServer) {
        handleImageUpload(selectedServer.room);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedServer, handleImageUpload]);
  const [settingsS, SetSettings] = useState(false);
  const [members, setMembers] = useState(false);

  const messageListRef = useRef(null);
  useEffect(() => {
      if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      }
  }, [msgs, selectedServer, settingsS, members]);
  
  const [openEmojis, setOpenEmojis] = useState(false);


  return (
    <div>
      {lock ? (
        <div className='chatting messageList'>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center', alignItems: "center"}}>
            <img
              src={selectedServer.imageUrl || `https://api.dicebear.com/9.x/thumbs/svg?seed=${selectedServer.GroupName}&flip=true&backgroundColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=solid,gradientLinear&backgroundRotation=0,10,20&shapeColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,transparent`}
              alt={selectedServer.GroupName}
              style={{width: "300px", borderRadius: "10px", height: "auto"}}
            />
            <h2><b>{selectedServer?.GroupName}</b></h2>
            <p>{selectedServer?.bio}</p>
            <p>Want to Join? </p>
            <button className='joinBtn' onClick={() => AddUser(currentUser?._id, "first")}>Join</button>
          </div>
          
        </div>
      ) : (
        <>
          {!members && !settingsS &&
          <div>
            <div className='mb-3' style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2><b>{selectedServer?.GroupName}</b></h2>
              <div style={{display: 'flex', gap: "10px", alignItems: 'center'}}>
                <button className='cancelBtn Leave' onClick={LeaveGroupFront}><i class="fa-solid fa-right-from-bracket"></i></button>
                <button className='cancelBtn actionBtn' onClick={() => setMembers(true)}><i class="fa-solid fa-user-group"></i></button>
                {currentUser?._id === selectedServer?.author ? <button className='cancelBtn actionBtn' onClick={() => SetSettings(!settingsS)}><i class="fa-solid fa-gear"></i></button> : null}                                                
              </div>                                            
            </div>
              <div className='chatting' style={{borderRadius: '10px'}}>
                <div className=''>
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
                        {currentUser._id === el.userId || currentUser._id === selectedServer?.author ? <button className='deleteMsgBtn' onClick={() => handleDeleteMsg(el._id)}><i className="fa-solid fa-trash"></i></button> : <></>}                                        
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

                                            <button className='inputbtn' onClick={() => handleImageUpload(selectedServer.room)}>{Loading ? <i class="fa fa-spinner fa-pulse fa-2x fa-fw fa-lg"></i> : <i class="fa-solid fa-paper-plane"></i>}</button>
                                            {openEmojis && <Emojis setMessage={setMessage} />}
                                            <div>
                                                {image ? <><button className='cancelBtn' onClick={() => {setImage(null); document.getElementById('fileInput').value = ""}}><i class="fa-solid fa-xmark"></i></button> <img src={URL.createObjectURL(image)} alt="Preview" className="post-image-preview" /> </>: null}
                    </div>
                  </div>
                </div>
              </div>
          </div>}
          {members &&
            <div className='chatting messageList'>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <h1>Members</h1>
                <button className='cancelBtn actionBtn' onClick={() => setMembers(false)}><i class="fa-solid fa-xmark"></i></button>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {server?.members.map((member) =>
                  <div className='MemberListing'>
                    <img
                      src={member.profileImageUrl || `https://api.dicebear.com/9.x/thumbs/svg?seed=${member.username}&flip=true&backgroundColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=solid,gradientLinear&backgroundRotation=0,10,20&shapeColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,transparent`}
                      alt={member.username}
                      style={{width: '80px', borderRadius: '50%'}}
                    />
                    <h2> {isAuthor(member.userId) ? member.username + " (boss)" : member.username}</h2>
                  </div>
                )}
              </div>
            </div>}
          {settingsS &&
            <div className='chatting messageList'>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <h1>Settings</h1>
                <button className='cancelBtn actionBtn' onClick={() => SetSettings(false)}><i class="fa-solid fa-xmark"></i></button>
              </div>
              <div>
                <AddingMembers />
                <KickingMembers />
                <h4 className='mt-3' style={{textAlign: 'center'}}>Update group</h4>
                  <div className='updateGroup'>
                    <p>Server name</p>
                    <input type='text' placeholder={selectedServer.GroupName} id='groupNameValue' onChange={(e) => setNameLength(e.target.value.length)} />
                  <p style={{ color: nameLength > MAX_LENGTH_NAME ? 'red' : 'black' }}>
                    {nameLength} / {MAX_LENGTH_NAME}
                  </p>
                  <p>Bio</p>
                  <input type='text' placeholder={selectedServer.bio} id='groupBioValue' onChange={(e) => setBioLength(e.target.value.length)} />
                  <p style={{ color: bioLength > MAX_LENGTH_BIO ? 'red' : 'black' }}>
                    {bioLength} / {MAX_LENGTH_BIO}
                  </p>
                  <input type='file' id='groupImageValue' onChange={handleImageChangeGroup} onKeyDown={(e) => {if(e.key === "Enter") {e.preventDefault()}}}/>
                  <div className='mt-3'>
                    {imageGroup ? <><button className='cancelBtn' onClick={() => {setImageGroup(null); document.getElementById('groupImageValue').value = ""}}><i class="fa-solid fa-xmark"></i></button> <img src={URL.createObjectURL(imageGroup)} alt="Preview" className="post-image-preview" /> </>: null}
                  </div>                                                
                  <button className='mt-3' onClick={handleImageUploadGroup}>{LoadingUpdate ? <i class="fa fa-spinner fa-pulse fa-2x fa-fw fa-lg"></i> : 'Update'}</button>
                </div>
              </div>
            </div>}
        </>
      )}
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default ServerRoom;
