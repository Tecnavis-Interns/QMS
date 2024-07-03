import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import bcrypt from "bcrypt"
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

// Function to submit data to Firestore
const submitDataToFirestore = async (collectionName, data) => {
  try {
    data.date = serverTimestamp();
    const docRef = await addDoc(collection(db, collectionName), data);
    // console.log("Data submitted successfully with ID: ", docRef.id);
    return docRef.id; // Return the generated ID
  } catch (error) {
    console.error("Error submitting data: ", error);
    throw error; // Re-throw the error to handle it at the caller level
  }
};



const signIn = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    const isAdmin = email === "admin@tecnavis.com";
    const isCounter = email.endsWith("@tecnavis.com");

    if (isAdmin) {
      return "admin";
    } else if (isCounter) {
      return "counter";
    } else {
      throw new Error("Invalid input");
    }
};

const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("Logout Successful");
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};
export { auth, db, submitDataToFirestore, signIn, signOutUser };
