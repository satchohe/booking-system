import React, { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from '../../../firebase/auth'
import { useAuth } from '../../../context/authContext'
import styles from './login.module.css'
const Login = () => {
    const { userLoggedIn } = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSigningIn, setIsSigningIn] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const onSubmit = async (e) => {
        try {
            e.preventDefault()
        if(!isSigningIn) {
            setIsSigningIn(true)
            await doSignInWithEmailAndPassword(email, password)
            // doSendEmailVerification()
        }
            
        } catch (error) {
            setIsSigningIn(false);
            setErrorMessage("Wrong details entered");
            console.log(error );
            
        }
        
    }

    const onGoogleSignIn = (e) => {
        try {
            e.preventDefault()
            if (!isSigningIn) {
                setIsSigningIn(true)
                doSignInWithGoogle().catch(err => {
                    setIsSigningIn(false)
                })
            }
            
        } catch (error) {
            errorMessage("There is an error try again.")
            
        }
        
    }

    return (
        <div>
            {userLoggedIn && (<Navigate to={'/home'} replace={true} />)}

            <main className={styles.loginMain}>
                <div>
                    <div className={styles.welcomeBanner}>
                        <div className={styles.welcomeBannerInner}>
                            <h3 className={styles.welcome}>Welcome Back</h3>
                        </div>
                    </div>
                    <form
                        onSubmit={onSubmit}
                        className={styles.submit}
                    >
                        <div>
                            <label>
                                Email
                            </label>
                            <input
                                type="email"
                                autoComplete='email'
                                required
                                value={email} onChange={(e) => { setEmail(e.target.value) }}
                                className={styles.email}
                            />
                        </div>


                        <div>
                            <label className={styles.pwd}>
                                Password
                            </label>
                            <input
                                type="password"
                                autoComplete='current-password'
                                required
                                value={password} onChange={(e) => { setPassword(e.target.value) }}
                            />
                        </div>

                        {errorMessage && (
                            <span style={{color: 'red'}}>{errorMessage}</span>
                        )}

                        <button
                            type="submit"
                            disabled={isSigningIn}
                            className={styles.submit}
                        >
                            {isSigningIn ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                   
                </div>
            </main>
        </div>
    )
}

export default Login