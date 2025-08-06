
import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase/firebase';
import { useAuth } from '../../context/authContext';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
const AdminUsersManager = () => {
  const { isAdmin, currentUser, loading: authLoading } = useAuth();
  const [emailToModify, setEmailToModify] = useState('');
  const [roleToAssign, setRoleToAssign] = useState('tenant');
  const [actionMessage, setActionMessage] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);


  const assignUserRoleCallable = httpsCallable(functions, 'assignUserRole');
  
  const deleteUserAccountCallable = httpsCallable(functions, 'deleteUserAccount');

  // Effect to fetch all users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      if (authLoading || !isAdmin) {
        setLoadingUsers(false);
        setUsersList([]);
        return;
      }
      setLoadingUsers(true);
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const fetchedUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsersList(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users list:", error);
        setActionMessage("Error fetching users list.");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [authLoading, isAdmin]);

  // Function to handle assigning a role via the email input form
  const handleAssignRole = async () => {
    setActionMessage('');
    setLoadingAction(true);

    const allowedRoles = ['admin', 'manager', 'staff', 'tenant'];

    if (!emailToModify || !allowedRoles.includes(roleToAssign)) {
      setActionMessage('Please enter a valid email and select a role from: ' + allowedRoles.join(', ') + '.');
      setLoadingAction(false);
      return;
    }

    if (!currentUser) {
      setActionMessage('Error: You are not logged in. Please log in again.');
      setLoadingAction(false);
      return;
    }

    if (currentUser.getIdToken) {
      try {
        await currentUser.getIdToken(true);
      } catch (tokenError) {
        console.error("Error refreshing ID token:", tokenError);
        setActionMessage('Error: Failed to refresh authentication. Please log out and log in again.');
        setLoadingAction(false);
        return;
      }
    } else {
      console.warn("currentUser or getIdToken method not available before Cloud Function call.");
      setActionMessage('Error: Authentication user not fully available. Please log in again.');
      setLoadingAction(false);
      return;
    }

    console.log("Calling assignUserRole for:", emailToModify, "as role:", roleToAssign, "by user UID:", currentUser.uid);

    try {
      const result = await assignUserRoleCallable({ email: emailToModify, newRole: roleToAssign });
      setActionMessage(result.data.message);
      setEmailToModify('');

      const querySnapshot = await getDocs(collection(db, "users"));
      const updatedUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(updatedUsers);

    } catch (error) {
      console.error("Error calling assignUserRole function:", error);
      setActionMessage(`Error: ${error.message}`);
      if (error.code === 'permission-denied') {
        setActionMessage('You do not have permission to manage user roles.');
      } else if (error.code === 'not-found') {
        setActionMessage('User with that email not found.');
      } else if (error.code === 'unauthenticated') {
        setActionMessage('Session expired or not authenticated. Please log in again.');
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // Function to handle updating a role directly from the table dropdown
  const handleUpdateRoleInTable = async (userId, newRole) => {
    setActionMessage('');
    setLoadingUsers(true);

    if (!currentUser) {
      setActionMessage('Error: You are not logged in. Please log in again.');
      setLoadingUsers(false);
      return;
    }

    if (currentUser.getIdToken) {
      try {
        await currentUser.getIdToken(true);
        console.log("Current User UID:", currentUser.uid);
        const latestIdTokenResult = await currentUser.getIdTokenResult(false);
        console.log("Latest ID Token Claims for current user (after refresh):", latestIdTokenResult.claims);
        console.log("Is current user an admin according to client-side token?", latestIdTokenResult.claims.admin);
      } catch (tokenError) {
        console.error("Error refreshing ID token (table update):", tokenError);
        setActionMessage('Error: Failed to refresh authentication for table update. Please log out and log in again.');
        setLoadingUsers(false);
        return;
      }
    } else {
      console.warn("currentUser or getIdToken method not available before Cloud Function call (table update).");
      setActionMessage('Error: Authentication user not fully available for table update. Please log in again.');
      setLoadingUsers(false);
      return;
    }

    try {
      const userToUpdate = usersList.find(u => u.id === userId);
      if (!userToUpdate) {
        throw new Error("User not found in list for update.");
      }

      console.log("Calling assignUserRole for UID:", userId, "email:", userToUpdate.email, "as role:", newRole, "by user UID:", currentUser.uid);

      await assignUserRoleCallable({ email: userToUpdate.email, newRole: newRole });

      const querySnapshot = await getDocs(collection(db, "users"));
      const updatedUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(updatedUsers);

      setActionMessage(`Role for ${userToUpdate.email} updated to ${newRole}.`);

    } catch (error) {
      console.error("Error updating role directly from table:", error);
      setActionMessage(`Error updating role: ${error.message}`);
      if (error.code === 'permission-denied') {
        setActionMessage('You do not have permission to manage user roles.');
      } else if (error.code === 'not-found') {
        setActionMessage('User with that email not found.');
      } else if (error.code === 'unauthenticated') {
        setActionMessage('Session expired or not authenticated. Please log in again.');
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  // NEW: Function to handle deleting a user
  const handleDeleteUser = async (userToDelete) => {
    setActionMessage('');
    setLoadingAction(true); // Can use this for a global loading or add a specific state for delete

    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete user ${userToDelete.email}? This action cannot be undone.`)) {
      setLoadingAction(false);
      return;
    }

    // Self-deletion check (client-side prevention as well)
    if (currentUser?.uid === userToDelete.id) {
        setActionMessage('Error: You cannot delete your own account from this panel.');
        setLoadingAction(false);
        return;
    }

    if (!currentUser) {
        setActionMessage('Error: You are not logged in. Please log in again.');
        setLoadingAction(false);
        return;
    }

    // Force token refresh before calling Cloud Function
    if (currentUser.getIdToken) {
      try {
        await currentUser.getIdToken(true);
        console.log("Firebase ID token successfully refreshed before delete Cloud Function call.");
      } catch (tokenError) {
        console.error("Error refreshing ID token (delete):", tokenError);
        setActionMessage('Error: Failed to refresh authentication for delete. Please log out and log in again.');
        setLoadingAction(false);
        return;
      }
    } else {
      console.warn("currentUser or getIdToken method not available before delete Cloud Function call.");
      setActionMessage('Error: Authentication user not fully available for delete. Please log in again.');
      setLoadingAction(false);
      return;
    }

    try {
      console.log("Calling deleteUserAccount for UID:", userToDelete.id);
      const result = await deleteUserAccountCallable({ uid: userToDelete.id });
      setActionMessage(result.data.message);

      // Optimistically update the UI by removing the user from the list
      setUsersList(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));

      // Or, re-fetch the entire list to ensure consistency (more robust, but slower)
      // const querySnapshot = await getDocs(collection(db, "users"));
      // const updatedUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // setUsersList(updatedUsers);

    } catch (error) {
      console.error("Error calling deleteUserAccount function:", error);
      setActionMessage(`Error deleting user: ${error.message}`);
      if (error.code === 'permission-denied') {
        setActionMessage('You do not have permission to delete this user.');
      } else if (error.code === 'not-found') {
        setActionMessage('User not found.');
      } else if (error.code === 'unauthenticated') {
        setActionMessage('Session expired or not authenticated. Please log in again.');
      }
    } finally {
      setLoadingAction(false);
    }
  };


  // Display a loading message while authentication state is being determined
  if (authLoading) {
    return <div className="text-center mt-20">Loading authentication...</div>;
  }

  // Client-side access control: If the user is NOT an admin, display an unauthorized message
  if (!isAdmin) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-3xl font-bold">Unauthorized Access</h2>
        <p className="text-lg mt-4">You do not have permission to manage user roles. </p>
      </div>
    );
  }

  // If authorized (user is an admin), render the admin panel
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h1>User Role Management </h1>
      <p style={{paddingBottom: '10px'}}>Logged in as Admin: {currentUser?.email}</p>
      <p style={{paddingBottom: '10px'}}><Link to={'/home'}>Home</Link></p>

      {/* Section for assigning roles by email */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <h2  style={{paddingBottom: '10px'}}>Assign Role to User by Email</h2>
        <input
          type="email"
          value={emailToModify}
          onChange={(e) => setEmailToModify(e.target.value)}
          placeholder="user@example.com"
          style={{ width: 'calc(100% - 120px)', padding: '8px', marginBottom: '10px', marginRight: '10px' }}
        />
        <select
          value={roleToAssign}
          onChange={(e) => setRoleToAssign(e.target.value)}
          style={{ padding: '8px', marginBottom: '10px' }}
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
          <option value="tenant">Tenant</option>
        </select>
        <button
          onClick={handleAssignRole}
          disabled={loadingAction}
          style={{ padding: '10px 20px', backgroundColor: 'purple', color: 'white', border: 'none', cursor: 'pointer', display: 'block', width: '100%' }}
        >
          {loadingAction ? 'Processing...' : `Assign ${roleToAssign} Role`}
        </button>
        {actionMessage && (
          <p style={{ marginTop: '15px', color: actionMessage.startsWith('Error') ? 'red' : 'green' }}>
            {actionMessage}
          </p>
        )}
      </div>

      {/* Table displaying all registered users and their current roles */}
      <h2>All Registered Users</h2>
      {loadingUsers ? (
        <p>Loading users list...</p>
      ) : usersList.length === 0 ? (
        <p>No registered users found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Current Role</th>
              <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.email}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{user.role || 'N/A'}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  {user.id !== currentUser?.uid ? ( // Do not allow editing/deleting own user
                    <>
                      <select
                        value={user.role || 'tenant'}
                        onChange={(e) => handleUpdateRoleInTable(user.id, e.target.value)}
                        style={{ padding: '5px', marginRight: '10px' }}
                        disabled={loadingUsers}
                      >
                        <option value="tenant">Tenant</option>
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      {/* NEW: Delete Button */}
                      <button
                        onClick={() => handleDeleteUser(user)} // Pass the whole user object
                        disabled={loadingAction || loadingUsers} // Disable while any action or list loading
                        style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <span style={{ color: 'gray' }}> (Your account)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUsersManager;
