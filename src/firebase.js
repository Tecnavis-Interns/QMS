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
  apiKey: "AIzaSyCBtstvUk4S8OpRH1LFfp3vVhgPHK_0nZc",
  authDomain: "single-queue-qms.firebaseapp.com",
  projectId: "single-queue-qms",
  storageBucket: "single-queue-qms.appspot.com",
  messagingSenderId: "1093945224747",
  appId: "1:1093945224747:web:ce10f71277d5af4bce046e",
  measurementId: "G-PKKDP6B4FR"
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
