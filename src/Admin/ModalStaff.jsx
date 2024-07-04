import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { collection, addDoc, updateDoc, doc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { hash } from "bcryptjs";

const ModalStaff = ({ isOpen, onClose, services, staff, onSubmit }) => {
  const [staffName, setStaffName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [newStaffID, setNewStaffID] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (staff) {
        // Editing existing staff member
        setStaffName(staff.staffName);
        setEmail(staff.email);
        setSelectedService(staff.service);
        setNewStaffID(staff.id); // Ensure staff ID is not changed during edit
      } else {
        // Adding new staff member
        generateNewStaffID();
        setStaffName("");
        setEmail("");
        setPassword("");
        setSelectedService("");
      }
    }
  }, [isOpen, staff]);

  const generateNewStaffID = async () => {
    const currentYear = new Date().getFullYear();
    const staffCollection = collection(db, "staff");
    const staffQuery = query(staffCollection, where("id", ">=", `S${currentYear}001`), where("id", "<=", `S${currentYear}999`));

    const staffSnapshot = await getDocs(staffQuery);
    const staffIDs = staffSnapshot.docs.map(doc => doc.data().id);

    let maxID = 0;
    staffIDs.forEach(id => {
      const num = parseInt(id.slice(7));
      if (num > maxID) {
        maxID = num;
      }
    });

    const newIDNumber = String(maxID + 1).padStart(3, '0');
    const newID = `S${currentYear}${newIDNumber}`;
    setNewStaffID(newID);
  };

  const handleSubmit = async () => {
    try {
      // Hash the password
      const hashedPassword = password ? await hash(password, 10) : null;

      // Check if the service is already assigned
      const serviceQuery = query(collection(db, "staff"), where("service", "==", selectedService));
      const serviceSnapshot = await getDocs(serviceQuery);
      if (!staff && !serviceSnapshot.empty) {
        alert("Service already taken.");
        return;
      }

      if (staff) {
        // Update existing staff member
        await updateDoc(doc(db, "staff", staff.id), {
          staffName,
          email,
          service: selectedService,
          password: hashedPassword, // Only update password if it's changed
        });
      } else {
        // Add new staff member
        await addDoc(collection(db, "staff"), {
          id: newStaffID,
          staffName,
          email,
          password: hashedPassword,
          service: selectedService,
          active: true,
        });
      }

      // Clear form fields after submission
      setStaffName("");
      setEmail("");
      setPassword("");
      setSelectedService("");

      // Close the modal
      onClose();

      // Notify parent component of successful submission
      onSubmit();
    } catch (error) {
      console.error("Error adding/updating document: ", error);
    }
  };

  const handleServiceChange = (event) => {
    setSelectedService(event.target.value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="bg-[#F8F8F9] font-[Outfit]">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{staff ? "Edit Staff" : "Add Staff"}</ModalHeader>
        <ModalBody>
          <Input
            type="text"
            label="Staff Name"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            variant="bordered"
          />
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="bordered"
          />
          {!staff && (
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="bordered"
            />
          )}
          <Select
            label="Select Service"
            value={selectedService}
            onChange={handleServiceChange}
            required
            variant="bordered"
          >
            {services.map((item) => (
              <SelectItem className="font-[Outfit]" value={item} key={item}>
                {item}
              </SelectItem>
            ))}
          </Select>
          <Input
            type="text"
            label="Staff ID"
            value={newStaffID}
            readOnly
            variant="bordered"
          />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onPress={onClose} className="w-full">
            Close
          </Button>
          <Button color="primary" onPress={handleSubmit} className="w-full">
            {staff ? "Update" : "Submit"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModalStaff;
