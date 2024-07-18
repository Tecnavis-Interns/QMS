import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import bcrypt from 'bcryptjs';
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";


// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwYQ9ulSdOAsrzTiPKY5AFgchq8zcXDXc",
  authDomain: "qms-single.firebaseapp.com",
  projectId: "qms-single",
  storageBucket: "qms-single.appspot.com",
  messagingSenderId: "777295272594",
  appId: "1:777295272594:web:fedd23ee8a069310f8e44b",
  measurementId: "G-G2Q8CR4PST"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence);

// Function to submit data to Firestore
const submitDataToFirestore = async (collectionName, data) => {
  try {
    data.date = serverTimestamp();
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id; // Return the generated ID
  } catch (error) {
    console.error("Error submitting data: ", error);
    throw error; // Re-throw the error to handle it at the caller level
  }
};

// New function to check login credentials
const signIn = async (email, password) => {
  if (email === "admin@qms.com" && password === "QMS@123") {
    return "admin";
  }

  if (email.endsWith("@qms.com")) {
    const countersRef = collection(db, "counters");
    const q = query(countersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const counterDoc = querySnapshot.docs[0];
      const counterData = counterDoc.data();
      const hashedPassword = counterData.password;

      // Compare the input password with the hashed password
      const isPasswordCorrect = await bcrypt.compare(password, hashedPassword);

      if (isPasswordCorrect) {
        return "counter";
      }
    }
  }

  throw new Error("Invalid credentials");
};
export { db, submitDataToFirestore, signIn, auth };