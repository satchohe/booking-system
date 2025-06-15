import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/authContext'
import { doSignOut } from '../../firebase/auth'
import styles from './header.modules.css'
const Header = () => {
    const navigate = useNavigate()
    const { userLoggedIn } = useAuth()

    const handleLogout =  () => {
        console.log("Sign out1");
        doSignOut();
        console.log("Signout 2");
        navigate('/')

       
    }

    return (
        <nav className='navContainer'>
            {
                userLoggedIn
                    ? (
                        <button
                            onClick={handleLogout}
                            className={styles.logoutButton}
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
