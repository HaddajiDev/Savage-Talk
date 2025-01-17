import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {  userLogin } from '../redux/UserSlice';
import cover from '../cover.png';

function Login() {
    const [user, setUser] = useState({
        email: '',
        password: ''
      });
    
      const dispatch = useDispatch();
      const navigate = useNavigate();
            
      const { status, error } = useSelector((state) => state.user);  
      const currentUser = useSelector((state) => state.user.user);
      const handleLogin = async () => {
        
        try {      
          await dispatch(userLogin(user)).unwrap();   
          navigate('/');
        } catch (error) {
          console.error('Failed to login:', error);
        }
      };

      
  return (
    <div className='conti'>
      <img src={cover} alt='cover' style={{width: "250px"}}/>
      <div className="login-container">
        <h1>Login</h1>
        <div className="login-form">
          <input type="text" placeholder="email" onChange={(e) => setUser({ ...user, email: e.target.value })} className="form-control" />
          <input type="password" placeholder="password" onChange={(e) => setUser({ ...user, password: e.target.value })} className="form-control" />
          <button onClick={() => handleLogin()} className="btn btn-primary mb-3">
            {status === 'pending' ?  <i class="fa fa-spinner fa-pulse fa-2x fa-fw fa-lg"></i> : "Login" }</button>          
        </div>
        {status === 'failed' && <p style={{ color: 'red' }}>{error}</p>}
        <a href='https://savageblog.vercel.app/' target='_blank' className="">You don't have an account ? Register on savageblog</a>
      </div>
    </div>
  )
}

export default Login