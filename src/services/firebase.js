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
  apiKey: "AIzaSyB7GhJxfZ_ULBlH-GQ1TB0GZhaYcTJaJAM",
  authDomain: "qms-singlequeue.firebaseapp.com",
  projectId: "qms-singlequeue",
  storageBucket: "qms-singlequeue.appspot.com",
  messagingSenderId: "760173523661",
  appId: "1:760173523661:web:eb385f0aad121fe1442f84",
  measurementId: "G-0H3LNT8C16"
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