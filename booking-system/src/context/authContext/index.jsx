// src/context/authContext.js

import { onAuthStateChanged, /*signOut*/ } from "firebase/auth"; // signOut imported but not used in this snippet
import { auth, db } from "../../firebase/firebase"; // **IMPORT db (Firestore)**
import React, { useContext, useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"; // **IMPORT Firestore functions**

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // Admin (Business Owner)
  const [isManager, setIsManager] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isTenant, setIsTenant] = useState(false);
  const [userProfile, setUserProfile] = useState(null); // User's document from Firestore
  const [loading, setLoading] = useState(true);

  // useEffect to set up the authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, initializeUser); // Calls initializeUser when auth state changes
    return unsubscribe;
  }, []); // Empty dependency array means this effect runs once on mount

  // initializeUser function now contains all the logic for user setup
  async function initializeUser(user) {
    if (user) {
      setCurrentUser(user);
      setUserLoggedIn(true);

      // 1. Get Custom Claims (secure source for roles)
      const idTokenResult = await user.getIdTokenResult(true); // Forces token refresh to get latest claims
      const claims = idTokenResult.claims;

      const adminClaim = claims.admin === true;
      const managerClaim = claims.manager === true;
      const staffClaim = claims.staff === true;
      console.log("Firebase ID Token Claims:", idTokenResult.claims);

    
        
      
      setIsAdmin(adminClaim);
      setIsManager(managerClaim);
      setIsStaff(staffClaim);
      // A user is a tenant if they are authenticated but neither admin, manager, nor staff
      setIsTenant(!adminClaim && !managerClaim && !staffClaim);

      // 2. Fetch or create user profile from Firestore 'users' collection
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        setUserProfile(userDocSnap.data());

      } else {
        const newProfileData = {
          email: user.email,
          displayName: user.displayName || null, 
          role: 'tenant', // Default Firestore role for newly created profiles
          createdAt: serverTimestamp(), // Use serverTimestamp for new documents
        };
        await setDoc(userDocRef, newProfileData); // Use setDoc (not update) for new documents
        setUserProfile(newProfileData);
        
      }

    } else {
      // User is logged out
      setCurrentUser(null);
      setUserLoggedIn(false);
      setIsAdmin(false);
      setIsManager(false);
      setIsStaff(false);
      setIsTenant(false);
      setUserProfile(null); // Clear user profile on logout
    }
    setLoading(false); // Authentication initialization is complete
  }

  // The value object provided to consumers of the context
  const value = {
    currentUser,
    userLoggedIn,
    isAdmin,      // Admin (Business Owner) from custom claim
    isManager,    // Manager from custom claim
    isStaff,      // Staff from custom claim
    isTenant,     // Derived from absence of other claims
    userProfile,  // User's profile data from Firestore
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <div>Loading authentication...</div> : children} {/* Show loading while auth is initializing */}
    </AuthContext.Provider>
  );
}