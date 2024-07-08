import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { updateDoc, doc, collection, getDocs } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { db } from "../firebase";

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
      const counterRef = doc(db, "counters", counter.id);
      const updateData = { 
        counterName: editedCounterData.counterName,
        email: editedCounterData.email,
        service: editedCounterData.service
      };
      
      if (newPassword) {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(newPassword, salt);
        updateData.password = hashedPassword;
      }

      await updateDoc(counterRef, updateData);
      setCounters((prevCounters) =>
        prevCounters.map((c) => (c.id === counter.id ? { ...c, ...updateData } : c))
      );
      onClose();
    } catch (error) {
      console.error("Error editing counter: ", error);
      setError("Failed to update counter. Please try again.");
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
