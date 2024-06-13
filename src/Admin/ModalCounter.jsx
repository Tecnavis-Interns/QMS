import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
} from "@nextui-org/react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { collection, addDoc ,setDoc,doc} from "firebase/firestore";
import { db, signUp } from "../firebase";

export default function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [counterName, setCounterName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    try {
      // Create a user in Firebase Authentication
      const user = await signUp(email, password);

      // Generate a unique ID for the entry
      const id = uuidv4();

      // Add the data to the 'counter' collection in Firestore
      // await addDoc(collection(db, "counter"), {
      //   id,
      //   counterName,
      //   email,
      //   uid: user.uid, // Store the user's UID from Firebase Auth
      // });

      await setDoc(doc(db, "counter", id), {
        id, // Using id as both document ID and field
        counterName,
        email,
        uid: user.uid, // Store the user's UID from Firebase Auth
      });

      // Clear form fields after submission
      setCounterName("");
      setEmail("");
      setPassword("");

      // Close the modal
      onClose();

      // Alert for successful signup
      alert("Signup successful!");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Signup failed. Please try again.");
    }
  };

  return (
    <>
      <Button onPress={onOpen} className="bg-[#6236F5] text-white">
        + Add Counter
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} className="bg-[#F8F8F9] font-[Outfit]">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">Add Counter</ModalHeader>
          <ModalBody>
            <Input
              type="text"
              label="Counter Name"
              value={counterName}
              onChange={(e) => setCounterName(e.target.value)}
              variant="bordered"
            />
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="bordered"
            />
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onPress={onClose} className="w-full">
              Close
            </Button>
            <Button color="primary" onPress={handleSubmit} className="w-full">
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
