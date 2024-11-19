const admin = require('firebase-admin');
const serviceAccount = require('../firebaseConfig.json'); // Asigură-te că `firebaseConfig.json` există în directorul corect

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;