import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";

export default function ManageCounterModal({ onClose }) {
  const [isOpen, setIsOpen] = useState(false); // State for modal visibility
  const [counters, setCounters] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "counter"));
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCounters(data);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
    const unsubscribe = onSnapshot(collection(db, "counter"), (snapshot) => {
      const updatedData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCounters(updatedData);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = () => {
    setIsOpen(true); // Open the modal
  };

  const handleCloseModal = () => {
    setIsOpen(false); // Close the modal
    onClose(); // Call the onClose callback provided by the parent component
  };

  return (
    <>
      <Button onPress={handleOpenModal} className="bg-[#6236F5] text-white">
        Manage Counter
      </Button>
      <Modal isOpen={isOpen} onClose={handleCloseModal}>
        <ModalContent>
          <ModalHeader>Manage Counters</ModalHeader>
          <ModalBody>
            <Table aria-label="Example static collection table">
              <TableHeader>
                <TableColumn>Sl.no</TableColumn>
                <TableColumn>Counter Name</TableColumn>
              </TableHeader>
              <TableBody>
                {counters.map((counter, index) => (
                  <TableRow key={counter.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{counter.counterName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={handleCloseModal}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
