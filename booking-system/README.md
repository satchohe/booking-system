Booking System & User Management
================================

This repository contains the front-end components for a booking and tenant management system, built with React and integrated with Firebase for backend services. It allows authorised users to manage tenant records and administrators to control user roles within the system.

Features
--------

### Tenant Management (Home.jsx)

*   **View Tenants:** Displays a comprehensive table of all existing tenant bookings.
    
*   **Add New Tenant:** Provides a form to input details for new tenant bookings, including personal information, contact details, and tenancy dates.
    
*   **Edit Tenant Records:** Allows authorised staff to modify existing tenant information.
    
*   **Delete Tenant Records:** Enables managers and administrators to remove tenant records.
    
*   **CSV Export:** Facilitates the export of all tenant data to a CSV file, useful for reporting and record-keeping.
    
*   **Date Validation:** Ensures that the tenancy end date is not before the start date.
    
*   **Duplicate Email Prevention:** Prevents the creation of new tenants or updating existing ones with an email address that already exists in the system (excluding the current tenant when editing).
    
*   **Role-Based Access:** Access to adding, editing, and deleting tenants is strictly controlled based on user roles (Admin, Manager, Staff).
    

### User Role Management (AdminUsersManager.jsx)

*   **Assign User Roles:** Administrators can assign specific roles (Admin, Manager, Staff, Tenant) to users by their email address.
    
*   **Update User Roles:** Roles can be changed directly from a dropdown within the user table.
    
*   **Delete User Accounts:** Administrators have the capability to permanently delete user accounts from the system.
    
*   **User Listing:** Displays a table of all registered users and their current assigned roles.
    
*   **Admin-Only Access:** This entire section is exclusively accessible by users with the 'Admin' role, ensuring robust security for user management.
    
*   **Self-Deletion Prevention:** Prevents an administrator from accidentally deleting their own account.
    

Technologies Used
-----------------

*   **React:** A JavaScript library for building user interfaces.
    
*   **Firebase:**
    
    *   **Firestore:** For storing and retrieving tenant and user data.
        
    *   **Authentication:** For user login, registration, and session management.
        
    *   **Cloud Functions:** Used for secure server-side operations, particularly for managing user roles and deleting user accounts.
        
*   **React Router DOM:** For declarative routing within the application.
    
*   **Font Awesome:** For scalable vector icons.
    
*   **text-csv (implied):** For CSV generation.
    

Prerequisites
-------------

Before running this application, ensure you have the following installed:

*   **Node.js & npm (or Yarn):** Essential for running React applications and managing dependencies.
    
*   **Firebase Project:** You will need an active Firebase project with:
    
    *   **Firestore Database** enabled.
        
    *   **Firebase Authentication** enabled.
        
    *   **Firebase Cloud Functions** deployed for user role assignment and deletion.
        
*   **Firebase Configuration:** Your project will need a src/firebase/firebase.js file (or similar) containing your Firebase project's configuration details.
    

Installation & Setup
--------------------

1.  git clone \[YOUR\_REPOSITORY\_URL\]cd \[your-project-directory\]
    
2.  npm install# oryarn install
    
3.  // src/firebase/firebase.jsimport { initializeApp } from 'firebase/app';import { getFirestore } from 'firebase/firestore';import { getAuth } from 'firebase/auth';import { getFunctions } from 'firebase/functions';const firebaseConfig = { apiKey: "YOUR\_API\_KEY", authDomain: "YOUR\_AUTH\_DOMAIN", projectId: "YOUR\_PROJECT\_ID", storageBucket: "YOUR\_STORAGE\_BUCKET", messagingSenderId: "YOUR\_MESSAGING\_SENDER\_ID", appId: "YOUR\_APP\_ID"};const app = initializeApp(firebaseConfig);export const db = getFirestore(app);export const auth = getAuth(app);export const functions = getFunctions(app); // Ensure this is correctly initialised
    
4.  **Deploy Cloud Functions:**The user role management and user deletion functionalities rely on Firebase Cloud Functions. You'll need to deploy these functions from your Firebase project. Ensure you have functions named assignUserRole and deleteUserAccount deployed.
    
5.  npm start# oryarn startThe application will typically open in your browser at http://localhost:3000.
    

Usage
-----

1.  **Login/Registration:** Access the application and log in with an existing account or register a new one.
    
2.  **Tenant Management:**
    
    *   If you have 'Admin', 'Manager', or 'Staff' roles, you will see the tenant table on the home page.
        
    *   Use the "Add Tenant" button to create new records.
        
    *   Use the "Edit" and "Delete" buttons next to each tenant record for modifications.
        
    *   'Admin' and 'Manager' roles can use the "Export to Excel" button to download tenant data.
        
3.  **User Role Management (Admin Only):**
    
    *   If you have the 'Admin' role, you will see a "Change roles" button (linking to /admin). Click this to access the user management panel.
        
    *   From here, you can assign roles by email or update roles directly in the table.
        
    *   You can also delete user accounts (excluding your own).
        

Important Notes
---------------

*   **Permissions:** The application heavily relies on Firebase Authentication and Custom Claims for role-based access control. Ensure your Firebase Security Rules for Firestore are configured to match these roles.
    
*   **Confirmation Dialogs:** The AdminUsersManager component uses window.confirm for user deletion confirmation. In a production-grade React application, it's generally recommended to replace native browser alert and confirm with custom modal components for a more consistent user experience and better control over styling.
    
*   **Error Handling:** Basic error messages are displayed for user feedback. For a production environment, more robust error logging and handling might be desired.
