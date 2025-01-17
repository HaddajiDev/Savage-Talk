import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GetAllServers } from '../redux/GroupSlice';
import { useNavigate } from 'react-router-dom';
import {io} from 'socket.io-client';

const socket = io("http://localhost:2000");

function ServerList() {
    const [selectedServer, setSelectedServer] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState({});
    const navigate = useNavigate();
    const servers = useSelector((state) => state.group.servers);
    const currentUser = useSelector((state) => state.user.user);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(GetAllServers());
    }, [dispatch]);

    useEffect(() => {
        socket.on('updateOnlineUsers', (users) => {
            setOnlineUsers(users);            
        });

        return () => {
            socket.off('updateOnlineUsers');
        };
    }, []);
    

    const handleJoinServer = async () => {
        navigate(`/server/${selectedServer._id}`);
    };

    const AlreadyJoined = () => {
        navigate(`/server/${selectedServer._id}`);
    };

    const isUserInServer = (server) => {
        return server.members.some((member) => member.userId === currentUser?._id);
    };

    const getOnlineCount = (server) => {
        return server.members.filter((member) => onlineUsers[member.userId]).length;        
    };

    const [search, setSearch] = useState("");


    return (
        <div className="server-list">
            <h2>Search</h2>
            <input className='mb-5 mt-2'
                type='text'
                placeholder='search for server'
                onChange={(e) => setSearch(e.target.value)}
            />
            <h2>All servers</h2>
            {!selectedServer ? (
                servers?.length > 0 ? (
                    servers?.filter((el) => el.GroupName.toLowerCase().includes(search.toLowerCase())).map((server) => (
                        <div key={server._id} className="server-item">
                            <div class="zoomable">
                                <img
                                    src={server.imageUrl || `https://api.dicebear.com/9.x/thumbs/svg?seed=${server.GroupName}&flip=true&backgroundColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=solid,gradientLinear&backgroundRotation=0,10,20&shapeColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,transparent`}
                                    alt={server.GroupName}
                                />
                            </div>
                            <div>
                                <h2>{server.GroupName}</h2>
                                <p>{server.bio}</p>                                
                                <p>Members: {server.members.length} | Online: {getOnlineCount(server)}</p>
                                <button onClick={() => navigate(`/server/${server._id}`)}>View</button>
                            </div>
                            
                        </div>
                    ))
                ) : (
                    <>
                        No servers at the moment. Create one.
                        <button onClick={() => navigate('/createServer')}>Create</button>
                    </>
                )
            ) : (
                <div className="server-detail">
                    <img src={selectedServer.imageUrl} alt={selectedServer.GroupName} />
                    <p>{selectedServer.bio}</p>
                    <h2>{selectedServer.GroupName}</h2>
                    {isUserInServer(selectedServer) ? (
                        <button onClick={AlreadyJoined}>Already Joined</button>
                    ) : (
                        <button onClick={handleJoinServer}>View Server</button>
                    )}
                    <button onClick={() => setSelectedServer(null)}>Back to Server List</button>
                    <div>
                        Members: {selectedServer.members.length} | Online: {getOnlineCount()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ServerList;
