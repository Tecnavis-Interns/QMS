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
  apiKey: "AIzaSyAlDyDm8lmGzm741WtcZ9gJIdhlym5LkeU",
  authDomain: "qms-project-27a3c.firebaseapp.com",
  projectId: "qms-project-27a3c",
  storageBucket: "qms-project-27a3c.appspot.com",
  messagingSenderId: "986396859546",
  appId: "1:986396859546:web:7f5ae033f09a6cbb2b5323",
  measurementId: "G-ESCP4WYSLZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Function to submit data to Firestore
const submitDataToFirestore = async (data) => {
  try {
    data.date = serverTimestamp();
    const docRef = await addDoc(collection(db, "requests"), data);
    console.log("Data submitted successfully with ID: ", docRef.id);
    alert("Service request submitted successfully!");
  } catch (error) {
    console.error("Error submitting data: ", error);
  }
};

const signIn = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    const isAdmin =
      email === "admin@tecnavis.com";
    const isCounter1 =
      email === "counter1@tecnavis.com";
    const isCounter2 =
      email === "counter2@tecnavis.com";
    const isCounter3 =
      email === "counter3@tecnavis.com";

    if (isAdmin) {
      return isAdmin;
    } else if (isCounter1) {
      return isCounter1;
    } else if (isCounter2) {
      return isCounter2;
    } else if (isCounter3) {
      return isCounter3;
    }
    // If login is successful, no need to return anything as Firebase handles the login internally
    console.log("Login Successful");
  } catch (error) {
    throw error;
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
