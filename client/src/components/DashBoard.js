import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { DeleteServer, GetAllServers } from '../redux/GroupSlice';

function DashBoard() {
    const servers = useSelector((state) => state.group.servers);
    const dispatch = useDispatch();

    const [ping, setPing] = useState(false);
    const [loading, setLoading] = useState(false);
    const DeleteServerFunc = async(serverId) => {
        setLoading(true);
        await dispatch(DeleteServer({serverId: serverId}));
        setLoading(false);
        setPing(!ping);
    }
    useEffect(() => {
        dispatch(GetAllServers());
    }, [ping]);

    const [search, setSearch] = useState("");
  return (
    <div className='server-list'>
        <h2>Search</h2>
            <input className='mb-5 mt-2'
                type='text'
                placeholder='search for server'
                onChange={(e) => setSearch(e.target.value)}
            />
            <h2>All servers</h2>
            {servers?.length > 0 ? servers?.filter((el) => el.GroupName.toLowerCase().includes(search?.toLowerCase())).map((server) => (
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
                        <p>Members: {server.members.length}</p>
                        <button className='' onClick={() => DeleteServerFunc(server._id)}>Delete</button>
                    </div>
                    
                </div>
            ))
        : <>No servers for the moment</>}
    </div>
  )
}

export default DashBoard