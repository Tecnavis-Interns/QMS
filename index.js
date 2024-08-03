import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cron from 'node-cron';
import admin from 'firebase-admin';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  }),
});

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Function to clear a collection
async function clearCollection(collectionName) {
  console.log(`Attempting to clear collection: ${collectionName}`);
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`No documents found in collection: ${collectionName}`);
    return;
  }
  
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Collection ${collectionName} has been cleared. ${snapshot.docs.length} documents deleted.`);
}

// Function to reset counters' completed field and clear received history
async function resetCounters() {
  console.log('Resetting counters...');
  const countersRef = db.collection('counters');

  try {
    const snapshot = await countersRef.get();
    if (snapshot.empty) {
      console.log('No counters found.');
      return;
    }

    const batch = db.batch();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log(`Updating counter ${doc.id}: current completed value = ${data.completed}`);

      // Update the `completed` field to 0
      batch.update(doc.ref, { completed: 0 });

      // Extract the counter name from the email and clear `receivedTokens`
      if (data.email) {
        const counterName = data.email.split('@')[0];
        const counterCollectionRef = db.collection(counterName); // Collection
        await clearCounterDoc(counterCollectionRef);
      }
    }

    await batch.commit();
    console.log('Counters have been reset: completed set to 0 and receivedHistory cleared.');
  } catch (error) {
    console.error('Error resetting counters:', error);
  }
}

// Function to clear `receivedTokens` array in `counterDoc` document
async function clearCounterDoc(counterCollectionRef) {
  try {
    // Assuming counterDoc is the document ID
    const counterDocRef = counterCollectionRef.doc('counterDoc');
    await counterDocRef.update({ 
      receivedTokens: [], 
      priority: [], 
      nowServingToken: '-' 
    });
    console.log(`Cleared receivedTokens, priority array and set nowservingtoken to '-' in counterDoc.`);
  } catch (error) {
    console.error(`Error updating counterDoc: ${error}`);
  }
}


cron.schedule('0 0 * * *', async () => {
  console.log('Cron job started at:', new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  try {
    await clearCollection('requests');
    await clearCollection('queue');
    await resetCounters();
    console.log('Collections and counters have been reset successfully.');
  } catch (error) {
    console.error('Error resetting collections or counters:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});

console.log('Cron job scheduled. Running every day at 12:00 AM India Standard Time.');
console.log('Current server time:', new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});