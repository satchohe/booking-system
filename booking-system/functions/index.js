

const admin = require("firebase-admin");
const {onCall, HttpsError} = require("firebase-functions/v2/https"); 


admin.initializeApp();



exports.assignUserRole = onCall(async (request) => { 
  console.log("--- START: assignUserRole V2.2 (Standardized to V2) ---");
  console.log("Caller Auth object:", request.auth);

  
  if (!request.auth) {
    console.log("Authentication failed in V2.2: request.auth is null.: " + request.auth);
    throw new HttpsError( 
        "unauthenticated", 
        "Only authenticated users can call this function.", 
    );
  }

  
  if (!request.auth.token.admin) {
    throw new HttpsError( 
        "permission-denied", 
        "Only business owners (admin role) can assign or change user roles.", 
    );
  }

  const {email, newRole} = request.data;
  const allowedRoles = ["admin", "manager", "staff", "tenant"]; 

  if (!email || !allowedRoles.includes(newRole)) {
    throw new HttpsError( 
        "invalid-argument", 
        "The function must be called with a valid email address and a role from: " + allowedRoles.join(", ") + ".", 
    );
  }

  try {
    const user = await admin.auth().getUserByEmail(email);

    const claimsToSet = {
      admin: false,
      manager: false,
      staff: false,
      tenant: false,
    };
    let firestoreRole = "tenant";

    if (newRole === "admin") {
      claimsToSet.admin = true;
      firestoreRole = "admin";
    } else if (newRole === "manager") {
      claimsToSet.manager = true;
      firestoreRole = "manager";
    } else if (newRole === "staff") {
      claimsToSet.staff = true;
      firestoreRole = "staff";
    } else if (newRole === "tenant") {
      claimsToSet.tenant = true;
      firestoreRole = "tenant";
    }

    await admin.auth().setCustomUserClaims(user.uid, claimsToSet);
    console.log(`Custom claims set for ${email} to:`, claimsToSet); 

    await admin.firestore().collection("users").doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || null,
      role: firestoreRole,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    console.log(`Firestore user document updated for ${email} with role: ${firestoreRole}`);

    return {message: `Success! User ${email} is now assigned the role: ${firestoreRole}.`}; 
  } catch (error) {
    console.error("Error assigning role:", error); 
    if (error.code === "auth/user-not-found") { 
      throw new HttpsError( 
          "not-found", 
          "User with that email does not exist.", 
      );
    }
    throw new HttpsError( 
        "internal", 
        "Failed to assign role.", 
        error.message,
    );
  }
});



exports.deleteUserAccount = onCall(async (request) => { 
  console.log("--- START: deleteUserAccount Cloud Function ---");
  console.log("Caller Auth object:", request.auth);

  
  if (!request.auth) {
    console.warn("Unauthenticated attempt to delete user."); 
    throw new HttpsError(
        "unauthenticated", 
        "Only authenticated users can call this function.", 
    );
  }

  
  
  if (!request.auth.token.admin) {
    console.warn(`Permission denied: User ${request.auth.uid} tried to delete user without admin role.`);
    throw new HttpsError(
        "permission-denied", 
        "Only business owners (admin role) can delete user accounts.", 
    );
  }

  
  const uidToDelete = request.data.uid;
  if (!uidToDelete || typeof uidToDelete !== "string") { 
    console.warn("Invalid argument: UID for deletion missing or invalid."); 
    throw new HttpsError(
        "invalid-argument", 
        "The function must be called with a valid user UID to delete.", 
    );
  }

  
  if (request.auth.uid === uidToDelete) {
    console.warn(`Self-deletion attempt: Admin ${request.auth.uid} tried to delete their own account.`);
    throw new HttpsError(
        "permission-denied", 
        "Admins cannot delete their own account via this panel. Use the Firebase Console directly for self-deletion if necessary.", 
    );
  }

  console.log(`Attempting to delete user with UID: ${uidToDelete}`);

  try {
    
    await admin.auth().deleteUser(uidToDelete);
    console.log(`Successfully deleted user from Firebase Auth: ${uidToDelete}`);

    
    await admin.firestore().collection("users").doc(uidToDelete).delete();
    console.log(`Successfully deleted user profile from Firestore: ${uidToDelete}`);

    return {message: `User and their profile successfully deleted.`};
  } catch (error) {
    console.error(`Error deleting user ${uidToDelete}:`, error);

    
    if (error.code === "auth/user-not-found") { 
      throw new HttpsError("not-found", "User not found in Firebase Authentication."); 
    }
    
    throw new HttpsError("internal", `Failed to delete user: ${error.message}`); 
  }
});
