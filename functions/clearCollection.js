const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Clears all documents in a given Firestore collection.
 * @param {string} collectionName - The name of the collection to clear.
 */
async function clearCollection(collectionName) {
  const collectionRef = admin.firestore().collection(collectionName);
  const snapshot = await collectionRef.get();

  const batch = admin.firestore().batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Collection '${collectionName}' cleared successfully`);
}

/**
 * Clears a specific document in a given Firestore collection.
 * @param {string} collectionName - The name of the collection
 *  containing the document.
 * @param {string} documentName - The name of the document to clear.
 */
async function clearDocument(collectionName, documentName) {
  const docRef = admin.firestore().collection(collectionName).doc(documentName);
  const docSnapshot = await docRef.get();

  if (docSnapshot.exists) {
    await docRef.delete();
    console.log(`Document '${documentName}' in collection 
        '${collectionName}' cleared successfully`);
  }
}

/**
 * Cloud function to clear
 * specific collections and documents daily.
 */
async function clearCollectionsDaily(context) {
  // List of static collections to clear
  const collectionsToClear = ['requests', 'queue'];

  // Clear static collections
  for (const collection of collectionsToClear) {
    await clearCollection(collection);
  }

  // Fetch dynamic counter names from the 'counters' collection
  const countersSnapshot = await admin
    .firestore()
    .collection('counters')
    .get();
  const counterNames = countersSnapshot.docs.map(
    (doc) => doc.data().counterName
  );

  // Clear the 'counterDoc' document in each dynamic counter collection
  for (const counterName of counterNames) {
    const dynamicCollectionName = `counter${counterName}`;
    await clearDocument(dynamicCollectionName, 'counterDoc');
  }

  console.log('All cleared successfully');
}

module.exports = { clearCollectionsDaily };
