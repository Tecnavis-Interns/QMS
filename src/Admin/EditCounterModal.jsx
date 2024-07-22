import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { updateDoc, doc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { hash } from "bcryptjs";
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';

const EditCounterModal = ({ isOpen, onClose, counter, setCounters }) => {
  const [editedCounterData, setEditedCounterData] = useState({ ...counter });
  const [services, setServices] = useState([]);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

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
  
      // If a new password is provided, hash it and update
      if (newPassword) {
        const hashedPassword = await hash(newPassword, 10);
        updateData.password = hashedPassword;
      }
  
      await updateDoc(counterRef, updateData);
  
      // Update local state
      setCounters((prevCounters) =>
        prevCounters.map((c) => (c.id === counter.id ? { ...c, ...updateData } : c))
      );
  
      onClose();
      setError("Counter updated successfully.");
    } catch (error) {
      console.error("Error editing counter: ", error);
      setError(`Failed to update counter: ${error.message}`);
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
            type={isVisible ? "text" : "password"}
            label="New Password (leave blank to keep current)" 
            name="newPassword" 
            value={newPassword} 
            onChange={handlePasswordChange} 
            endContent={
              <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                {isVisible ? (
                  <EyeSlashIcon className="h-6 w-6 text-default-400" />
                ) : (
                  <EyeIcon className="h-6 w-6 text-default-400" />
                )}
              </button>
            }
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