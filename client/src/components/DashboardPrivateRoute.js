import React from 'react'
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

function DashboardPrivateRoute() {
    const currentUser = useSelector((state) => state.user.user);
    return currentUser?.isAdmin ? <Outlet /> : <Navigate to='/'/>
}

export default DashboardPrivateRoute