import { useState, useEffect, useCallback, useRef, useContext } from "react";
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
import { db, auth } from "../../services/firebase";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { AuthContext } from "../../Context/AuthContext";
import { serverTimestamp } from "firebase/firestore";
import { Tooltip } from "@nextui-org/react";
import toast, { Toaster } from 'react-hot-toast';



const CounterDash = () => {
  const navigate = useNavigate();
  const { email, completedCount, updateCompletedCount } = useContext(AuthContext);
  const transferButtonRef = useRef(null);
 
  


  const [userData, setUserData] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [completedCounts, setCompletedCounts] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [nowServingToken, setNowServingToken] = useState("---");
  const [totalCustomerCount, setTotalCustomerCount] = useState(0);
  const [counterName, setCounterName] = useState("");
  const [requestsData, setRequestsData] = useState([]);
  const [remainingCount, setRemainingCount] = useState(0);
  const [currentTokenStartTime, setCurrentTokenStartTime] = useState(null);
  const [availableCounters, setAvailableCounters] = useState([]);
  const [isTransferDropdownOpen, setIsTransferDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [transferredTokens, setTransferredTokens] = useState([]);
  const [isTransferDropdownOpenMap, setIsTransferDropdownOpenMap] = useState({});
  const transferButtonRefs = useRef({});

  useEffect(() => {
    const checkAuth = async () => {
      const userData = JSON.parse(localStorage.getItem('currentUser'));
      if (userData && userData.role === 'counter') {
        console.log('Counter authenticated:', userData.email);
        // setLoading(false);
        // Proceed with loading counter data
        const counterEmail = userData.email;
        const countersCollectionRef = collection(db, 'counters');
        const q = query(countersCollectionRef, where("email", "==", counterEmail));

        try {
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const counterDoc = querySnapshot.docs[0];
            const counterDocRef = doc(db, 'counters', counterDoc.id);
            await updateDoc(counterDocRef, { active: true });
            console.log(`Counter ${counterEmail} is now active`);
          } else {
            console.log('Counter document not found');
          }
        } catch (error) {
          console.error("Error setting counter as active:", error);
        }
      } else {
        console.log('Not authenticated as counter, redirecting to login');
        navigate('/login');
      }
    };

    setTimeout(checkAuth, 500);
  }, [navigate]);

  const getCounterNumber = (email) => {
    if(email){
    return parseInt(email.split("@")[0].replace("counter", ""));
    }
  };

  useEffect(() => {
    if(email){
    const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
    const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');

    const unsubscribe = onSnapshot(counterDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const counterData = docSnapshot.data();
        const receivedTokens = counterData.receivedTokens || [];
        setTransferredTokens(receivedTokens);
      } else {
        console.log("No transferred tokens found");
        setTransferredTokens([]);
      }
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }
  }, [email]);

  useEffect(() => {
    const fetchRequestsData = async () => {
      try {
        const requestsRef = collection(db, "requests");
        const q = query(requestsRef, orderBy("createdAt", "asc"));
        
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date ? doc.data().date.toDate() : null
          }));
          
          // Filter the data to include only tokens that are either active or pending
          const filteredData = data.filter(item => item.status === true || item.pending === true);
          
          console.log("Filtered data:", filteredData); // For debugging
          
          setRequestsData(filteredData);
          const counterNumber = getCounterNumber(email);
          const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
          const counterDocSnap = await getDoc(counterDocRef);
          
          let receivedTokensCount = 0;
          if (counterDocSnap.exists()) {
            const receivedTokens = counterDocSnap.data().receivedTokens || [];
            receivedTokensCount = receivedTokens.length;
          }

          await fetchRemainingCount();
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching requests data:", error);
      }
    };
  
    fetchRequestsData();
  }, []);

  const fetchTransferredTokens = useCallback(async () => {
    try {
      if(email){
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
      const counterDocSnap = await getDoc(counterDocRef);
  
      if (counterDocSnap.exists()) {
        const counterData = counterDocSnap.data();
        const receivedTokens = counterData.receivedTokens || [];
        setTransferredTokens(receivedTokens);
      } else {
        console.log("No transferred tokens found");
        setTransferredTokens([]);
      }
    }
    } catch (error) {
      console.error("Error fetching transferred tokens: ", error);
    }
  }, [email, db]);

  useEffect(() => {
    fetchTransferredTokens();
  }, [fetchTransferredTokens]);

  const fetchRemainingCount = async () => {
    try {
      const requestsQuery = query(
        collection(db, "requests"),
        where("status", "==", true)
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      let activeCount = requestsSnapshot.size;
      const counterNumber = getCounterNumber(email);
      const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
      const counterDocSnap = await getDoc(counterDocRef);
      
      let receivedTokensCount = 0;
      if (counterDocSnap.exists()) {
        const receivedTokens = counterDocSnap.data().receivedTokens || [];
        receivedTokensCount = receivedTokens.length;
      }
  
      const totalRemainingCount = activeCount + receivedTokensCount;
      console.log("Remaining count:", totalRemainingCount);
      console.log("Received count:", receivedTokensCount);
      setRemainingCount(totalRemainingCount);
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
          console.log('completed',completedCount);
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
    const fetchNowServingToken = async () => {
      if (email) {
        const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
        const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
        
        try {
          const counterDocSnap = await getDoc(counterDocRef);
          if (counterDocSnap.exists()) {
            const counterData = counterDocSnap.data();
            const currentToken = counterData.nowServingToken;
            if (currentToken && currentToken !== "-") {
              setNowServingToken(currentToken);
              setCurrentTokenStartTime(new Date()); // Assuming the start time is now
            } else {
              setNowServingToken("---");
            }
          }
        } catch (error) {
          console.error("Error fetching now serving token:", error);
        }
      }
    };
  
    fetchNowServingToken();
  }, [email]);


  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log("Fetching initial data...");
        await fetchRemainingCount();
        
        // Fetch data from the requests collection where status is true
        const requestsQuery = query(
          collection(db, "requests"), 
          where("status", "==", true),
          orderBy("createdAt", "asc")
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        const requestsData = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date ? doc.data().date.toDate() : null
        }));
        
        console.log("All Requests Data: ", JSON.stringify(requestsData, null, 2));
      
        setRequestsData(requestsData);
        const counterNumber = getCounterNumber(email);
        const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
        const counterDocSnap = await getDoc(counterDocRef);
        
        let receivedTokensCount = 0;
        if (counterDocSnap.exists()) {
          const receivedTokens = counterDocSnap.data().receivedTokens || [];
          receivedTokensCount = receivedTokens.length;
        }

        console.log('Received Tokens Count:', receivedTokensCount);

        // Set the remaining count (documents with status true + receivedTokens)
        const totalRemainingCount = requestsSnapshot.size + receivedTokensCount;
        setRemainingCount(totalRemainingCount);
        console.log("Total Remaining Count:", totalRemainingCount);
    
          // Fetch the queue data for nowServingToken
          const queueDocRef = doc(db, 'queue', 'queueDoc');
          const queueDocSnap = await getDoc(queueDocRef);
    
          if (queueDocSnap.exists()) {
            const queueData = queueDocSnap.data();
            const tokenArray = queueData.token || [];
    
            if (tokenArray.length > 0) {
              console.log("Tokens in queue:", tokenArray);
            } else {
              // setNowServingToken("---");
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

        const currentNowPending = queueDocData.nowPending || [];
        const updatedNowPending = [...currentNowPending, tokenNumber];
        await updateDoc(queueDocRef, {
          nowPending: updatedNowPending
        });
  
        console.log(`Token ${tokenNumber} marked as pending in 'requests' and added to pending array in queueDoc. Updated array:`, updatedPending);
  
        // Update the state variables
        setNowServingToken("---");
        setPendingCount(updatedPending.length);
  
        // Clear the nowServingToken from the counter's document
        // const email = auth.currentUser.email;
        const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
        const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');

        const counterDocSnap = await getDoc(counterDocRef);
        const counterDocData = counterDocSnap.exists() ? counterDocSnap.data() : {};

        const currentPriority = counterDocData.priority || [];
        const updatedPriority = currentPriority.filter(token => token !== tokenNumber);
        
        await updateDoc(counterDocRef, {
          priority: updatedPriority,
          nowServingToken: "-"
        });
  
        console.log(`NowServingToken cleared from counter${counterNumber}'s counterDoc`);
        setCurrentTokenStartTime(null);
  
      } else {
        console.warn("No data found for the current serving token in 'requests'.");
        setNowServingToken("---");
      }
    toast.success(`Token has been marked as pending`);
    } catch (error) {
      console.error("Error handling pending button click: ", error);
      setNowServingToken("---");
      // Show error toast
      toast.error('Error setting token to pending');
    }
  };

  


  const handleRecallButtonClick = () => {
    console.log("Recall button clicked");
    if (nowServingToken === "---") {
      console.log("No token currently being served.");
      return;
    }
    console.log('Current nowServingToken:', nowServingToken);
    console.log('Current email:', email);
    const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
    console.log('Calculated counterNumber:', counterNumber);
  };




  const handleNextButtonClick = async () => {
    const counterNumber = parseInt(
      email.split("@")[0].replace("counter", "")
    );
  
    try {
      // If there's a token currently being served, mark it as completed first
      if (nowServingToken !== "---") {
        // Complete the current token
        await handleSaveButtonClick();
      }
  
      // Now proceed with calling the next token
      const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
      let counterDocSnap = await getDoc(counterDocRef);

      if (!counterDocSnap.exists()) {
        await setDoc(counterDocRef, {
          priority: [],
          receivedTokens: [],
          nowServingToken: "---"
        });
        counterDocSnap = await getDoc(counterDocRef); // Fetch the newly created document
      }
  
      if (counterDocSnap.exists()) {
        const counterData = counterDocSnap.data();
        let priorityArray = counterData.priority || [];
        let receivedTokensArray = counterData.receivedTokens || [];
  
        if (priorityArray.length > 0) {
          // Pop the first token from the priority array
          const nextPriorityToken = priorityArray.shift();
          setNowServingToken(nextPriorityToken);
          await updateDoc(counterDocRef, {
            nowServingToken: nextPriorityToken
          });
          console.log("Before Filter:", receivedTokensArray);
          receivedTokensArray = receivedTokensArray.filter(t => t.token !== nextPriorityToken);
          console.log("After Filter:", receivedTokensArray);

  
          // Update the counter document with the modified priority array
          await updateDoc(counterDocRef, { 
            priority: priorityArray,
            receivedTokens: receivedTokensArray 
          });
          
  
          // Update the currently serving token in the database
          setCurrentTokenStartTime(new Date());
  
          // Update the status in the requests collection
          const requestsRef = collection(db, 'requests');
          const requestQuery = query(requestsRef, where('tokenNumber', '==', nextPriorityToken));
          const requestSnapshot = await getDocs(requestQuery);
  
          if (!requestSnapshot.empty) {
            const requestDoc = requestSnapshot.docs[0];
            await updateDoc(doc(requestsRef, requestDoc.id), { status: false });
  
            setRequestsData(prevData => prevData.filter(item => item.tokenNumber !== nextPriorityToken));
          }
          await fetchRemainingCount();
  
          const newMessage = `Token number ${nextPriorityToken}, please proceed to counter ${counterNumber}`;
          console.log("Speaking message:", newMessage);
          // playSound(newMessage);
        } else {
          // Fetch the queue document if there are no priority tokens
          const queueDocRef = doc(db, 'queue', 'queueDoc');
          const queueDocSnap = await getDoc(queueDocRef);
  
          if (queueDocSnap.exists()) {
            const queueData = queueDocSnap.data();
            let tokenArray = queueData.token || [];
  
            if (tokenArray.length > 0) {
              // Pop the first token from the array
              const nextToken = tokenArray.shift();
              setNowServingToken(nextToken);
              await updateDoc(counterDocRef, {
                nowServingToken: nextToken
              });
  
              // Update the queue document with the modified array
              await updateDoc(queueDocRef, { token: tokenArray });
  
              // Update the currently serving token in the database
              setCurrentTokenStartTime(new Date());
  
              // Update the status in the requests collection
              const requestsRef = collection(db, 'requests');
              const requestQuery = query(requestsRef, where('tokenNumber', '==', nextToken));
              const requestSnapshot = await getDocs(requestQuery);
  
              if (!requestSnapshot.empty) {
                const requestDoc = requestSnapshot.docs[0];
                await updateDoc(doc(requestsRef, requestDoc.id), { status: false });
  
                setRequestsData(prevData => prevData.filter(item => item.tokenNumber !== nextToken));
              }
  
              const newMessage = `Token number ${nextToken}, please proceed to counter ${counterNumber}`;
              console.log("Speaking message:", newMessage);
              // playSound(newMessage);
              await fetchRemainingCount();
            } else {
              console.log("No tokens in the queue");
              if (nowServingToken === "---") {
                toast.error("Check for Pending/Transferred and press Call Now");
              }
              setNowServingToken("---");
            }
          } else {
            console.log("Queue document does not exist");
          }
        }
      } else {
        console.log(`Counter ${counterNumber} document does not exist`);
      }
    } catch (error) {
      console.error("Error calling token: ", error);
    }
  };
  

  
  
  const formatTime = (time) => {
    if (!time || time === '00:00:00') {
      return '0';  // Return '0' for null, undefined, or '00:00:00'
    }
  
    let hours, minutes, seconds;
  
    if (typeof time === 'string') {
      [hours, minutes, seconds] = time.split(':').map(Number);
    } else if (typeof time === 'number') {
      // Assuming time is in milliseconds
      seconds = Math.floor(time / 1000);
      minutes = Math.floor(seconds / 60);
      hours = Math.floor(minutes / 60);
      seconds %= 60;
      minutes %= 60;
    } else {
      return '0';  // Return '0' for invalid input types
    }
  
    let result = '';
    
    if (hours > 0) {
      result += `${hours}h `;
    }
    if (minutes > 0 || hours > 0) {
      result += `${minutes.toString().padStart(2, '0')}m `;
    }
    result += `${seconds.toString().padStart(2, '0')}s`;
    
    return result.trim();
  };
  

  const handleSaveButtonClick = useCallback(async () => {
    if (!nowServingToken || nowServingToken === '---') {
      console.log("No token currently being served.");
      return;
    }
  
    try {
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const completedTokensRef = doc(db, `counter${counterNumber}`, 'CompletedTokens');
  
      // Fetch the current token's details from the requests collection
      const requestsRef = collection(db, 'requests');
      const q = query(requestsRef, where('tokenNumber', '==', nowServingToken));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        console.log(`No details found for token ${nowServingToken}`);
        return;
      }
  
      const requestDoc = querySnapshot.docs[0];
      const tokenDetails = requestDoc.data();
       
      const endTime = new Date();
      const serviceTimeMs = currentTokenStartTime ? endTime - currentTokenStartTime : 0;
  
      // Calculate waiting time
      const createdAt = tokenDetails.createdAt.toDate();
      const completedAt = endTime;
      const waitingTimeMs = completedAt - createdAt;

      const serviceTimeFormatted = formatTime(serviceTimeMs);
      const waitingTimeFormatted = formatTime(waitingTimeMs);

      // Create a history entry
      const historyEntry = {
        token: nowServingToken,
        name: tokenDetails.name,
        service: tokenDetails.service,
        completedAt: endTime.toISOString(),
        serviceTime: serviceTimeFormatted,
        waitingTime: waitingTimeFormatted
      };
  
      // Check if the CompletedTokens document exists
      const docSnap = await getDoc(completedTokensRef);
  
      if (docSnap.exists()) {
        // Document exists, update it
        await updateDoc(completedTokensRef, {
          tokens: arrayUnion(nowServingToken),
          history: arrayUnion(historyEntry)
        });
      } else {
        // Document doesn't exist, create it
        await setDoc(completedTokensRef, {
          tokens: [nowServingToken],
          history: [historyEntry]
        });
      }
  
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
          const counterDocSnapshot = await transaction.get(counterDocRef);
          if (!counterDocSnapshot.exists()) {
            throw "Counter document does not exist!";
          }
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
  
      // Update the waiting time and service time in the requests collection
      await updateDoc(requestDoc.ref, {
        waitingTime: waitingTimeFormatted,
        serviceTime: serviceTimeFormatted
      });
  
      // Update the waiting time and service time in the ChartData collection
      const chartDataRef = collection(db, 'ChartData');
      const chartDataQuery = query(chartDataRef, where('tokenNumber', '==', nowServingToken));
      const chartDataSnapshot = await getDocs(chartDataQuery);
      if (!chartDataSnapshot.empty) {
        const chartDataDoc = chartDataSnapshot.docs[0];
        await updateDoc(chartDataDoc.ref, {
          waitingTime: waitingTimeFormatted,
          serviceTime: serviceTimeFormatted
        });
      }
  
      console.log(`Waiting time for token ${nowServingToken}: ${waitingTimeFormatted}`);
      console.log(`Service time for token ${nowServingToken}: ${serviceTimeFormatted}`);
  
      setNowServingToken("---");
  
      const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
      await updateDoc(counterDocRef, {
        nowServingToken: "-"
      });
      setCurrentTokenStartTime(null);
  
      // Update the transfer field if necessary
      if (tokenDetails.transfer) {
        await updateDoc(requestDoc.ref, { transfer: false });
        console.log(`Transfer field set to false for token ${nowServingToken}`);
      }
      // Show the success toast
      toast.success('Completed Successfully');
  
    } catch (error) {
      console.error("Error handling completed: ", error);
      // Add more detailed error logging
      if (error.code) {
        console.error("Error code:", error.code);
      }
      if (error.message) {
        console.error("Error message:", error.message);
      }
      // Show error toast
      toast.error('Error completing token');
    }
  }, [nowServingToken, updateCompletedCount, email, currentTokenStartTime, db]);
  

  const recallSpecificToken = async (specialtoken) => {
    try {
      // Set the nowServingToken state to the provided token number
      setNowServingToken(specialtoken);
      setCurrentTokenStartTime(new Date());
  
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
        const newMessage = `Recalling Token number ${specialtoken}, please proceed to counter ${counterNumber}`;
        console.log("Speaking message:", newMessage);
        // playSound(newMessage);
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

  useEffect(() => {
    const fetchAvailableCounters = async () => {
      try {
        const countersRef = collection(db, 'counters');
        const querySnapshot = await getDocs(countersRef);
        const counters = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            counterName: doc.data().counterName,
            email: doc.data().email
          }))
          .filter(counter => counter.email !== email); // Exclude the current counter
        setAvailableCounters(counters);
      } catch (error) {
        console.error("Error fetching available counters:", error);
      }
    };
  
    fetchAvailableCounters();
  }, [email]);

  // const handleTransferButtonClick = async () => {
  //   if (transferButtonRef.current) {
  //     const rect = transferButtonRef.current.getBoundingClientRect();
  //     setDropdownPosition({
  //       top: rect.bottom + window.scrollY,
  //       left: rect.left + window.scrollX,
  //       width: rect.width,
  //     });
  //     setIsTransferDropdownOpen(!isTransferDropdownOpen);
  //   }
  // };


  const handleTransfer = async (selectedCounterEmail) => {
    if (!nowServingToken || nowServingToken === '---') {
      console.log("No token currently being served.");
      return;
    }
  
    try {
      const currentCounterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const selectedCounterNumber = parseInt(selectedCounterEmail.split("@")[0].replace("counter", ""));
  
      const requestsRef = collection(db, "requests");
      const q = query(requestsRef, where("tokenNumber", "==", nowServingToken));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const tokenData = querySnapshot.docs[0].data();
        const transferTimestamp = new Date().toISOString();
  
        // Create transfer history entry
        const transferEntry = {
          token: nowServingToken,
          fromCounter: currentCounterNumber,
          toCounter: selectedCounterNumber,
          transferredAt: transferTimestamp,
          name: tokenData.name,
          service: tokenData.service,
          createdAt: tokenData.createdAt,
          priority: true
        };
  
        // Check if the selected counter's document exists
        const selectedCounterRef = doc(db, `counter${selectedCounterNumber}`, 'counterDoc');
        const selectedCounterDoc = await getDoc(selectedCounterRef);
  
        if (selectedCounterDoc.exists()) {
          // Update the selected counter's document
          await updateDoc(selectedCounterRef, { 
            receivedTokens: arrayUnion(transferEntry),
            priority: arrayUnion(nowServingToken)
          });
        } else {
          console.error(`No document exists for counter ${selectedCounterNumber}.`);
          // You may choose to create the document here if needed
          await setDoc(selectedCounterRef, { 
            receivedTokens: [transferEntry],
            priority: [nowServingToken]
          });
        }
  
        // Update the request document with the new counter number
        await updateDoc(doc(requestsRef, querySnapshot.docs[0].id), {
          counterNumber: selectedCounterNumber,
          transfer: true,
          pending: false,
          status: false
        });
  
        console.log(`Token ${nowServingToken} transferred from Counter ${currentCounterNumber} to Counter ${selectedCounterNumber}`);
  
        // Update local state
        setNowServingToken("---");
        setCurrentTokenStartTime(null);
        setIsTransferDropdownOpen(false);
        
  
        // Remove the transferred token from the local requestsData
        setRequestsData(prevData => prevData.filter(item => item.tokenNumber !== nowServingToken));
  
        // Clear the nowServingToken from the current counter's document
        const currentCounterRef = doc(db, `counter${currentCounterNumber}`, 'counterDoc');
        await updateDoc(currentCounterRef, {
          nowServingToken: "-"
        });
  
      } else {
        console.log(`Token ${nowServingToken} not found in requests collection.`);
      }
    // Show success toast
    toast.success(`Transferred to counter${selectedCounterNumber} Successfully`);

    } catch (error) {
      console.error(`Error transferring token ${nowServingToken}:`, error);
      if (error.code) {
        console.error("Error code:", error.code);
      }
      if (error.message) {
        console.error("Error message:", error.message);
      }
    // Show error toast
    toast.error('Error transferring token');
    }
  };
  


  const handleTransferButtonClickForToken = (tokenNumber) => {
    setIsTransferDropdownOpenMap(prev => ({
      ...prev,
      [tokenNumber]: !prev[tokenNumber]
    }));
  };
  

  const transferSpecificToken = async (tokenNumber, selectedCounterEmail) => {
    try {
      const currentCounterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const selectedCounterNumber = parseInt(selectedCounterEmail.split("@")[0].replace("counter", ""));
    
      const requestsRef = collection(db, "requests");
      const q = query(requestsRef, where("tokenNumber", "==", tokenNumber));
      const querySnapshot = await getDocs(q);
    
      if (!querySnapshot.empty) {
        const tokenData = querySnapshot.docs[0].data();
        const transferTimestamp = new Date().toISOString();
    
        // Create transfer history entry
        const transferEntry = {
          token: tokenNumber,
          fromCounter: currentCounterNumber,
          toCounter: selectedCounterNumber,
          transferredAt: transferTimestamp,
          name: tokenData.name,
          service: tokenData.service,
          createdAt: tokenData.createdAt,
          priority: false
        };
    
        // Current counter document reference
        const currentCounterRef = doc(db, `counter${currentCounterNumber}`, 'counterDoc');
        const currentCounterDoc = await getDoc(currentCounterRef);
        let currentReceivedTokens = currentCounterDoc.exists() ? currentCounterDoc.data().receivedTokens || [] : [];
    
        // Remove the token if it's already present in the current counter
        currentReceivedTokens = currentReceivedTokens.filter(t => t.token !== tokenNumber);
    
        // Update the current counter document
        await setDoc(currentCounterRef, { receivedTokens: currentReceivedTokens }, { merge: true });
    
        // Selected counter document reference
        const selectedCounterRef = doc(db, `counter${selectedCounterNumber}`, 'counterDoc');
        const selectedCounterDoc = await getDoc(selectedCounterRef);
        let selectedReceivedTokens = selectedCounterDoc.exists() ? selectedCounterDoc.data().receivedTokens || [] : [];
    
        // Add the new transfer entry to the selected counter's receivedTokens array
        selectedReceivedTokens.push(transferEntry);
        await setDoc(selectedCounterRef, { receivedTokens: selectedReceivedTokens }, { merge: true });
    
        // Update the request document with the new counter number and set the status to false
        await updateDoc(doc(requestsRef, querySnapshot.docs[0].id), {
          counterNumber: selectedCounterNumber,
          status: false,
          transfer: true,
          pending: false
        });
    
        // Queue document reference
        const queueDocRef = doc(db, 'queue', 'queueDoc');
        const queueDoc = await getDoc(queueDocRef);
    
        let tokens = [];
        let pendingTokens = [];
        if (queueDoc.exists()) {
          const data = queueDoc.data();
          tokens = data.token || [];
          pendingTokens = data.pending || []; // Ensure this field exists
        } else {
          console.log(`Queue document does not exist. Creating a new one.`);
          // Optionally initialize the queue document with a default structure
          await setDoc(queueDocRef, { token: [], pending: [] });
        }
        
        // Ensure the types match when filtering
        tokens = tokens.filter(t => t !== tokenNumber);
        console.log('Updated queue tokens:', tokens);
    
        // Remove the token from pending tokens if necessary
        if (tokenData.pending) {
          pendingTokens = pendingTokens.filter(t => t !== tokenNumber);
          console.log('Updated pending tokens:', pendingTokens);
        }
    
        // Update the queue document
        await setDoc(queueDocRef, { token: tokens, pending: pendingTokens }, { merge: true });
    
        console.log(`Token ${tokenNumber} transferred from Counter ${currentCounterNumber} to Counter ${selectedCounterNumber}`);
    
        // Update local state
        setRequestsData(prevData => prevData.filter(item => item.tokenNumber !== tokenNumber));
        setIsTransferDropdownOpenMap(prev => ({ ...prev, [tokenNumber]: false }));
        // Add success toast
        toast.success(`Token ${tokenNumber} transferred to Counter ${selectedCounterNumber}`);
    
      } else {
        console.log(`Token ${tokenNumber} not found in requests collection.`);
      }
    
    } catch (error) {
      console.error(`Error transferring token ${tokenNumber}:`, error);
      // Optionally, add an error toast
      toast.error(`Failed to transfer Token ${tokenNumber}. Please try again.`);
    }
  };
  
  
  const pendingSpecificToken = async (specialtoken) => {
    try {
      // Check if the token is already pending
      const requestsRef = collection(db, "requests");
      const q = query(requestsRef, where("tokenNumber", "==", specialtoken));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const tokenData = querySnapshot.docs[0].data();
        if (tokenData.pending) {
          // Token is already pending, show alert toast
          toast.info(`Token ${specialtoken} is already in pending state`);
          return; // Exit the function early
        }
      }
  
      // Update the requests collection
      if (!querySnapshot.empty) {
        const docToUpdate = querySnapshot.docs[0];
        await updateDoc(doc(requestsRef, docToUpdate.id), { 
          pending: true,
          status: true  // Keeping status as true to ensure it's still in the active queue
        });
        console.log(`Token ${specialtoken} updated to pending in requests collection.`);
  
        // Update the local state to reflect the change
        setRequestsData(prevData => prevData.map(item => 
          item.tokenNumber === specialtoken 
            ? {...item, pending: true, status: true} 
            : item
        ));
      } else {
        console.log(`Token ${specialtoken} not found in requests collection.`);
        toast.error(`Token ${specialtoken} not found. Unable to mark as pending.`);
        return;
      }
  
      // Add the token to the pending array in queueDoc
      const queueDocRef = doc(db, 'queue', 'queueDoc');
      const queueDocSnap = await getDoc(queueDocRef);
  
      if (queueDocSnap.exists()) {
        const queueData = queueDocSnap.data();
        let pendingArray = queueData.pending || [];
  
        // Add to pending array if not already present
        if (!pendingArray.includes(specialtoken)) {
          pendingArray.push(specialtoken);
          await updateDoc(queueDocRef, { 
            pending: pendingArray
          });
          console.log(`Token ${specialtoken} added to pending array in queueDoc.`);
        } else {
          console.log(`Token ${specialtoken} already in pending array. No update needed.`);
        }
  
        // Update the pending count based on the length of the pending array
        setPendingCount(pendingArray.length);
      } else {
        console.log("Queue document does not exist.");
        toast.error("Queue document not found. Unable to update pending status.");
      }
  
      console.log(`Token ${specialtoken} has been successfully marked as pending.`);
      
      // Add success toast
      toast.success(`Token ${specialtoken} has been marked as pending`);
  
    } catch (error) {
      console.error(`Error marking token ${specialtoken} as pending:`, error);
      
      // Add error toast
      toast.error(`Failed to mark Token ${specialtoken} as pending. Please try again.`);
    }
  };


  const handleTransferredTokenPending = async (specialtoken) => {
    try {
      // Get the current counter number
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
  
      // Update the requests collection
      const requestsRef = collection(db, "requests");
      const q = query(requestsRef, where("tokenNumber", "==", specialtoken));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const docToUpdate = querySnapshot.docs[0];
        await updateDoc(doc(requestsRef, docToUpdate.id), { 
          pending: true,
          status: true  // Keeping status as true to ensure it's still in the active queue
        });
        console.log(`Token ${specialtoken} updated to pending in requests collection.`);
  
        // Update the local state to reflect the change
        setRequestsData(prevData => prevData.map(item => 
          item.tokenNumber === specialtoken 
            ? {...item, pending: true, status: true} 
            : item
        ));
      } else {
        console.log(`Token ${specialtoken} not found in requests collection.`);
      }
  
      // Add the token to the pending array in queueDoc
      const queueDocRef = doc(db, 'queue', 'queueDoc');
      const queueDocSnap = await getDoc(queueDocRef);
  
      if (queueDocSnap.exists()) {
        const queueData = queueDocSnap.data();
        let pendingArray = queueData.pending || [];
  
        // Add to pending array if not already present
        if (!pendingArray.includes(specialtoken)) {
          pendingArray.push(specialtoken);
          await updateDoc(queueDocRef, { 
            pending: pendingArray
          });
          console.log(`Token ${specialtoken} added to pending array in queueDoc.`);
        } else {
          console.log(`Token ${specialtoken} already in pending array. No update needed.`);
        }
  
        // Update the pending count based on the length of the pending array
        setPendingCount(pendingArray.length);

      } else {
        console.log("Queue document does not exist.");
      }
  
      // Delete the token from receivedTokens array in counterDoc
      const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
      const counterDocSnap = await getDoc(counterDocRef);
  
      if (counterDocSnap.exists()) {
        const counterData = counterDocSnap.data();
        let receivedTokens = counterData.receivedTokens || [];
        let priorityTokens = counterData.priority || [];
  
        // Remove the token from receivedTokens
        receivedTokens = receivedTokens.filter(t => t.token !== specialtoken);
        priorityTokens = priorityTokens.filter(t => t.token !== specialtoken);
  
        // Update the counter document
        await updateDoc(counterDocRef, {
          receivedTokens: receivedTokens,
          priority: priorityTokens
        });
  
        console.log(`Token ${specialtoken} removed from receivedTokens in counter${counterNumber}'s counterDoc.`);
  
        // Update local state
        setTransferredTokens(prev => prev.filter(t => t.token !== specialtoken));
        await fetchRemainingCount();
      } else {
        console.log("Counter document does not exist.");
      }
  
      console.log(`Token ${specialtoken} has been successfully marked as pending and removed from transferred tokens.`);
    } catch (error) {
      console.error(`Error marking transferred token ${specialtoken} as pending:`, error);
    }
  };


  const cancelSpecificToken = async (specialtoken) => {
    const confirmCancel = window.confirm(`Are you sure you want to cancel token?`);
    if (confirmCancel){
    try {
      // Delete the request from the requests collection
      const requestsRef = collection(db, "requests");
      const q = query(requestsRef, where("tokenNumber", "==", specialtoken));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(requestsRef, docToDelete.id));
        console.log(`Token ${specialtoken} deleted from requests collection.`);
  
        // Update the local state to remove the cancelled token
        setRequestsData(prevData => prevData.filter(item => item.tokenNumber !== specialtoken));
      } else {
        console.log(`Token ${specialtoken} not found in requests collection.`);
        return; // Exit the function if the token is not found in requests
      }
  
      // Remove the token from the token or pending array in queueDoc
      const queueDocRef = doc(db, 'queue', 'queueDoc');
      const queueDocSnap = await getDoc(queueDocRef);
  
      if (queueDocSnap.exists()) {
        const queueData = queueDocSnap.data();
        let tokenArray = queueData.token || [];
        let pendingArray = queueData.pending || [];
        let updateNeeded = false;
  
        // Check and remove from token array if present
        if (tokenArray.includes(specialtoken)) {
          tokenArray = tokenArray.filter(token => token !== specialtoken);
          updateNeeded = true;
          console.log(`Token ${specialtoken} removed from token array in queueDoc.`);
        }
  
        // Check and remove from pending array if present
        if (pendingArray.includes(specialtoken)) {
          pendingArray = pendingArray.filter(token => token !== specialtoken);
          updateNeeded = true;
          console.log(`Token ${specialtoken} removed from pending array in queueDoc.`);
        }
  
        // Update the queue document only if changes were made
        if (updateNeeded) {
          await updateDoc(queueDocRef, { 
            token: tokenArray,
            pending: pendingArray
          });
          console.log(`QueueDoc updated after cancelling token ${specialtoken}.`);
        } else {
          console.log(`Token ${specialtoken} was not found in token or pending arrays. No update needed.`);
        }
      } else {
        console.log("Queue document does not exist.");
      }
  
      // Update the remaining count
  
      console.log(`Token ${specialtoken} has been successfully cancelled.`);
    } catch (error) {
      console.error(`Error cancelling token ${specialtoken}:`, error);
    }
  }
};

  const handleCancelButtonClick = async () => {
    if (!nowServingToken || nowServingToken === '---') {
      console.log("No token currently being served.");
      return;
    }
    const confirmCancel = window.confirm(`Are you sure you want to cancel token?`);
    if (confirmCancel){
    try {
      // Delete the currently serving token from the requests collection
      const requestsRef = collection(db, "requests");
      const q = query(requestsRef, where("tokenNumber", "==", nowServingToken));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(requestsRef, docToDelete.id));
        console.log(`Token ${nowServingToken} deleted from requests collection.`);
  
        // Update the local state to remove the cancelled token
        setRequestsData(prevData => prevData.filter(item => item.tokenNumber !== nowServingToken));
      } else {
        console.log(`Token ${nowServingToken} not found in requests collection.`);
      }
  
      // Get the counter number from the user's email
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
  
      // Clear the nowServingToken from the counter's document
      const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
      await updateDoc(counterDocRef, {
        nowServingToken: "-"
      });
  
      // Set nowServingToken to "---"
      setNowServingToken("---");
      setCurrentTokenStartTime(null);
  
      console.log(`Token ${nowServingToken} has been successfully cancelled.`);
  
    } catch (error) {
      console.error(`Error cancelling token ${nowServingToken}:`, error);
    }
  }
};



  const callSpecificToken = async (specialtoken) => {
    try {
      // Set the nowServingToken state to the provided token number
      setNowServingToken(specialtoken);
      setCurrentTokenStartTime(new Date());
  
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
        const newMessage = `Token number ${specialtoken}, please proceed to counter ${counterNumber}`;
        console.log("Speaking message:", newMessage);
        // playSound(newMessage);
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

  const handleTransferredTokenCall = async (token) => {
    try {
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
  
      // Get the current counter document
      const counterDocSnap = await getDoc(counterDocRef);
  
      if (counterDocSnap.exists()) {
        const counterData = counterDocSnap.data();
        const receivedTokens = counterData.receivedTokens || [];
  
        // Find and remove the token from receivedTokens
        const updatedReceivedTokens = receivedTokens.filter(t => t.token !== token);
  
        await updateDoc(counterDocRef, {
          receivedTokens: updatedReceivedTokens,
          nowServingToken: token
        });
  
        // Update local state
        setNowServingToken(token);
        setCurrentTokenStartTime(new Date());
  
        setTransferredTokens(prev => prev.filter(t => t.token !== token));
        
  
        const newMessage = `Token number ${token}, please proceed to counter ${counterNumber}`;
        console.log("Speaking message:", newMessage);
        // playSound(newMessage);
  
        console.log(`Transferred token ${token} is now being served at counter ${counterNumber}`);
      } else {
        console.log("Counter document does not exist");
      }
    } catch (error) {
      console.error("Error handling transferred token call:", error);
    }
  };
  
  const handleTransferredTokenCancel = async (specialtoken) => {
    const confirmCancel = window.confirm(`Are you sure you want to cancel the token?`);
    if (confirmCancel) {
    try {
      // Get the counter number from the user's email
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      
      // Delete the token from receivedTokens array in counterDoc
      const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
      const counterDocSnap = await getDoc(counterDocRef);
  
      if (counterDocSnap.exists()) {
        const counterData = counterDocSnap.data();
        let receivedTokens = counterData.receivedTokens || [];
  
        // Remove the token from receivedTokens
        receivedTokens = receivedTokens.filter(t => t.token !== specialtoken);
  
        // Update the counter document
        await updateDoc(counterDocRef, {
          receivedTokens: receivedTokens
        });
  
        console.log(`Token ${specialtoken} removed from receivedTokens in counter${counterNumber}'s counterDoc.`);
  
        // Update local state
        setTransferredTokens(prev => prev.filter(t => t.token !== specialtoken));
      }
  
      // Delete the request from the requests collection
      const requestsRef = collection(db, "requests");
      const q = query(requestsRef, where("tokenNumber", "==", specialtoken));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(requestsRef, docToDelete.id));
        console.log(`Token ${specialtoken} deleted from requests collection.`);
  
        // Update the local state to remove the cancelled token
        setRequestsData(prevData => prevData.filter(item => item.tokenNumber !== specialtoken));
      } else {
        console.log(`Token ${specialtoken} not found in requests collection.`);
      }
  
      // Remove the token from the token or pending array in queueDoc
      const queueDocRef = doc(db, 'queue', 'queueDoc');
      const queueDocSnap = await getDoc(queueDocRef);
  
      if (queueDocSnap.exists()) {
        const queueData = queueDocSnap.data();
        let tokenArray = queueData.token || [];
        let pendingArray = queueData.pending || [];
        let updateNeeded = false;
  
        // Check and remove from token array if present
        if (tokenArray.includes(specialtoken)) {
          tokenArray = tokenArray.filter(token => token !== specialtoken);
          updateNeeded = true;
          console.log(`Token ${specialtoken} removed from token array in queueDoc.`);
        }
  
        // Check and remove from pending array if present
        if (pendingArray.includes(specialtoken)) {
          pendingArray = pendingArray.filter(token => token !== specialtoken);
          updateNeeded = true;
          console.log(`Token ${specialtoken} removed from pending array in queueDoc.`);
        }
  
        // Update the queue document only if changes were made
        if (updateNeeded) {
          await updateDoc(queueDocRef, { 
            token: tokenArray,
            pending: pendingArray
          });
          console.log(`QueueDoc updated after cancelling token ${specialtoken}.`);
        } else {
          console.log(`Token ${specialtoken} was not found in token or pending arrays. No update needed.`);
        }
      } else {
        console.log("Queue document does not exist.");
      }
  
      // Update the remaining count
      // setRemainingCount(prevCount => prevCount - 1);
  
      console.log(`Token ${specialtoken} has been successfully cancelled and removed from all relevant collections.`);
    } catch (error) {
      console.error(`Error cancelling transferred token ${specialtoken}:`, error);
    }
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
    setCurrentDate(getCurrentDate());
  }, [completedCount]);

  const sortedRequestsData = [...requestsData, ...transferredTokens].sort((a, b) => {
    // First, check if either a or b has a priority set to true
    if (a.priority && !b.priority) return -1;
    if (!b.priority && a.priority) return 1;
    
    // If both have priority or neither has priority, sort by createdAt
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  const DeleteIcon = ({ className, onClick }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`w-6 h-6 ${className}`}
      onClick={onClick}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );

  return (
    <div className="flex bg-[#f8f8f9] min-h-screen">
      <div className="fixed top-0 left-0 bottom-0">
        <Navbar />
      </div>
      <div className="flex-1 ml-60 pb-4 bg-[#f8f8f9] rounded-tl-3xl overflow-y-auto hide-scrollbar"> {/* Added flex flex-col */}
        <div className="flex flex-1 justify-center flex-wrap lg:mx-24">
        <div>
        <div className="mb-4 mt-4 mr-24">
          <h1 className="font-semibold">{counterName}</h1>
            <h1>Date : {currentDate} </h1>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4 mt-6 mr-4">
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex flex-col items-center">
                <h3 className="font-bold text-large text-center">Total Customer</h3>
              </CardHeader>
              <CardBody className="overflow-visible py-2 flex justify-center items-center">
              <p className="text-6xl font-bold mt-4">{totalCustomerCount}</p>
              </CardBody>
            </Card>
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex flex-col items-center">
                <h3 className="font-bold text-large text-center">Remaining</h3>
               
              </CardHeader>
              <CardBody className="overflow-visible py-2 flex justify-center items-center">
                  <p className="text-6xl font-bold mt-4">{remainingCount}</p>
              </CardBody>
            </Card>
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex flex-col items-center">
                <h3 className="font-bold text-large text-center">Completed</h3>
              </CardHeader>
              <CardBody className="overflow-visible py-2 flex justify-center items-center">
                <p className="text-6xl font-bold mt-4">{completedCount}</p>
              </CardBody>
            </Card>
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex flex-col items-center">
                <h3 className="font-bold text-large text-center">Pending</h3>
              </CardHeader>
              <CardBody className="overflow-visible py-2 flex justify-center items-center">
              <p className="text-6xl font-bold mt-4">{pendingCount}</p>
              </CardBody>
            </Card>
          </div>
          </div>
          <div className="grid grid-cols-1 mb-4 mt-16">
          <Card className="py-4 ml-4 w-[200px] mt-6">
            <CardHeader className="pb-0 pt-2 px-4 flex flex-col items-center">
              <h3 className="font-bold text-large text-center">Now Serving</h3>
              <p className="text-6xl font-bold mt-4">{nowServingToken === "---" ? "---" : nowServingToken || "---"}</p>
            </CardHeader>
            <CardBody className="overflow-visible py-2 flex justify-center items-center">
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
          <div className="mb-2 mt-16 ml-14">
            <div className="flex justify-end mb-2">
              <Button onClick={handleNextButtonClick}
                // disabled={nowServingToken !== "---"}
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
            <div className="flex justify-end mb-2 relative">
              <div 
                onMouseEnter={() => setIsTransferDropdownOpen(true)}
                onMouseLeave={() => setIsTransferDropdownOpen(false)}
              >
                <Button 
                  ref={transferButtonRef}
                  disabled={!nowServingToken || nowServingToken === "---"}
                  className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-32 mt-8"
                >
                  Transfer
                </Button>
                {isTransferDropdownOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      width: '100%',
                      zIndex: 1000,
                    }}
                    className="rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                  >
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      {availableCounters.map((counter) => (
                        <button
                          key={counter.id}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                          role="menuitem"
                          onClick={() => handleTransfer(counter.email)}
                        >
                          {counter.counterName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end mb-2">
              <Button onClick={handleCancelButtonClick}
                disabled={!nowServingToken}
                className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-32 mt-8">
                Cancel
              </Button>
            </div>
          </div>

      <div className="flex flex-col items-center justify-center w-full">
      {sortedRequestsData.length > 0 ? (
        <div className="p-10 py-5 w-full"> 
            <Table aria-label="Example static collection table" removeWrapper>
              <TableHeader>
                <TableColumn>Token</TableColumn>
                <TableColumn>Name</TableColumn>
                <TableColumn>Date</TableColumn>
                <TableColumn>Service</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn></TableColumn>
                <TableColumn></TableColumn>
                <TableColumn></TableColumn>
                <TableColumn></TableColumn>
              </TableHeader>
      <TableBody>
      {sortedRequestsData.map(request => (
        <TableRow key={request.id || request.token}>
          <TableCell>{request.tokenNumber || request.token}</TableCell>
          <TableCell>{request.name}</TableCell>
          <TableCell>
          {request.date instanceof Date 
            ? request.date.toLocaleString() 
            : new Date(request.date || request.transferredAt).toLocaleString()}
          </TableCell>
          <TableCell>{request.service}</TableCell>
          <TableCell>
            <h1 className={`text-xs font-medium me-2 pr-2 px-2.5 pl-4 py-0.5 rounded ${
              request.pending 
              ? 'bg-orange-400 text-orange-900 dark:bg-orange-900 dark:text-orange-700'
              : request.transferredAt
              ? 'bg-blue-300 text-blue-900 dark:bg-blue-900 dark:text-blue-700'
              : 'bg-green-300 text-green-900 dark:bg-green-900 dark:text-green-700'
              }`}>
              {request.pending ? 'Pending' : (request.transferredAt ? 'Transferred' : 'Active')}
            </h1>
          </TableCell>
          <TableCell>
            {request.transferredAt ? (
              <Button
                onClick={() => handleTransferredTokenCall(request.tokenNumber || request.token)}
                disabled={nowServingToken !== "---"}
                className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3"
              >
                Call Now
              </Button>
            ) : request.pending ? (
              <Button
                onClick={() => recallSpecificToken(request.tokenNumber || request.token)}
                disabled={nowServingToken !== "---"}
                className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3"
              >
                Call Now
              </Button>
            ) : (
              <Button
                onClick={() => callSpecificToken(request.tokenNumber || request.token)}
                disabled={nowServingToken !== "---"}
                className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3"
              >
                Call Now
              </Button>
            )}
          </TableCell>
          <TableCell>
          <div className="relative transfer-dropdown">
            <div
              onMouseEnter={() => handleTransferButtonClickForToken(request.tokenNumber || request.token)}
              onMouseLeave={() => setIsTransferDropdownOpenMap(prev => ({...prev, [request.tokenNumber || request.token]: false}))}
            >
              <Button
                ref={el => transferButtonRefs.current[request.tokenNumber || request.token] = el}
                className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3"
              >
                Transfer
              </Button>
              {isTransferDropdownOpenMap[request.tokenNumber || request.token] && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 1000,
                  }}
                  className="rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                >
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    {availableCounters.map((counter) => (
                      <button
                        key={counter.id}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
                        role="menuitem"
                        onClick={() => transferSpecificToken(request.tokenNumber || request.token, counter.email)}
                      >
                        {counter.counterName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          </TableCell>
          <TableCell>
          <Button
            onClick={() => request.transferredAt ? 
              handleTransferredTokenPending(request.tokenNumber || request.token) : 
              pendingSpecificToken(request.tokenNumber || request.token)}
            className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3"
          >
            Pending
          </Button>
          </TableCell>
          <TableCell>
            <Tooltip content={"Delete Token"}>
            <div className={nowServingToken !== "---" ? "opacity-50 cursor-not-allowed" : ""}>
              <DeleteIcon
                onClick={() => {
                    if (request.transferredAt) {
                      handleTransferredTokenCancel(request.tokenNumber || request.token);
                    } else {
                      cancelSpecificToken(request.tokenNumber || request.token);
                    }
                }}
                className="text-red-500 hover:text-red-700 cursor-pointer"
              />
            </div>
          </Tooltip>
          </TableCell>
        </TableRow>
      ))}
      </TableBody>
      </Table>
        </div >
        ) :<div className="h-80 flex items-center justify-center text-gray-500 -mt-12">
              Queue is empty and no tokens available
            </div>}
      </div>         
        </div>
      </div>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

    </div>
  );
};

export default CounterDash;

