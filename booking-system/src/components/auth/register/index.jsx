import  { useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/authContext'
import { doCreateUserWithEmailAndPassword } from '../../../firebase/auth'

const Register = () => {

    const navigate = useNavigate()
    const [name, setName] = useState('')

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setconfirmPassword] = useState('')
    const [isRegistering, setIsRegistering] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const { userLoggedIn } = useAuth()

    const onSubmit = async (e) => {
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        const trimmedName = name.trim();
        e.preventDefault();
        setErrorMessage("");
        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }
        if(password.length < 6){
            setErrorMessage("Password needs to be at least 6 characters long");
            return;
        }
        if(isRegistering) return;
        setIsRegistering(true)

            
        try {           
             await doCreateUserWithEmailAndPassword(trimmedEmail, trimmedPassword, trimmedName);
             navigate('/home');     
        } catch (error) {
            setIsRegistering(false);
            if (error.code === 'auth/email-already-in-use') {
                setErrorMessage('This email address is already in use. Please try logging in, or use a different email.');
            } else if (error.code === 'auth/weak-password') {
                setErrorMessage('Password is too weak. Please use at least 6 characters.');
            } else if (error.code === 'auth/invalid-email') {
                setErrorMessage('The email address is not valid.');
            }
            // You can add more specific checks for other auth errors if needed
            else {
                setErrorMessage('Failed to create account');
            }
            
        }
        finally{
             setIsRegistering(false);

        }
       
    }

    return (
        <>
            {userLoggedIn && (<Navigate to={'/home'} replace={true} />)}

            <main className="w-full h-screen flex self-center place-content-center place-items-center">
                <div className="w-96 text-gray-600 space-y-5 p-4 shadow-xl border rounded-xl">
                    <div className="text-center mb-6">
                        <div className="mt-2">
                            <h3 className="text-gray-800 text-xl font-semibold sm:text-2xl">Create a New Account</h3>
                        </div>

                    </div>
                    <form
                        onSubmit={onSubmit}
                        className="space-y-4"
                    >
                        <div>
                            <label htmlFor="name">Full Name</label>
                            <input type="text" 
                            name="name" 
                            id="name" 
                            required
                            value={name} onChange={(e) =>{setName(e.target.value)} }
                             />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600 font-bold">
                                Email
                            </label>
                            <input
                                type="email"
                                autoComplete='email'
                                required
                                value={email} onChange={(e) => { setEmail(e.target.value) }}
                                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:indigo-600 shadow-sm rounded-lg transition duration-300"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 font-bold">
                                Password
                            </label>
                            <input
                                disabled={isRegistering}
                                type="password"
                                autoComplete='new-password'
                                required
                                value={password} onChange={(e) => { setPassword(e.target.value) }}
                                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 font-bold">
                                Confirm Password
                            </label>
                            <input
                                disabled={isRegistering}
                                type="password"
                                autoComplete='off'
                                required
                                value={confirmPassword} onChange={(e) => { setconfirmPassword(e.target.value) }}
                                className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
                            />
                        </div>

                        {errorMessage && (
                            <span style={{color: 'red', paddingBottom: '10px'}} className='text-red-600 font-bold'>{errorMessage}</span>
                        )}

                        <button
                            type="submit"
                            disabled={isRegistering}
                            className={`w-full px-4 py-2 text-white font-medium rounded-lg ${isRegistering ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl transition duration-300'}`}
                        >
                            {isRegistering ? 'Signing Up...' : 'Sign Up'}
                        </button>
                        <div className="text-sm text-center">
                            Already have an account? {'   '}
                            <Link to={'/login'} className="text-center text-sm hover:underline font-bold">Continue</Link>
                        </div>
                    </form>
                </div>
            </main>
        </>
    )
}

export default Register