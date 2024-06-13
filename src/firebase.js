import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

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
const submitDataToFirestore = async (collectionName, data) => {
  try {
    data.date = serverTimestamp();
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
  } catch (error) {
    console.error("Error submitting data: ", error);
    throw error;
  }
};

const signUp = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
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

export { auth, db, submitDataToFirestore, signUp, signIn, signOutUser };
