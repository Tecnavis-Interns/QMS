import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import Navbar from "./Navbar";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  getDocs,
  updateDoc,
  getFirestore
} from "firebase/firestore";
import ModalCounter from "./ModalCounter";
import EditCounterModal from "./EditCounterModal";
import { getAuth } from "firebase/auth";
import { db } from "../../services/firebase";
import { doc as firestoreDoc } from "firebase/firestore";


const AdminDash = () => {
  const auth = getAuth();

  const [counters, setCounters] = useState([]);
  const [selectedCounter, setSelectedCounter] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const fetchCounters = async () => {
      const countersCollection = collection(db, "counters");
      const unsubscribe = onSnapshot(query(countersCollection), (snapshot) => {
        const countersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCounters(countersList);
      });

      return () => unsubscribe();
    };

    fetchCounters();
  }, []);

  const handleEditCounter = (counter) => {
    setSelectedCounter(counter);
    onOpen();
  };
  
  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset?")) {
      try {
        const db = getFirestore(); // Ensure you have the Firestore instance
        
        // Delete all documents in the "queue" collection
        const queueSnapshot = await getDocs(collection(db, "queue"));
        const queueDeletePromises = queueSnapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(queueDeletePromises);
        
        // Delete all documents in the "requests" collection
        const requestsSnapshot = await getDocs(collection(db, "requests"));
        const requestsDeletePromises = requestsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(requestsDeletePromises);
        
        // Update 'completed' field to 0 for all counters and clear 'receivedTokens'
        const countersSnapshot = await getDocs(collection(db, "counters"));
        const counterUpdatePromises = countersSnapshot.docs.map(async (doc) => {
          // Update 'completed' field to 0
          await updateDoc(doc.ref, { completed: 0 });
          
  
          // Clear 'receivedTokens' in 'counterDoc'
          const data = doc.data();
          if (data.email) {
            const counterName = data.email.split('@')[0];
            const counterDocRef = firestoreDoc(db, counterName, "counterDoc");
            await updateDoc(counterDocRef, { 
              receivedTokens: [], 
              priority: [], 
              nowservingtoken: '-' 
          })
          }
        });
        await Promise.all(counterUpdatePromises);
        
        console.log("All queues and requests have been deleted, and counters reset.");
        alert("Reset successful. All queues and requests have been deleted, and counters reset.");
      } catch (error) {
        console.error("Error resetting collections or counters:", error);
        alert("An error occurred while resetting. Please try again.");
      }
    }
  };
  

  const handleDeleteCounter = async (counterId) => {
    if (window.confirm("Are you sure you want to delete this counter?")) {
      try {
        const counterToDelete = counters.find(counter => counter.id === counterId);
        if (!counterToDelete) {
          console.error("Counter not found");
          return;
        }
  
        // Delete the counter document from Firestore
        await deleteDoc(doc(db, "counters", counterId));
        console.log("qdpqr");
  
        // Delete the user from Firebase Authentication
        const user = auth.currentUser;
        if (user) {
          try {
            await user.delete();
            console.log("User deleted successfully");
          } catch (error) {
            console.error("Error deleting user:", error);
          }
        }
  
        // Update the local state
        setCounters(counters.filter(counter => counter.id !== counterId));
        console.log("Counter deleted successfully");
      } catch (error) {
        console.error("Error deleting counter:", error);
        alert("An error occurred while deleting the counter. Please try again.");
      }
    }
  };

  const handleCounterAdded = (newCounter) => {
    setCounters([...counters, newCounter]);
  };

  return (
    <div className="flex min-h-screen">
      <div className="fixed h-full">
        <Navbar />
      </div>
      <div className="flex flex-col flex-1 ml-64">
        <div className="flex flex-col justify-center py-5 gap-4 w-full px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full mb-4">
            <div className="font-semibold text-lg sm:text-xl mb-2 sm:mb-0">
              <h2>Active Counters</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <ModalCounter onCounterAdded={handleCounterAdded} />
              <Button onClick={handleReset} className="bg-[#908fe2] text-white w-full sm:w-auto">
                Reset
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table aria-label="Active counters table" className="min-w-full">
              <TableHeader>
                <TableColumn>Counter Name</TableColumn>
                <TableColumn className="hidden sm:table-cell">Email</TableColumn>
                <TableColumn className="hidden md:table-cell">Service</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {counters.map((counter) => (
                  <TableRow key={counter.id}>
                    <TableCell>{counter.counterName}</TableCell>
                    <TableCell className="hidden sm:table-cell">{counter.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{counter.service}</TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditCounter(counter)}
                          className="bg-[#b9b0eb] text-black w-full sm:w-auto"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDeleteCounter(counter.id)}
                          className="text-red-400 bg-white w-full sm:w-auto"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {selectedCounter && (
        <EditCounterModal
          key={selectedCounter.id}
          isOpen={isOpen}
          onClose={() => {
            onClose();
            setSelectedCounter(null);
          }}
          counter={selectedCounter}
          setCounters={setCounters}
        />
      )}
    </div>
  );
};

export default AdminDash;