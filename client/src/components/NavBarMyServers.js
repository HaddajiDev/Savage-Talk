import React, { useEffect } from 'react';
import $ from 'jquery';
import '../NavBar.css';
import { useNavigate } from 'react-router-dom';
import MyServers from './MyServers';
import { logout } from '../redux/UserSlice';
import { useDispatch, useSelector } from 'react-redux';


function NavBarMyServers() {
    const mobileScreen = window.matchMedia("(max-width: 990px)");

    const dispatch = useDispatch();

    useEffect(() => {
        const handleDropdownToggle = function () {
            $(this).closest(".dashboard-nav-dropdown")
                .toggleClass("show")
                .find(".dashboard-nav-dropdown")
                .removeClass("show");
            $(this).parent()
                .siblings()
                .removeClass("show");
        };

        const handleMenuToggle = function () {
            if (mobileScreen.matches) {
                $(".dashboard-nav").toggleClass("mobile-show");
            } else {
                $(".dashboard").toggleClass("dashboard-compact");
            }
        };

        $(".dashboard-nav-dropdown-toggle").on("click", handleDropdownToggle);
        $(".menu-toggle").on("click", handleMenuToggle);
        $(".dashboard-nav-dropdown").first().addClass("show");
        return () => {
            $(".dashboard-nav-dropdown-toggle").off("click", handleDropdownToggle);
            $(".menu-toggle").off("click", handleMenuToggle);
        };
    }, [mobileScreen]);

    const navigate = useNavigate();
    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    }
    const currentUser = useSelector((state) => state.user.user);
    return (
        <div>
            <div className='dashboard'>
                <div className="dashboard-nav">
                    <header>
                        <a className="menu-toggle">
                            <i className="fas fa-bars"></i>
                        </a>
                        <a className="brand-logo pointer" onClick={() => navigate('/')}>
                            <i className="fas fa-anchor"></i> <span>Savage Talk</span>
                        </a>
                    </header>
                    <nav className="dashboard-nav-list">
                        {currentUser?.isAdmin ? <a className="dashboard-nav-item pointer" onClick={() => navigate('/dashboard')}>
                            <i class="fa-solid fa-gauge" style={{color: 'white'}}></i> Dashboard
                        </a> : null}
                        
                        <a className="dashboard-nav-item pointer" onClick={() => navigate('/')}>
                            <i className="fa-solid fa-user-group fa-lg" style={{color: 'white'}}></i> Friends
                        </a>
                        <a className="dashboard-nav-item pointer " onClick={() => navigate('/Groups')}>
                            <i className="fa-solid fa-people-group fa-lg" style={{color: 'white'}}></i> Groups
                        </a>                        
                        <div className='dashboard-nav-dropdown'>
                            <a className="dashboard-nav-item dashboard-nav-dropdown-toggle pointer">
                                <i className="fa-solid fa-server" style={{color: 'white'}}></i> Servers
                            </a>
                            <div className='dashboard-nav-dropdown-menu'>
                                <a className="dashboard-nav-dropdown-item pointer" onClick={() => navigate('/servers')}>All Servers</a>
                                <a className="dashboard-nav-dropdown-item pointer active" onClick={() => navigate('/myServers')}>Joined servers</a>
                                <a className="dashboard-nav-dropdown-item pointer" onClick={() => navigate('/createServer')}>Create Server</a>
                            </div>
                        </div>
                       
                        <div className="nav-item-divider"></div>
                        <a className="dashboard-nav-item pointer" onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt"></i> Logout
                        </a>
                    </nav>
                </div>
                <div className='dashboard-app'>
                    <header className='dashboard-toolbar'>
                        <a className="menu-toggle">
                            <i className="fas fa-bars"></i>
                        </a>
                    </header>
                    <div className='dashboard-content'>
                        <div className='container'>
                            <div>
                                <MyServers />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NavBarMyServers;
