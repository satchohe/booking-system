// firebase-functions/functions/index.js

const admin = require("firebase-admin");
const {onCall, HttpsError} = require("firebase-functions/v2/https"); // Correct V2 imports

// Initialize Firebase Admin SDK only once
admin.initializeApp();

// HTTP callable function to assign a user a specific role (admin, manager, staff, tenant)
// Using Firebase Functions V2 callable syntax
exports.assignUserRole = onCall(async (request) => { // Changed to V2 onCall
  console.log("--- START: assignUserRole V2.2 (Standardized to V2) ---");
  console.log("Caller Auth object:", request.auth);

  // Authenticate the caller:
  if (!request.auth) {
    console.log("Authentication failed in V2.2: request.auth is null.: " + request.auth);
    throw new HttpsError( // Changed to V2 HttpsError
        "unauthenticated", // Double quotes
        "Only authenticated users can call this function.", // Double quotes
    );
  }

  // 2. Authorize the caller: Only 'admin' (business owner) can assign roles.
  if (!request.auth.token.admin) {
    throw new HttpsError( // Changed to V2 HttpsError
        "permission-denied", // Double quotes
        "Only business owners (admin role) can assign or change user roles.", // Double quotes
    );
  }

  const {email, newRole} = request.data;
  const allowedRoles = ["admin", "manager", "staff", "tenant"]; // Double quotes for array elements

  if (!email || !allowedRoles.includes(newRole)) {
    throw new HttpsError( // Changed to V2 HttpsError
        "invalid-argument", // Double quotes
        "The function must be called with a valid email address and a role from: " + allowedRoles.join(", ") + ".", // Double quotes
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
    console.log(`Custom claims set for ${email} to:`, claimsToSet); // Template literal is fine

    await admin.firestore().collection("users").doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || null,
      role: firestoreRole,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    console.log(`Firestore user document updated for ${email} with role: ${firestoreRole}`);

    return {message: `Success! User ${email} is now assigned the role: ${firestoreRole}.`}; // Template literal is fine
  } catch (error) {
    console.error("Error assigning role:", error); // Double quotes
    if (error.code === "auth/user-not-found") { // Double quotes
      throw new HttpsError( // Changed to V2 HttpsError
          "not-found", // Double quotes
          "User with that email does not exist.", // Double quotes
      );
    }
    throw new HttpsError( // Changed to V2 HttpsError
        "internal", // Double quotes
        "Failed to assign role.", // Double quotes
        error.message,
    );
  }
});

// HTTP callable function to delete a user account from Auth and their profile from Firestore
// Using Firebase Functions V2 callable syntax
exports.deleteUserAccount = onCall(async (request) => { // Stays as V2 onCall
  console.log("--- START: deleteUserAccount Cloud Function ---");
  console.log("Caller Auth object:", request.auth);

  // 1. Authenticate the caller: Only authenticated users can call this function.
  if (!request.auth) {
    console.warn("Unauthenticated attempt to delete user."); // Double quotes
    throw new HttpsError(
        "unauthenticated", // Double quotes
        "Only authenticated users can call this function.", // Double quotes
    );
  }

  // 2. Authorize the caller: Only 'admin' (business owner) can delete users.
  // This check relies on custom claims being set for the calling user.
  if (!request.auth.token.admin) {
    console.warn(`Permission denied: User ${request.auth.uid} tried to delete user without admin role.`);
    throw new HttpsError(
        "permission-denied", // Double quotes
        "Only business owners (admin role) can delete user accounts.", // Double quotes
    );
  }

  // 3. Validate input: Ensure the UID of the user to be deleted is provided.
  const uidToDelete = request.data.uid;
  if (!uidToDelete || typeof uidToDelete !== "string") { // Double quotes
    console.warn("Invalid argument: UID for deletion missing or invalid."); // Double quotes
    throw new HttpsError(
        "invalid-argument", // Double quotes
        "The function must be called with a valid user UID to delete.", // Double quotes
    );
  }

  // 4. Prevent self-deletion: An admin should not be able to delete their own account via this function.
  if (request.auth.uid === uidToDelete) {
    console.warn(`Self-deletion attempt: Admin ${request.auth.uid} tried to delete their own account.`);
    throw new HttpsError(
        "permission-denied", // Double quotes
        "Admins cannot delete their own account via this panel. Use the Firebase Console directly for self-deletion if necessary.", // Double quotes
    );
  }

  console.log(`Attempting to delete user with UID: ${uidToDelete}`);

  try {
    // Delete user from Firebase Authentication
    await admin.auth().deleteUser(uidToDelete);
    console.log(`Successfully deleted user from Firebase Auth: ${uidToDelete}`);

    // Delete user's profile document from Firestore
    await admin.firestore().collection("users").doc(uidToDelete).delete();
    console.log(`Successfully deleted user profile from Firestore: ${uidToDelete}`);

    return {message: `User and their profile successfully deleted.`};
  } catch (error) {
    console.error(`Error deleting user ${uidToDelete}:`, error);

    // Provide user-friendly messages for common errors
    if (error.code === "auth/user-not-found") { // Double quotes
      throw new HttpsError("not-found", "User not found in Firebase Authentication."); // Double quotes
    }
    // Generic error
    throw new HttpsError("internal", `Failed to delete user: ${error.message}`); // Double quotes
  }
});
