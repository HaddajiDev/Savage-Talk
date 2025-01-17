import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom';

function PrivateRoute({state}) {
  const isAuth = localStorage.getItem("token");
	if (state === 'home') {        
    return isAuth ? <Outlet /> : <Navigate to='/login' />;
  } else if (state === 'login') {
      return !isAuth ? <Outlet /> : <Navigate to='/' />;
  }    
  return <Navigate to='/' />;
}

export default PrivateRoute