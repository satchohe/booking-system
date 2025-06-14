// viewClaims.js
const admin = require('firebase-admin');
const serviceAccount = require('./scripts/serviceAccountKey.json'); // <-- UPDATE THIS PATH AND FILENAME

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function listAllUsersCustomClaims() {
  const usersData = [];
  let nextPageToken = undefined;

  console.log("Fetching all users and their custom claims...");

  try {
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken); // Fetch up to 1000 users at a time
      listUsersResult.users.forEach(userRecord => {
        const email = userRecord.email || '[No Email]';
        const uid = userRecord.uid;
        const customClaims = userRecord.customClaims || {}; // Get custom claims

        // Optionally, filter or format claims as needed
        const simplifiedClaims = {
            admin: customClaims.admin === true,
            manager: customClaims.manager === true,
            staff: customClaims.staff === true,
            tenant: customClaims.tenant === true,
            // Add any other specific claims you set
        };

        usersData.push({
          email: email,
          uid: uid,
          customClaims: simplifiedClaims // Or just customClaims for raw object
        });
      });
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    // Output to console as nicely formatted JSON
    console.log("\n--- All Users with Custom Claims ---");
    console.log(JSON.stringify(usersData, null, 2)); // `null, 2` for pretty printing

    return usersData; // Return data if you wanted to do something else with it
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1); // Exit with an error code
  }
}

// Run the function
listAllUsersCustomClaims();