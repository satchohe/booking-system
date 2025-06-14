// Somewhere in your admin panel, e.g., components/AdminPanel.jsx
import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../firebase/firebase';

const functions = getFunctions(app);

export const AdminPanel = () => {
    const [emailToMakeAdmin, setEmailToMakeAdmin] = useState('');
    const[message, setMessage] = useState('');
    const[loading, setLoading] = useState('');
    
    const handleMakeAdmin = async () =>{
        setMessage('');
        setLoading(true);
        try {
            //calling cloud function
            const makeAdminCallable = httpsCallable(functions, 'makeAdmin');
            const result = await makeAdminCallable({email: emailToMakeAdmin});
            setMessage(result.data.message);
            
        } catch (error) {
            console.error("Error calling madeAdmin function: ", error);
            setMessage(`Error: ${error.message}`);
            
        }
        finally{
            setLoading(false);
        }
    }
  return (
    <div>
      <h2>Admin Role Management</h2>
      <p>Enter email to grant admin privileges:</p>
      <input
        type="email"
        value={emailToMakeAdmin}
        onChange={(e) => setEmailToMakeAdmin(e.target.value)}
        placeholder="user@example.com"
      />
      <button onClick={handleMakeAdmin} disabled={loading}>
        {loading ? 'Processing...' : 'Make Admin'}
      </button>
      {message && <p>{message}</p>}
      <p style={{ color: 'red' }}>
        **WARNING:** In a real application, calling this function should be
        highly secured and only accessible to truly authorized super-admins.
      </p>
    </div>
  );
}

