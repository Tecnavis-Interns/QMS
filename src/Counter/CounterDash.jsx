import { useState, useEffect, useContext, useCallback } from "react";
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
  arrayUnion,
  increment,
  runTransaction 
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";

import { AuthContext } from "../Context/AuthContext";
import { serverTimestamp } from "firebase/firestore";

const CounterDash = () => {
  const navigate = useNavigate();
  //const auth = getAuth();
  const { email, completedCount, updateCompletedCount } = useContext(AuthContext);


  const [userData, setUserData] = useState([]);
  // const [selectedRecords, setSelectedRecords] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [completedCounts, setCompletedCounts] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [nextTokenIndex, setNextTokenIndex] = useState(null); // Initialize to null
  const [isServiceStarted, setIsServiceStarted] = useState(false); // Initialize to false
  const [nowServingToken, setNowServingToken] = useState("---");
  const [totalCustomerCount, setTotalCustomerCount] = useState(0);
  const [counterName, setCounterName] = useState("");
  const [requestsData, setRequestsData] = useState([]);
  const [remainingCount, setRemainingCount] = useState(0);

  useEffect(() => {
    const checkAuth = () => {
      const userData = JSON.parse(localStorage.getItem('currentUser'));
      if (userData && userData.role === 'counter') {
        console.log('Counter authenticated:', userData.email);
        // setLoading(false);
        // Proceed with loading counter data
      } else {
        console.log('Not authenticated as counter, redirecting to login');
        navigate('/login');
      }
    };

    setTimeout(checkAuth, 500);
  }, [navigate]);

  useEffect(() => {
    const fetchRequestsData = async () => {
      try {
        const requestsRef = collection(db, "requests");
        const q = query(requestsRef, orderBy("tokenNumber", "asc"));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date ? doc.data().date.toDate() : null
          }));
          
          // Filter the data to include only tokens that are either active or pending
          const filteredData = data.filter(item => item.status === true || item.pending === true);
          
          console.log("Filtered data:", filteredData); // For debugging
          
          setRequestsData(filteredData);
          setRemainingCount(filteredData.length);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching requests data:", error);
      }
    };
  
    fetchRequestsData();
  }, []);

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
    if (!email) return;
    console.log('++++++++++++++++++++++++',email);
    // Create a query reference
    const countersCollection = collection(db, 'counters');
    const q = query(countersCollection, where('email', '==', email));
    
    // Set up the onSnapshot listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach((docSnapshot) => {
        if (docSnapshot.exists()) {
          const counterData = docSnapshot.data();
          console.log('----------------',counterData);
          updateCompletedCount(counterData.completed || 0);
          console.log('jefpq2roiwu',completedCount);
        }
      });
    });

    return () => unsubscribe();
  }, [email, updateCompletedCount]);

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
            setNowServingToken("---");
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
  
  const fetchCounterName = async () => {
    try {
      const countersRef = collection(db, 'counters');
      const q = query(countersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const counterData = querySnapshot.docs[0].data();
        setCounterName(counterData.counterName || "");
      } else {
        console.log("Counter not found in counters collection");
        setCounterName("");
      }
    } catch (error) {
      console.error("Error fetching counter name: ", error);
      setCounterName("");
    }
  };

  useEffect(() => {
    fetchCounterName();
  }, [email]);


  useEffect(() => {

    const userData = localStorage.getItem("currentUser")
    const json = JSON.parse (userData)
    const email = json["email"]
    
    if (email) {
      console.log('User is authenticated');
      // Use the email from the authenticated user object
      const userEmail = email;
      console.log('User email:', userEmail);

      const counterName = userEmail.split("@")[0];
      const counterNumber = parseInt(counterName.replace("counter", ""));
      console.log('Counter number:', counterNumber);

      if (isNaN(counterNumber) || counterNumber < 1 || counterNumber > 20) {
        console.log('Invalid counter number, redirecting to login');
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
            setUserData(data); // Filter out invalid data
  
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
            setUserData(reversedData); // Filter out invalid data
          }
        );
  
        return () => unsubscribeSnapshot();
      } else {
        navigate("/login");
      }
   
  
    
  }, [navigate]);

  useEffect(() => {
    fetchPendingCount();
  }, [totalCustomerCount, completedCount]);
   


  // const isValidUserData = (user) => {
  //   return (
  //     user.name &&
  //     user.phone &&
  //     user.date &&
  //     user.service &&
  //     user.token
  //   );
  // };
  
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
  
        // Update the pending field to true and status to true in the requests collection
        await updateDoc(doc(db, 'requests', document.id), { pending: true, status: true });
  
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
  
        // Clear the nowServingToken from the counter's document
        // const email = auth.currentUser.email;
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

  
  


  const handleRecallButtonClick = () => {
    if (nowServingToken === "---") {
      console.log("No token currently being served.");
      return;
    }
    console.log('hi');
    // const email = auth.currentUser.email;
    const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
  
    // Prepare and speak the voice message for recall
    const message = `Recalling token number ${nowServingToken}, please proceed to counter ${counterNumber}`;
    console.log("Speaking recall message:", message);
    speak(message);
  };


  const handleNextButtonClick = async () => {
    // const email = auth.currentUser.email;
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
  

  // const fetchNowServingToken = async () => {
  //   try {
  //     if (!auth.currentUser) {
  //       console.log("User not authenticated yet");
  //       return;
  //     }
  
  //     // const email = auth.currentUser.email;
  
  //     const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
    
  //     const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
    
  //     const docSnap = await getDoc(counterDocRef);
      
  //     if (docSnap.exists()) {
  //       const data = docSnap.data();
  //       setNowServingToken(data.nowServingToken);
  //     } else {
  //       console.log("No serving token found");
  //       setNowServingToken("---");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching now serving token: ", error);
  //   }
  // };
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     if (user) {
  //       fetchNowServingToken();
  //     } else {
  //       setNowServingToken("---");
  //     }
  //   });
  
  //   return () => unsubscribe();
  // }, []);


  const speak = (message) => {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    speechSynthesis.speak(utterance);
  }


  const updateCurrentlyServing = async (tokenData) => {
    try {
      // const email = auth.currentUser.email;
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
  

  const handleSaveButtonClick = useCallback(async () => {
    if (!nowServingToken || nowServingToken === '---') {
      console.log("No token currently being served.");
      return;
    }
  
    try {
      // const email = auth.currentUser.email;
      const counterNumber = email.split("@")[0].replace("counter", "");
      const completedTokensRef = doc(db, `counter${counterNumber}`, 'CompletedTokens');
  
      // Fetch the current token's details from the requests collection
      const requestsRef = collection(db, 'requests');
      const q = query(requestsRef, where('tokenNumber', '==', nowServingToken));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        console.log(`No details found for token ${nowServingToken}`);
        return;
      }
  
      const tokenDetails = querySnapshot.docs[0].data();
  
      // Create a history entry
      const historyEntry = {
        token: nowServingToken,
        name: tokenDetails.name,
        service: tokenDetails.service,
        completedAt: new Date().toISOString(),
      };
  
      // Update the CompletedTokens document
      await updateDoc(completedTokensRef, {
        tokens: arrayUnion(nowServingToken),
        history: arrayUnion(historyEntry)
      });
  
      console.log(`Token ${nowServingToken} added to CompletedTokens and history for counter${counterNumber}`);
  
      // Update the queueDoc
      const queueDocRef = doc(db, 'queue', 'queueDoc');
      await updateDoc(queueDocRef, {
        receivedToken: arrayUnion(nowServingToken)
      });
  
      console.log(`Token ${nowServingToken} added to receivedToken array in queueDoc`);
  
      // Use a transaction to ensure atomic increment
      const countersRef = collection(db, 'counters');
      const counterQuery = query(countersRef, where('email', '==', email));
      const counterSnapshot = await getDocs(counterQuery);
  
      if (!counterSnapshot.empty) {
        const counterDoc = counterSnapshot.docs[0];
        const counterDocRef = doc(countersRef, counterDoc.id);
        
        await runTransaction(db, async (transaction) => {
          console.log('------------------------------');
          const counterDocSnapshot = await transaction.get(counterDocRef);
          console.log('++++++++++++++++++++');
          if (!counterDocSnapshot.exists()) {
            throw "Counter document does not exist!";
          }
          console.log('12345');
          const newCompletedCount = (counterDocSnapshot.data().completed || 0) + 1;
          transaction.update(counterDocRef, { completed: newCompletedCount });
  
          console.log(`Completed count incremented for counter ${counterNumber}: ${newCompletedCount}`);
  
          // Update the context with the new completed count
          setCompletedCounts(newCompletedCount);
          updateCompletedCount(newCompletedCount);
        });
  
      } else {
        console.log(`Counter ${counterNumber} not found in counters collection`);
      }
  
      setNowServingToken("---");
  
      const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
      await updateDoc(counterDocRef, {
        nowServingToken: "-"
      });
  
      await handleNextButtonClick();
    } catch (error) {
      console.error("Error handling completed: ", error);
    }
  }, [nowServingToken, updateCompletedCount, handleNextButtonClick]);
  


  const recallSpecificToken = async (specialtoken) => {
    try {
      // Set the nowServingToken state to the provided token number
      setNowServingToken(specialtoken);
  
      // Get the counter number from the user's email
      // const email = auth.currentUser.email;
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
        await updateDoc(docRef, { status: false, pending: false });
        
        // Update the requestsData state
        setRequestsData(prevData => prevData.map(item => 
          item.tokenNumber === specialtoken ? {...item, pending: false} : item
        ));
        
        console.log(`Token ${specialtoken} status updated to active and pending set to false.`);
  
        // Prepare and speak the voice message
        const message = `Recalling Token number ${specialtoken}, please proceed to counter ${counterNumber}`;
        console.log("Speaking message:", message);
        speak(message);
      } else {
        console.log(`Document with token ${specialtoken} not found in 'requests'.`);
      }
  
      // Remove the token from the pending array in queueDoc
      const queueDocRef = doc(db, 'queue', 'queueDoc');
      const queueDocSnap = await getDoc(queueDocRef);
  
      if (queueDocSnap.exists()) {
        const queueData = queueDocSnap.data();
        let pendingArray = queueData.pending || [];
  
        // Remove the special token from the pending array
        pendingArray = pendingArray.filter(token => token !== specialtoken);
  
        // Update the queue document with the modified pending array
        await updateDoc(queueDocRef, { 
          pending: pendingArray
        });
  
        console.log(`Token ${specialtoken} removed from the pending array in queueDoc.`);
  
        // Update the pendingCount state
        setPendingCount(pendingArray.length);
      }
  
    } catch (error) {
      console.log('Error in recalling specific token:', error);
    }
  };

  const callSpecificToken = async (specialtoken) => {
    try {
      // Set the nowServingToken state to the provided token number
      setNowServingToken(specialtoken);
  
      // Get the counter number from the user's email
      // const email = auth.currentUser.email;
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
  }, [completedCount]);
  
  

  return (
    <div className="flex">
      <div className="fixed top-0 left-0 bottom-0">
        <Navbar />
      </div>
      <div className="flex-1 ml-60">
        <div className="flex flex-1 justify-center flex-wrap lg:mx-24">
        <div>
        <div className="mb-4 mt-4 mr-24">
          <h1 className="font-semibold">{counterName}</h1>
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
          <Card className="py-4 ml-4 w-[200px] mt-6">
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
              <Button onClick={handleNextButtonClick}
                disabled={nowServingToken !== "---"}
                className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-32 mt-8">
                Next
              </Button>
            </div>
            <div className="flex justify-end mb-2">
              <Button onClick={handleRecallButtonClick}
                disabled={!nowServingToken}
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
      <TableColumn>Status</TableColumn>
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
            <h1 className={`text-xs font-medium me-2 pr-2 px-2.5 pl-4 py-0.5 rounded ${
              request.pending 
              ? 'bg-orange-400 text-orange-900 dark:bg-orange-900 dark:text-orange-700'
              : 'bg-green-300 text-green-900 dark:bg-green-900 dark:text-green-700'
              }`}>
              {request.pending ? 'Pending' : 'Active'}
            </h1>
          </TableCell>
          <TableCell>
          {request.pending ? (
            <Button
              onClick={() => recallSpecificToken(request.tokenNumber)}
              disabled={nowServingToken !== "---"}
              className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3"
            >
              Call Now
            </Button>
          ) : (
            <Button
              onClick={() => callSpecificToken(request.tokenNumber)}
              disabled={nowServingToken !== "---"}
              className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3"
            >
              Call Now
            </Button>
          )}
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