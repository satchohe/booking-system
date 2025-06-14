import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/authContext'
import { doSignOut } from '../../firebase/auth'
import styles from './header.modules.css'
const Header = () => {
    const navigate = useNavigate()
    const { userLoggedIn } = useAuth()

    const handleLogout =  () => {
        doSignOut();
        navigate('/')
       
    }

    return (
        <nav className='navContainer'>
            {
                userLoggedIn
                    ? (
                        <button
                            onClick={handleLogout}
                            className='logoutButton'
                        >
                            Logout
                        </button>
                    ) : (
                        <>
                            
                        </>
                    )
            }
        </nav>
    )
}

export default Header
