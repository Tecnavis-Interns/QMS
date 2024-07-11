import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { updateDoc, doc, collection, getDocs } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { updateEmail, updatePassword, getAuth, onAuthStateChanged} from "firebase/auth";
import { db, auth } from "../firebase";

const EditCounterModal = ({ isOpen, onClose, counter, setCounters }) => {
  const [editedCounterData, setEditedCounterData] = useState({ ...counter });
  const [services, setServices] = useState([]);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setEditedCounterData({ ...counter });
    setNewPassword("");
    setError("");
  }, [counter]);

  useEffect(() => {
    const fetchServices = async () => {
      const servicesCollection = collection(db, "services");
      const servicesSnapshot = await getDocs(servicesCollection);
      const servicesList = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(servicesList);
    };

    fetchServices();
  }, []);

  const handleEditCounter = async () => {
    if (!editedCounterData.counterName || !editedCounterData.email || !editedCounterData.service) {
      setError("All fields are required.");
      return;
    }
  
    try {
      const auth = getAuth();
      
      // Ensure user is logged in and token is fresh
      await new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          if (user) {
            user.getIdToken(true).then(resolve).catch(reject);
          } else {
            reject(new Error("User is not authenticated"));
          }
        });
      });
  
      const user = auth.currentUser;
      if (!user) {
        setError("User not authenticated. Please log in again.");
        return;
      }
  
      // Update email if changed
      if (user.email !== editedCounterData.email) {
        await updateEmail(user, editedCounterData.email);
      }
  
      // Update password if provided
      if (newPassword) {
        await updatePassword(user, newPassword);
      }
  
      // Update Firestore document
      const counterRef = doc(db, "counters", counter.id);
      const updateData = { 
        counterName: editedCounterData.counterName,
        email: editedCounterData.email,
        service: editedCounterData.service
      };
  
      await updateDoc(counterRef, updateData);
  
      // Update local state
      setCounters((prevCounters) =>
        prevCounters.map((c) => (c.id === counter.id ? { ...c, ...updateData } : c))
      );
  
      onClose();
      setError("Counter updated successfully.");
    } catch (error) {
      console.error("Error editing counter: ", error);
      if (error.code === 'auth/requires-recent-login') {
        setError("This operation requires recent authentication. Please log out and log in again before retrying.");
      } else if (error.code === 'auth/invalid-email') {
        setError("The email address is invalid.");
      } else if (error.code === 'auth/email-already-in-use') {
        setError("The email address is already in use by another account.");
      } else {
        setError(`Failed to update counter: ${error.message}`);
      }
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedCounterData({ ...editedCounterData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  const handleServiceChange = (value) => {
    setEditedCounterData({ ...editedCounterData, service: value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Edit Counter</ModalHeader>
        <ModalBody>
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          <Input 
            type="text" 
            label="Counter Name" 
            name="counterName" 
            value={editedCounterData.counterName || ''} 
            onChange={handleInputChange} 
            required
          />
          <Input 
            type="email" 
            label="Email" 
            name="email" 
            value={editedCounterData.email || ''} 
            onChange={handleInputChange} 
            required
          />
          <Input 
            type="password" 
            label="New Password (leave blank to keep current)" 
            name="newPassword" 
            value={newPassword} 
            onChange={handlePasswordChange} 
          />
          <Select 
            label="Select your Reason to be here" 
            selectedKeys={editedCounterData.service ? [editedCounterData.service] : []}
            onChange={(e) => handleServiceChange(e.target.value)}
            required
          >
            {services.map((service) => (
              <SelectItem key={service.name} value={service.name}>
                {service.name}
              </SelectItem>
            ))}
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleEditCounter}>Save Changes</Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditCounterModal;
