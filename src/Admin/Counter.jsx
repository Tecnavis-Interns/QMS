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
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
  query,
} from "firebase/firestore";
import ModalCounter from "./ModalCounter";
import EditCounterModal from "./EditCounterModal";
import { useNavigate } from "react-router-dom";
import { deleteUser, signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { db, auth } from "../firebase";


const AdminDash = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

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
  
        // Attempt to delete the user from Firebase Authentication
        try {
          // Sign in as the user to be deleted
          // Note: This requires knowing the user's password, which is not ideal
          // You might need to implement a different approach in a production environment
          const userCredential = await signInWithEmailAndPassword(auth, counterToDelete.email, counterToDelete.password);
          const user = userCredential.user;
  
          // Delete the user
          await deleteUser(user);
          console.log("User deleted successfully");
        } catch (authError) {
          console.error("Error deleting user from Authentication:", authError);
          // The counter was deleted from Firestore, but not from Authentication
          alert("The counter was removed, but there was an issue deleting the associated user account. An administrator may need to remove it manually.");
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
        <div className="flex flex-col justify-center py-5 gap-4 w-full px-6">
          <div className="flex justify-between items-center w-full mb-4">
            <div className="font-semibold md:text-xl">
              <h2>Active Counters</h2>
            </div>
            <ModalCounter onCounterAdded={handleCounterAdded} />
          </div>
          
          <Table aria-label="Example static collection table">
            <TableHeader>
              <TableColumn>Counter Name</TableColumn>
              <TableColumn>Email</TableColumn>
              <TableColumn>Service</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody>
              {counters.map((counter) => (
                <TableRow key={counter.id}>
                  <TableCell>{counter.counterName}</TableCell>
                  <TableCell>{counter.email}</TableCell>
                  <TableCell>{counter.service}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="primary"
                        onClick={() => handleEditCounter(counter)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        onClick={() => handleDeleteCounter(counter.id)}
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