import { useState, useEffect } from "react";
import {
  Checkbox,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@nextui-org/react";
import Navbar from "./Navbar";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  deleteDoc,
  setDoc,
  limit,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { onAuthStateChanged } from "firebase/auth";

const CounterDash = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [userData, setUserData] = useState([]);
  // const [selectedRecords, setSelectedRecords] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [nextTokenIndex, setNextTokenIndex] = useState(null); // Initialize to null
  const [isServiceStarted, setIsServiceStarted] = useState(false); // Initialize to false
  const [nowServingToken, setNowServingToken] = useState("---");
  const [totalCustomerCount, setTotalCustomerCount] = useState(0);
  // const [singleCounterData, setSingleCounterData] = useState([]);
  // const [lastTokenNumber, setLastTokenNumber] = useState(0);
  const [requestsData, setRequestsData] = useState([]);
  const [remainingCount, setRemainingCount] = useState(0);
  // const [receivedTokenCount, setReceivedTokenCount] = useState(0);
  // const [statusTrueRequests, setStatusTrueRequests] = useState([]); // New state variable for status true requests



  useEffect(() => {
    const fetchRequestsData = async () => {
      try {
        const requestsRef = collection(db, "requests");
        const q = query(
          requestsRef, 
          where("status", "==", true), 
          orderBy("tokenNumber", "asc"));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date ? doc.data().date.toDate() : null
          }));
          
          setRequestsData(data);
          setRemainingCount(data.length);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching requests data:", error);
      }
    };
  
    fetchRequestsData();
  }, []);  // Empty dependency array means this effect runs once on mount

  const fetchRemainingCount = async () => {
    try {
      const requestsQuery = query(
        collection(db, "requests"),
        where("status", "==", true)
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      console.log("Remaining count:", requestsSnapshot.size);
      setRemainingCount(requestsSnapshot.size);
    } catch (error) {
      console.error("Error fetching remaining count:", error);
    }
  };
  useEffect(() => {
    const queueDocRef = doc(db, "queue", "queueDoc");
    
    const unsubscribe = onSnapshot(queueDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const queueData = docSnapshot.data();
        const pendingArray = queueData.pending || [];
        setPendingCount(pendingArray.length);
      } else {
        console.log("Queue document does not exist");
        setPendingCount(0);
      }
    });
  
    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const fetchCompletedCount = async () => {
      try {
        const queueDocRef = doc(db, 'queue', 'queueDoc');
        const queueDocSnap = await getDoc(queueDocRef);
        
        if (queueDocSnap.exists()) {
          const queueData = queueDocSnap.data();
          const receivedTokenArray = queueData.receivedToken || [];
          setCompletedCount(receivedTokenArray.length);
        } else {
          console.log("Queue document does not exist");
          setCompletedCount(0);
        }
      } catch (error) {
        console.error("Error fetching completed count: ", error);
        setCompletedCount(0);
      }
    };
  
    fetchCompletedCount();
  }, []);
  useEffect(() => {
    const fetchTotalCustomerCount = async () => {
      try {
        const requestsRef = collection(db, "requests");
        const querySnapshot = await getDocs(requestsRef);
        setTotalCustomerCount(querySnapshot.size);
      } catch (error) {
        console.error("Error fetching total customer count:", error);
      }
    };
  
    fetchTotalCustomerCount();
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log("Fetching initial data...");
        await fetchRemainingCount();
        
        // Fetch data from the requests collection where status is true
        const requestsQuery = query(
          collection(db, "requests"), 
          where("status", "==", true),
          orderBy("tokenNumber", "asc")
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        const requestsData = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date ? doc.data().date.toDate() : null
        }));
        
        console.log("All Requests Data: ", JSON.stringify(requestsData, null, 2));
      
        setRequestsData(requestsData);
        
        // Set the remaining count (documents with status true)
        // setRemainingCount(requestsSnapshot.size);
        setRemainingCount(requestsSnapshot.size);
        // setTotalCustomerCount(requestsSnapshot.size);
        setNowServingToken("---");
  
        // Fetch the queue data for nowServingToken
        const queueDocRef = doc(db, 'queue', 'queueDoc');
        const queueDocSnap = await getDoc(queueDocRef);
  
        if (queueDocSnap.exists()) {
          const queueData = queueDocSnap.data();
          const tokenArray = queueData.token || [];
  
          if (tokenArray.length > 0) {
            setNowServingToken('---');
            console.log("Initial now serving token:", tokenArray[0]);
          } else {
            setNowServingToken("");
            console.log("No tokens in queue");
          }
        } else {
          console.log("Queue document does not exist");
        }
  
      } catch (error) {
        console.error("Error fetching initial data: ", error);
      }
    };
  
    fetchInitialData();
  }, []);
  



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const email = auth.currentUser.email;
        const counterName = email.split("@")[0];
        const counterNumber = parseInt(counterName.replace("counter", ""));
  
        if (isNaN(counterNumber) || counterNumber < 1 || counterNumber > 5) {
          navigate("/login");
          return;
        }
  
        const fetchData = async () => {
          try {
            // Fetch data from 'single counter' collection
            const singleCounterSnapshot = await getDocs(collection(db, 'requests'));
            const data = singleCounterSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setUserData(data.filter(isValidUserData)); // Filter out invalid data
  
            // Fetch total number of customers in "single counter" collection
            setTotalCustomerCount(singleCounterSnapshot.size);
          } catch (error) {
            console.error("Error fetching data: ", error);
          }
        };
  
        fetchData();
  
        const unsubscribeSnapshot = onSnapshot(
          collection(db, `Counter ${counterNumber}`),
          snapshot => {
            const updatedData = snapshot.docs.map(doc => doc.data());
            const orderedData = updatedData.sort((a, b) => b.date - a.date);
            const reversedData = orderedData.reverse();
            setUserData(reversedData.filter(isValidUserData)); // Filter out invalid data
          }
        );
  
        return () => unsubscribeSnapshot();
      } else {
        navigate("/login");
      }
    });
  
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    fetchPendingCount();
  }, [totalCustomerCount, completedCount]);
   


  const isValidUserData = (user) => {
    return (
      user.name &&
      user.phone &&
      user.date &&
      user.service &&
      user.token
    );
  };
  
  const fetchPendingCount = async () => {
    try {
      const queueDocRef = doc(db, "queue", "queueDoc");
      const queueDocSnapshot = await getDoc(queueDocRef);
      
      if (queueDocSnapshot.exists()) {
        const queueData = queueDocSnapshot.data();
        const pendingArray = queueData.pending || [];
        setPendingCount(pendingArray.length);
      } else {
        console.log("Queue document does not exist");
        setPendingCount(0);
      }
    } catch (error) {
      console.error("Error fetching pending count: ", error);
      setPendingCount(0);
    }
  };
  

  const handlePendingButtonClick = async () => {
    try {
      if (nowServingToken === "---") {
      console.log("No token currently being served.");
      return;
    }
      // Fetch the currently serving token from the "requests" collection
      const requestsRef = collection(db, 'requests');
      const querySnapshot = await getDocs(query(requestsRef, where("tokenNumber", "==", nowServingToken)));
  
      if (!querySnapshot.empty) {
        const document = querySnapshot.docs[0];
        const tokenNumber = document.data().tokenNumber;
  
        console.log("Document found with token:", tokenNumber);
  
        // Update the pending field to true in the requests collection
        await updateDoc(doc(db, 'requests', document.id), { pending: true });
  
        // Get a reference to the queueDoc
        const queueDocRef = doc(db, 'queue', 'queueDoc');
        
        // Get the current data of queueDoc
        const queueDocSnap = await getDoc(queueDocRef);
        const queueDocData = queueDocSnap.exists() ? queueDocSnap.data() : {};
        
        // Create or update the pending array
        const currentPending = queueDocData.pending || [];
        const updatedPending = [...currentPending, tokenNumber];
        
        // Update the queueDoc with the new pending array
        await updateDoc(queueDocRef, {
          pending: updatedPending
        });
  
        console.log(`Token ${tokenNumber} marked as pending in 'requests' and added to pending array in queueDoc. Updated array:`, updatedPending);
  
        // Update the state variables
        setNowServingToken("---");
        setPendingCount(updatedPending.length);
  
        // Fetch the next token data from the "requests" collection
        const nextTokenSnapshot = await getDocs(query(requestsRef, where("pending", "==", false), where("status", "==", true), orderBy("tokenNumber", "asc"), limit(1)));
        if (!nextTokenSnapshot.empty) {
          const nextTokenData = nextTokenSnapshot.docs[0].data();
          setNowServingToken(nextTokenData.tokenNumber);
        } else {
          console.log("No more tokens to serve.");
          setNowServingToken("---");
        }
        const email = auth.currentUser.email;
          const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
          const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
          
          await updateDoc(counterDocRef, {
            nowServingToken: "-"
          });
  
          console.log(`NowServingToken cleared from counter${counterNumber}'s counterDoc`);
  
      } else {
        console.warn("No data found for the current serving token in 'requests'.");
        setNowServingToken("---");
      }
    } catch (error) {
      console.error("Error handling pending button click: ", error);
      setNowServingToken("---");
    }
  };

  useEffect(() => {
    const queueDocRef = doc(db, 'queue', 'queueDoc');
    
    const unsubscribe = onSnapshot(queueDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const queueData = docSnapshot.data();
        const receivedTokenArray = queueData.receivedToken || [];
        setCompletedCount(receivedTokenArray.length);
      } else {
        console.log("Queue document does not exist");
        setCompletedCount(0);
      }
    });
  
    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);


  // const handleRecallButtonClick = async () => {
  //   try {
  //     console.log('Starting recall process...');
  
  //     // Get a reference to the queueDoc
  //     const queueDocRef = doc(db, 'queue', 'queueDoc');
      
  //     // Fetch the current queueDoc data
  //     const queueDocSnap = await getDoc(queueDocRef);
      
  //     if (queueDocSnap.exists()) {
  //       const queueData = queueDocSnap.data();
  //       const pendingArray = queueData.pending || [];
  
  //       if (pendingArray.length > 0) {
  //         // Get the first token from the pending array
  //         const recalledToken = pendingArray[0];
  
  //         // Remove the first token from the pending array
  //         const updatedPendingArray = pendingArray.slice(1);
  
  //         // Update the queueDoc with the modified pending array
  //         await updateDoc(queueDocRef, {
  //           pending: updatedPendingArray
  //         });
  
  //         // Update the nowServingToken state
  //         setNowServingToken(recalledToken);
  
  //         // Update the pendingCount state
  //         setPendingCount(updatedPendingArray.length);
  
  //         console.log(`Token ${recalledToken} recalled successfully.`);
  
  //         // Update the status in the requests collection
  //         const requestsRef = collection(db, 'requests');
  //         const requestQuery = query(requestsRef, where('tokenNumber', '==', recalledToken));
  //         const requestSnapshot = await getDocs(requestQuery);
  
  //         if (!requestSnapshot.empty) {
  //           const requestDoc = requestSnapshot.docs[0];
  //           await updateDoc(doc(requestsRef, requestDoc.id), { pending: false });
  //           console.log(`Request with token ${recalledToken} pending status updated to false`);
  //           const email = auth.currentUser.email;
  //         const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));

  //         // Prepare and speak the voice message for recall
  //         const message = `Recalling token number ${recalledToken}, please proceed to counter ${counterNumber}`;
  //         console.log("Speaking recall message:", message);
  //         speak(message);
  //         } else {
  //           console.log(`Request with token ${recalledToken} not found in requests collection`);
  //         }
  
  //       } else {
  //         console.log("No pending tokens to recall.");
  //       }
  //     } else {
  //       console.log("Queue document does not exist");
  //     }
  //   } catch (error) {
  //     console.error("Error recalling token: ", error);
  //   }
  // };

  //new handleRecallBUttonClick for nowserving token field

  const handleRecallButtonClick = async () => {
    try {
      console.log('Starting recall process...');
  
      // Get a reference to the queueDoc
      const queueDocRef = doc(db, 'queue', 'queueDoc');
      
      // Fetch the current queueDoc data
      const queueDocSnap = await getDoc(queueDocRef);
      
      if (queueDocSnap.exists()) {
        const queueData = queueDocSnap.data();
        const pendingArray = queueData.pending || [];
  
        if (pendingArray.length > 0) {
          // Get the first token from the pending array
          const recalledToken = pendingArray[0];
  
          // Remove the first token from the pending array
          const updatedPendingArray = pendingArray.slice(1);
  
          // Update the queueDoc with the modified pending array
          await updateDoc(queueDocRef, {
            pending: updatedPendingArray
          });
  
          // Update the nowServingToken state
          setNowServingToken(recalledToken);
  
          // Update the pendingCount state
          setPendingCount(updatedPendingArray.length);
  
          console.log(`Token ${recalledToken} recalled successfully.`);
  
          // Get the counter number from the user's email
          const email = auth.currentUser.email;
          const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
  
          // Update the counterDoc with the recalled token
          const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
          await setDoc(counterDocRef, {
            nowServingToken: recalledToken,
          }, { merge: true });
  
          console.log(`Now serving token ${recalledToken} added to counter${counterNumber}'s counterDoc`);
  
          // Update the status in the requests collection
          const requestsRef = collection(db, 'requests');
          const requestQuery = query(requestsRef, where('tokenNumber', '==', recalledToken));
          const requestSnapshot = await getDocs(requestQuery);
  
          if (!requestSnapshot.empty) {
            const requestDoc = requestSnapshot.docs[0];
            await updateDoc(doc(requestsRef, requestDoc.id), { pending: false });
            console.log(`Request with token ${recalledToken} pending status updated to false`);
  
            // Prepare and speak the voice message for recall
            const message = `Recalling token number ${recalledToken}, please proceed to counter ${counterNumber}`;
            console.log("Speaking recall message:", message);
            speak(message);
          } else {
            console.log(`Request with token ${recalledToken} not found in requests collection`);
          }
  
        } else {
          console.log("No pending tokens to recall.");
        }
      } else {
        console.log("Queue document does not exist");
      }
    } catch (error) {
      console.error("Error recalling token: ", error);
    }
  };



  const handleCallButtonClick = async () => {
    const email = auth.currentUser.email;
    const counterNumber = parseInt(
      email.split("@")[0].replace("counter", "")
    );
    if (nowServingToken !== "---") {
      console.log("A token is already being served.");
      return;
    }
  
    try {
      // Fetch the queue document
      const queueDocRef = doc(db, 'queue', 'queueDoc');
      const queueDocSnap = await getDoc(queueDocRef);
  
      if (queueDocSnap.exists()) {
        const queueData = queueDocSnap.data();
        let tokenArray = queueData.token || [];
  
        if (tokenArray.length > 0) {
          // Pop the first token from the array
          const nextToken = tokenArray.shift();
          setNowServingToken(nextToken);
  
          // Update the queue document with the modified array
          await updateDoc(queueDocRef, { token: tokenArray });
  
          // Update the currently serving token in the database
          const tokenData = { token: nextToken };
          await updateCurrentlyServing(tokenData);
  
          // Update the status in the requests collection
          const requestsRef = collection(db, 'requests');
          const requestQuery = query(requestsRef, where('tokenNumber', '==', nextToken));
          const requestSnapshot = await getDocs(requestQuery);
  
          if (!requestSnapshot.empty) {
            const requestDoc = requestSnapshot.docs[0];
            await updateDoc(doc(requestsRef, requestDoc.id), { status: false });
            
            console.log(`Request with token ${nextToken} status updated to false`);

            setRequestsData(prevData => prevData.filter(item => item.tokenNumber !== nextToken));
          } else {
            console.log(`Request with token ${nextToken} not found in requests collection`);
          }
  
          const message = `Token number ${nextToken}, please proceed to counter ${counterNumber}`;
          console.log("Speaking message:", message);
          speak(message);
  
          // Store the nowServingToken to a new collection named counterNumber
          const counterCollectionRef = collection(db, `counter${counterNumber}`);
          await addDoc(counterCollectionRef, tokenData);
          console.log(`Data with token ${nextToken} stored in 'counter${counterNumber}'.`);
  
          // Update the status in the counters collection
          const countersRef = collection(db, 'counters');
          const counterQuery = query(countersRef, where('counterNumber', '==', counterNumber.toString()));
          const counterSnapshot = await getDocs(counterQuery);
  
          if (!counterSnapshot.empty) {
            const counterDoc = counterSnapshot.docs[0];
            await updateDoc(doc(countersRef, counterDoc.id), { status: 'available' });
            console.log(`Counter ${counterNumber} status updated to available`);
          } else {
            console.log(`Counter ${counterNumber} not found in counters collection`);
          }

             // Add the now serving token to the counterDoc subcollection
             const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');

             // Use setDoc with merge option
             await setDoc(counterDocRef, {
               nowServingToken: nextToken,  // or use an empty string '' if you prefer
             }, { merge: true });

          console.log(`Now serving token ${nextToken} added to counter${counterNumber}'s counterDoc`);  } else {
          console.log("No tokens in the queue");
          setNowServingToken("---");
        }
      } else {
        console.log("Queue document does not exist");
      }
    } catch (error) {
      console.error("Error calling token: ", error);
    }
  };
  
  //use new useeffiect
  useEffect(() => {
    const fetchNowServingToken = async () => {
      try {
        const email = auth.currentUser.email;
        const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      
        const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
      
        const docSnap = await getDoc(counterDocRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNowServingToken(data.nowServingToken);
        } else {
          console.log("No serving token found");
          setNowServingToken("---");
        }
      } catch (error) {
        console.error("Error fetching now serving token: ", error);
      }
    };
  
    fetchNowServingToken();
  }, [user]);

  // end of new useffect

  const speak = (message) => {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    speechSynthesis.speak(utterance);
  }


  const updateCurrentlyServing = async (tokenData) => {
    try {
      const email = auth.currentUser.email;
      const counterNumber = parseInt(
        email.split("@")[0].replace("counter", "")
      );
      const servingCollectionName = `single CurrentlyServingCounter`;

      // Get the current serving document
      const querySnapshot = await getDocs(collection(db, servingCollectionName));
      if (!querySnapshot.empty) {
        // If document exists, update it
        const docId = querySnapshot.docs[0].id;
        await setDoc(doc(collection(db, servingCollectionName), docId), tokenData);
      } else {
        // If document doesn't exist, create a new one
        await setDoc(doc(collection(db, servingCollectionName)), tokenData);
      }
      console.log("Currently serving token updated successfully.");
    } catch (error) {
      console.error("Error updating currently serving token: ", error);
    }
  };
  
  const storeNextTokenData = async (tokenData) => {
    try {
      const nextTokenCollectionName = `single nextTokenCounter`;
  
      // Reference to the next token collection
      const nextTokenCollectionRef = collection(db, nextTokenCollectionName);
  
      if (tokenData === '-' || !tokenData) {
        // If the token data is '-' or undefined, delete the document from the collection
        const querySnapshot = await getDocs(nextTokenCollectionRef);
        querySnapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      } else {
        // Otherwise, store the new token data in the database
        // Check if a document already exists in the collection
        const querySnapshot = await getDocs(nextTokenCollectionRef);
        if (!querySnapshot.empty) {
          // If a document exists, update it with the new token data
          const docId = querySnapshot.docs[0].id;
          await setDoc(doc(nextTokenCollectionRef, docId), { token: tokenData.token });
        } else {
          // If no document exists, create a new one with the token data
          await setDoc(doc(nextTokenCollectionRef), { token: tokenData.token });
        }
      }
  
      console.log("Next token data stored successfully.");
    } catch (error) {
      console.error("Error storing next token data: ", error);
    }
  };
  

  // const handleSaveButtonClick = async () => {
  //   try {
  //     if (nowServingToken && nowServingToken !== '') {
  //       const queueDocRef = doc(db, 'queue', 'queueDoc');
  //       const queueDocSnap = await getDoc(queueDocRef);
  
  //       if (queueDocSnap.exists()) {
  //         const queueData = queueDocSnap.data();
  //         const receivedTokenArray = queueData.receivedToken || [];
  
  //         receivedTokenArray.push(nowServingToken);
  
  //         await updateDoc(queueDocRef, { receivedToken: receivedTokenArray });
  
  //         // Update the state with the new completedCount immediately
  //         setCompletedCount(receivedTokenArray.length);
  
  //         // Set nowServingToken to "---" to indicate no token is being served
  //         setNowServingToken("---");
  
  //         // Call the next token
  //         await handleCallButtonClick();

  //         const email = user.email;
  //         const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
  //         const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
          
  //           // Check if the document exists
  //           const docSnap = await getDoc(counterDocRef);
  //         // Use setDoc with merge option
  //         if (docSnap.exists()) {
  //           // If the document exists, delete it
  //           await deleteDoc(counterDocRef);
          
  //           console.log(`CounterDoc for counter${counterNumber} has been deleted`);
  //         } else {
  //           console.log(`No document found for counter${counterNumber}'s counterDoc`);
  //         }
    
  //       } 
        
        
  //       else {
  //         console.warn("Queue document does not exist.");
  //       }
  //     } else {
  //       console.log("No token currently being served.");
  //     }
  //   } catch (error) {
  //     console.error("Error handling completed: ", error);
  //   }
  // };
  const handleSaveButtonClick = async () => {
    try {
      if (nowServingToken && nowServingToken !== '---') {
        const queueDocRef = doc(db, 'queue', 'queueDoc');
        const queueDocSnap = await getDoc(queueDocRef);
  
        if (queueDocSnap.exists()) {
          const queueData = queueDocSnap.data();
          const receivedTokenArray = queueData.receivedToken || [];
  
          receivedTokenArray.push(nowServingToken);
  
          await updateDoc(queueDocRef, { receivedToken: receivedTokenArray });
  
          // Update the state with the new completedCount immediately
          setCompletedCount(receivedTokenArray.length);
  
          // Set nowServingToken to "---" to indicate no token is being served
          setNowServingToken("---");
          const email = auth.currentUser.email;
          const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
          const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
          
          const docSnap = await getDoc(counterDocRef);
          if (docSnap.exists()) {
            await deleteDoc(counterDocRef);
            console.log(`CounterDoc for counter${counterNumber} has been deleted`);
          } else {
            console.log(`No document found for counter${counterNumber}'s counterDoc`);
          }
  
          // Call the next token
          await handleCallButtonClick();
        } else {
          console.warn("Queue document does not exist.");
        }
      } else {
        console.log("No token currently being served.");
      }
    } catch (error) {
      console.error("Error handling completed: ", error);
    }
  };
  
  

  // const callSpecificToken = async (specialtoken) => {
  //   try {
  //     // Set the nowServingToken state to the provided token number
  //     setNowServingToken(specialtoken);
  
  //     // Get a reference to the queue document
  //     const queueDocRef = doc(db, 'queue', 'queueDoc');
  //     const queueDocSnap = await getDoc(queueDocRef);
  
  //     if (queueDocSnap.exists()) {
  //       const queueData = queueDocSnap.data();
  //       let tokenArray = queueData.token || [];
  
  //       // Remove the special token from the token array
  //       tokenArray = tokenArray.filter(token => token !== specialtoken);
  
  //       // Update the queue document with the modified token array
  //       await updateDoc(queueDocRef, { token: tokenArray });
  
  //       console.log(`Token ${specialtoken} removed from the queue.`);
  //     }
  
  //     // Update the status of the called token in the requests collection
  //     const requestsRef = collection(db, 'requests');
  //     const q = query(requestsRef, where('tokenNumber', '==', specialtoken));
  //     const querySnapshot = await getDocs(q);
  
  //     if (!querySnapshot.empty) {
  //       const docRef = doc(requestsRef, querySnapshot.docs[0].id);
  //       await updateDoc(docRef, { status: false });
        
  //       // Remove the called token from the requestsData state
  //       setRequestsData(prevData => prevData.filter(item => item.tokenNumber !== specialtoken));
        
  //       // Update the remaining count
  //       // setRemainingCount(prevCount => prevCount - 1);
  
  //       console.log(`Token ${specialtoken} status updated to false and removed from table.`);
  
  //       // Get the counter number from the user's email
  //       const email = auth.currentUser.email;
  //       const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
  
  //       // Prepare and speak the voice message
  //       const message = `Token number ${specialtoken}, please proceed to counter ${counterNumber}`;
  //       console.log("Speaking message:", message);
  //       speak(message);
  //     } else {
  //       console.log(`Document with token ${specialtoken} not found in 'requests'.`);
  //     }
  //   } catch (error) {
  //     console.log('Error in calling specific token:', error);
  //   }
  // };

  const callSpecificToken = async (specialtoken) => {
    try {
      // Set the nowServingToken state to the provided token number
      setNowServingToken(specialtoken);
  
      // Get the counter number from the user's email
      const email = auth.currentUser.email;
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
  
      // Add the now serving token to the counterDoc
      const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
  
      // Use setDoc with merge option to update or create the document
      await setDoc(counterDocRef, {
        nowServingToken: specialtoken,
      }, { merge: true });
  
      console.log(`Now serving token ${specialtoken} added to counter${counterNumber}'s counterDoc`);
  
      // Update the status of the called token in the requests collection
      const requestsRef = collection(db, 'requests');
      const q = query(requestsRef, where('tokenNumber', '==', specialtoken));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const docRef = doc(requestsRef, querySnapshot.docs[0].id);
        await updateDoc(docRef, { status: false });
        
        // Remove the called token from the requestsData state
        setRequestsData(prevData => prevData.filter(item => item.tokenNumber !== specialtoken));
        
        console.log(`Token ${specialtoken} status updated to false and removed from table.`);
  
        // Prepare and speak the voice message
        const message = `Token number ${specialtoken}, please proceed to counter ${counterNumber}`;
        console.log("Speaking message:", message);
        speak(message);
      } else {
        console.log(`Document with token ${specialtoken} not found in 'requests'.`);
      }
  
      // Optional: Remove the token from the queue if needed
      const queueDocRef = doc(db, 'queue', 'queueDoc');
      const queueDocSnap = await getDoc(queueDocRef);
  
      if (queueDocSnap.exists()) {
        const queueData = queueDocSnap.data();
        let tokenArray = queueData.token || [];
  
        // Remove the special token from the token array
        tokenArray = tokenArray.filter(token => token !== specialtoken);
  
        // Update the queue document with the modified array
        await updateDoc(queueDocRef, { 
          token: tokenArray
        });
  
        console.log(`Token ${specialtoken} removed from the queue.`);
      }
  
    } catch (error) {
      console.log('Error in calling specific token:', error);
    }
  };


  const getCurrentDate = () => {
    const dateObj = new Date();
    const month = dateObj.toLocaleString("default", { month: "long" });
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    return `${month} ${day}, ${year}`;
  };
  
  useEffect(() => {
    const startServiceAutomatically = async () => {
      setIsServiceStarted(true); // Start the service automatically
      try {
        // Fetch and sort the "requests" collection by token number in ascending order
        const querySnapshot = await getDocs(
          query(collection(db, "requests"), orderBy("token", "asc"))
        );
  
        // Extract the sorted user data
        const sortedUserData = querySnapshot.docs.map(doc => doc.data());
        if (sortedUserData.length > 0) {
          setUserData(sortedUserData);
          const nowServingToken = sortedUserData[0].token;
          console.log(`Now serving token is ${nowServingToken}`);
        } else {
          console.log("No tokens found in requests collection.");
          return;
        }
  
        if (sortedUserData.length > nextTokenIndex || nextTokenIndex === null) {
          // Check if the previous token has been served
          if (nextTokenIndex === null || nextTokenIndex === 0 || sortedUserData[nextTokenIndex - 1].visited) {
            const newNextTokenIndex = nextTokenIndex === null ? 0 : nextTokenIndex;
            setNextTokenIndex(newNextTokenIndex + 1);
            console.log(`Next token is ${sortedUserData[newNextTokenIndex].token}`);
            
            // Update the currently serving token in the database
            const tokenData = {
              token: sortedUserData[newNextTokenIndex].token
            };
            await updateCurrentlyServing(tokenData);
            await storeNextTokenData(sortedUserData[newNextTokenIndex]);
          } else {
            console.log("Previous token has not been served yet.");
          }
        } else {
          console.log("No more tokens in queue");
        }
      } catch (error) {
        console.error("Error starting service automatically: ", error);
      }
    };
  
    startServiceAutomatically(); // Call the function to start the service automatically
  }, [isServiceStarted]);
  

  useEffect(() => {
    setCurrentDate(getCurrentDate());
  }, [user, completedCount]);
  
  

  return (
    <div className="flex">
      <div className="fixed top-0 left-0 bottom-0">
        <Navbar />
      </div>
      <div className="flex-1 ml-60">
        <div className="flex flex-1 justify-center flex-wrap lg:mx-24">
        <div>
        <div className="mb-4 mt-4 mr-24">
            <h1>Date : {currentDate} </h1>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4 mt-6 mr-4">
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h3 className="font-bold text-large">Total Customer</h3>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
              <p className="text-6xl font-bold ml-12 mt-4">{totalCustomerCount}</p>
              </CardBody>
            </Card>
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-center">
                <h3 className="font-bold text-large">Remaining</h3>
               
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                  <p className="text-6xl font-bold ml-12 mt-4">{remainingCount}</p>
              </CardBody>
            </Card>
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h3 className="font-bold text-large ">Completed</h3>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <p className="text-6xl font-bold ml-12 mt-4">{completedCount}</p>
              </CardBody>
            </Card>
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h3 className="font-bold text-large">Pending</h3>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
              <p className="text-6xl font-bold ml-12 mt-4">{pendingCount}</p>
              </CardBody>
            </Card>
          </div>
          </div>
          <div className="grid grid-cols-1 mb-4 mt-16">
          <Card className="py-4 ml-4 w-[200px]">
            <CardHeader className="pb-0 pt-2 px-4 flex-col items-center">
              <h3 className="font-bold text-large mb-2">Now Serving</h3>
              <p className="text-6xl font-bold mt-4">{nowServingToken === "---" ? "---" : nowServingToken || "---"}</p>
            </CardHeader>
            <CardBody className="overflow-visible py-2">
              <div className="flex flex-col items-center justify-end h-full">
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={handleSaveButtonClick}
                    disabled={!nowServingToken}
                    className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3 w-32"
                  >
                    Completed
                  </Button>
                </div>
                <div className="flex justify-end mb-0">
                  <Button
                    onClick={handlePendingButtonClick}
                    disabled={!nowServingToken}
                    className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3 w-32"
                  >
                    Pending
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
          </div>
          <div className="mb-2 mt-12 ml-14">
            <div className="flex justify-end mb-2">
              <Button onClick={handleCallButtonClick}
                disabled={nowServingToken !== "---"}
                className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-32 mt-8">
                Call
              </Button>
            </div>
            <div className="flex justify-end mb-2">
              <Button onClick={handleRecallButtonClick}
                disabled={nowServingToken !== "---"}
                className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-32 mt-8">
                Recall
              </Button>
            </div>
            {/* <div className="flex justify-end mb-2">
              <Button onClick={handleResetButtonClick} className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-32 mt-8">
                Reset Token
              </Button>
            </div> */}
          </div>

          <div className="flex flex-col items-center justify-center p-10 py-5 gap-10 w-full">
          <Table aria-label="Example static collection table" removeWrapper>
    <TableHeader>
      <TableColumn>Token</TableColumn>
      <TableColumn>Name</TableColumn>
      <TableColumn>Date</TableColumn>
      <TableColumn>Service</TableColumn>
      <TableColumn></TableColumn>
    </TableHeader>
    <TableBody>
      {requestsData.map(request => (
        <TableRow key={request.id}>
          <TableCell>{request.tokenNumber}</TableCell>
          <TableCell>{request.name}</TableCell>
          <TableCell>
            {request.date instanceof Date ? 
              request.date.toLocaleString() : 
              (request.date ? new Date(request.date).toLocaleString() : "")}
          </TableCell>
          <TableCell>{request.service}</TableCell>
          <TableCell>
            <Button
              onClick={() => callSpecificToken(request.tokenNumber)}
              disabled={nowServingToken !== "---"}
              className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3"
            >
              Call Now
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterDash;