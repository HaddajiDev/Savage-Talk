import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { GetAllUserServers } from '../redux/UserSlice';

function MyServers() {
    const navigate = useNavigate();
    const servers = useSelector((state) => state.user.server);
    const currentUser = useSelector((state) => state.user.user);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(GetAllUserServers({userId: currentUser?._id}));
    }, [currentUser, dispatch]);    

    const GoRoom = (id) => {
        navigate(`/server/${id}`);
    }
    const [search, setSearch] = useState("");
    
  return (
    <div className='server-list'>
            <h2>Search</h2>
            <input className='mb-5 mt-2'
                type='text'
                placeholder='search for server'
                onChange={(e) => setSearch(e.target.value)}
            />
            <h2>All Joined servers</h2>
            {servers?.length > 0 ? servers?.filter((el) => el.groupName.toLowerCase().includes(search.toLowerCase())).map((server) => (
                <div key={server._id} className="server-item">
                    <div class="zoomable">
                            <img
                                src={server.imageUrl || `https://api.dicebear.com/9.x/thumbs/svg?seed=${server.groupName}&flip=true&backgroundColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=solid,gradientLinear&backgroundRotation=0,10,20&shapeColor=0a5b83,1c799f,69d2e7,f1f4dc,f88c49,transparent`}
                                alt={server.groupName}
                            />
                        </div>
                        <div>
                            <h2>{server.groupName}</h2>
                            <p>{server.bio}</p>
                            <p>Members: {server.members.length}</p>
                            <button onClick={() => GoRoom(server._id)}>Go</button>
                    </div>
                    
                </div>
        )) : <>No joined servers check <button onClick={() => navigate('/servers')}>Servers</button></>}
    </div>
  )
}

export default MyServers