import './App.css';
import {useEffect, useState} from 'react';
import Login from './components/Login';
import { Route, Routes } from 'react-router-dom';
import { currentUser } from './redux/UserSlice';
import { useDispatch, useSelector } from 'react-redux';

import 'bootstrap/dist/css/bootstrap.min.css';
import PrivateRoute from './components/PrivateRoute';
import NavBarFriends from './components/NavBarFriends';
import NavBarGroup from './components/NavBarGroup';
import NavBarList from './components/NavBarList';
import NavBarMyServers from './components/NavBarMyServers';
import NavBarCreate from './components/NavBarCreate';
import NavBarServerRoom from './components/NavBarServerRoom';
import DashboardPrivateRoute from './components/DashboardPrivateRoute';
import NavBarDasboard from './components/NavBarDasboard';
import {io}  from 'socket.io-client';

const socket = io(process.env.REACT_APP_LINK);
function App() { 
  const dispatch = useDispatch();
  const [ping, setPing] = useState(false);
  const isAuth = localStorage.getItem('token');
  const user = useSelector((state) => state.user.user);

 
  useEffect(() => {
      if (isAuth) {
        dispatch(currentUser());
      }
  }, [ping]);

  useEffect(() => {
    if(user){
      socket.emit('login', {userId: user._id});
    }    
  }, [user]);

  return (
    <div className="">      
      <Routes>
        <Route element={<PrivateRoute state="login"/>}>
        <Route path='/login' element={<Login />}/>
        </Route>
        <Route element={<PrivateRoute state="home"/>}>
          <Route path='/' element={<NavBarFriends />}/>          
          <Route path='/server/:id' element={<NavBarServerRoom />}/>
          <Route path='/servers' element={<NavBarList />}/>
          <Route path='/Groups' element={<NavBarGroup />} />
          <Route path='/myServers' element={<NavBarMyServers />} />
          <Route path='/createServer' element={<NavBarCreate />} />
        </Route>
        <Route element={<DashboardPrivateRoute />}>
          <Route path='/dashboard' element={<NavBarDasboard />}/>
        </Route>
      </Routes>
    </div>

    
  );
}

export default App;
