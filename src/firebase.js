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
// import bcrypt from "bcrypt"
// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3ta9d93DcBl5asAkZimrTuhBIjnGD8Ho",
  authDomain: "single-queue-85203.firebaseapp.com",
  projectId: "single-queue-85203",
  storageBucket: "single-queue-85203.appspot.com",
  messagingSenderId: "120848826113",
  appId: "1:120848826113:web:c982f6cca04ddef2af2500",
  measurementId: "G-HX7L0ENMD7"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
