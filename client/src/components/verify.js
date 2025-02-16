import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom'
import { verifyUser } from '../redux/UserSlice';

function verify() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    const query = new URLSearchParams(location.search);
    const token = query.get("token");

    useEffect(async() => {
        if(localStorage.getItem("token")){
            navigate('/');
            return;
        }

        await dispatch(verifyUser(token)).unwrap();
        navigate('/');
    }, [])
  return (
    <div>verifying</div>
  )
}

export default verify