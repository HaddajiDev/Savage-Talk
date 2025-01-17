import axios from 'axios';
import React, { useState } from 'react';
import { createServer } from '../redux/GroupSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const MAX_LENGTH_NAME = 50;
const MAX_LENGTH_BIO = 100;

function CreateAServer() {
    const [userList, setList] = useState([]);
    const [serverName, setName] = useState('');
    const [serverBio, setBio] = useState('');
    const [bioLength, setBioLength] = useState(0);
    const [nameLength, setNameLength] = useState(0);
    const [image, setImage] = useState(null);
    const [lodaing, setLoading] = useState(false);
    const currentUser = useSelector((state) => state.user.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleImageChangeGroup = (e) => {
        setImage(e.target.files[0]);
    };

    const handleImageUpload = async (userList) => {
        let imageUrl = '';

        if (image) {
            try {
                const formData = new FormData();
                formData.append('file', image);
                formData.append('upload_preset', 'preset');

                setLoading(true);
                const response = await axios.post(
                    `https://api.cloudinary.com/v1_1/dqkvgv7mh/image/upload`,
                    formData
                );
                imageUrl = response.data.secure_url;
                setLoading(false);
            } catch (error) {
                console.error('Error uploading image:', error);
                Swal.fire('Error', 'Failed to upload image. Please try again.', 'error');
                return;
            }
        }

        try {
            await dispatch(createServer({ users: userList, author: currentUser._id, imageUrl, serverName, bio: serverBio }));
            Swal.fire('Success', 'Server created successfully!', 'success');
            resetForm();
            navigate(`/myServers`);
        } catch (error) {
            console.error('Error creating server:', error);
            Swal.fire('Error', 'Failed to create server. Please try again.', 'error');
        }
    };

    const CreateServer = async () => {
        if (!serverName || !serverBio || (image === null)) {
            Swal.fire('Warning', 'All fields are required!', 'warning');
            return;
        }

        if (serverName.length > MAX_LENGTH_NAME || serverBio.length > MAX_LENGTH_BIO) {
            Swal.fire('Warning', 'Server name or bio exceeds the maximum length!', 'warning');
            return;
        }

        const updatedUserList = [...userList, currentUser._id];
        setList(updatedUserList);
        await handleImageUpload(updatedUserList);
    };

    const resetForm = () => {
        setList([]);
        setName('');
        setBio('');
        setImage(null);
        setBioLength(0);
        setNameLength(0);
    };

    return (
        <div className="create-server-container">
            <h1>Create a Server</h1>
            <p>All fields are required</p>
            <input
                type="text"
                value={serverName}
                onChange={(e) => { setName(e.target.value); setNameLength(e.target.value.length); }}
                placeholder="Server Name"
            />
            <p style={{ color: nameLength > MAX_LENGTH_NAME ? 'red' : 'black' }}>
                {nameLength} / {MAX_LENGTH_NAME}
            </p>
            <input
                type="text"
                value={serverBio}
                onChange={(e) => { setBio(e.target.value); setBioLength(e.target.value.length); }}
                placeholder="Server Bio"
            />
            <p style={{ color: bioLength > MAX_LENGTH_BIO ? 'red' : 'black' }}>
                {bioLength} / {MAX_LENGTH_BIO}
            </p>
            <input
                type="file"
                onChange={handleImageChangeGroup}
                id='fileInput'
            />
            <div className="image-preview-container">
                {image ? (
                    <>
                        <button className='cancelBtn' onClick={() => {setImage(null); document.getElementById('fileInput').value = ""}}>
                            <i className="fa-solid fa-xmark"></i>
                        </button> 
                        <img src={URL.createObjectURL(image)} alt="Preview" className="post-image-preview" />
                    </>
                ) : null}
            </div>
            <button onClick={CreateServer}>{lodaing ? <i class="fa fa-spinner fa-pulse fa-2x fa-fw fa-lg"></i> : "Create"}</button>
        </div>
    );
    
}

export default CreateAServer;