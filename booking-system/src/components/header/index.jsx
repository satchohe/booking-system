import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/authContext'
import { doSignOut } from '../../firebase/auth'
import styles from './header.modules.css'
const Header = () => {
    const navigate = useNavigate()
    const { userLoggedIn } = useAuth()

    const handleLogout = async () => {
        console.log("Sign out1: Initiating logout process...");
        try {
            await doSignOut(); // Await the asynchronous sign-out operation
            console.log("Signout 2: User successfully signed out.");
            // Only navigate after successful sign-out
            navigate('/'); 
        } catch (error) {
            console.error("Error during logout:", error);
            // Optionally, provide user feedback about the logout error
            // alert("Failed to log out. Please try again."); 
            // For a better UX, display a message in the UI instead of an alert
        }
    };

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
