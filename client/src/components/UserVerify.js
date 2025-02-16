import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyUser } from '../redux/UserSlice';

function UserVerify() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    useEffect(() => {
        const verifyToken = async () => {
            if (localStorage.getItem("token")) {
                navigate('/');
                return;
            }

            const query = new URLSearchParams(location.search);
            const token = query.get("token");

            if (!token) {
                navigate('/login');
                return;
            }

            try {
                await dispatch(verifyUser({token: token})).unwrap();
                navigate('/');
            } catch (error) {
                navigate('/error');
            }
        };

        verifyToken();
    }, [dispatch, navigate, location.search]);

    return <div>Verifying...</div>;
}

export default UserVerify;