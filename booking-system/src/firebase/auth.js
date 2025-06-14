import { auth,db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  //signInWithPopup,
  //GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";

export const doCreateUserWithEmailAndPassword = async (email, password, name) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await updateProfile(user, {
        displayName: name,
  });

  // 2. Save user data to Firestore
  const userDocRef = doc(db, 'users', user.uid); // Reference to a document in 'users' collection with user's UID
  await setDoc(userDocRef, { // Set the data for that document
    uid: user.uid,
    email: user.email,
    name: name, 
    createdAt: new Date(),
    role: 'tenant',
    // You can add default roles or other initial data here if needed, e.g.:
    // role: 'tenant',
  });
    console.log("3: " , name);

  return user;
};

export const doSignInWithEmailAndPassword = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};
/*
export const doSignInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // add user to firestore
};*/

export const doSignOut = () => {
  return auth.signOut();
};

export const doPasswordReset = (email) => {
  return sendPasswordResetEmail(auth, email);
};

export const doPasswordChange = (password) => {
  return updatePassword(auth.currentUser, password);
};

export const doSendEmailVerification = () => {
  return sendEmailVerification(auth.currentUser, {
    url: `${window.location.origin}/home`,
  });
};
