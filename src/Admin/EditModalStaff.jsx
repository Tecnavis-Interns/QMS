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
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { hash } from "bcryptjs";

const EditModalStaff = ({ isOpen, onClose, services, staff, onSubmit }) => {
  const [staffName, setStaffName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedService, setSelectedService] = useState("");

  useEffect(() => {
    if (isOpen && staff) {
      // Populate form fields with existing data
      setStaffName(staff.staffName || "");
      setEmail(staff.email || "");
      setSelectedService(staff.service || "");
    }
  }, [isOpen, staff]);

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!staffName || !email || !selectedService) {
        alert("Please fill out all required fields.");
        return;
      }

      // Hash the password if it was changed
      const hashedPassword = password ? await hash(password, 10) : null;

      // Fetch the staff document reference
      const staffDocRef = doc(db, "staff", staff.id);
      const staffDocSnapshot = await getDoc(staffDocRef);

      // Check if the document exists
      if (staffDocSnapshot.exists()) {
        // Update staff member in Firestore
        const updateData = {
          staffName,
          email,
          service: selectedService,
        };
        if (hashedPassword) updateData.password = hashedPassword;
        await updateDoc(staffDocRef, updateData);
        // Clear form fields after submission
        setStaffName("");
        setEmail("");
        setPassword("");
        setSelectedService("");

        // Close the modal
        onClose();

        // Notify parent component of successful submission
        onSubmit();
      } else {
        console.error("No document to update:", staff.id);
        alert("No document to update. Please refresh and try again.");
      }
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Failed to update staff member. Please try again later.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="bg-[#F8F8F9] font-[Outfit]">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Edit Staff</ModalHeader>
        <ModalBody>
          <Input
            type="text"
            label="Staff Name"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            variant="bordered"
            required
          />
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="bordered"
            required
          />
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="bordered"
            placeholder="Leave empty to keep current password"
          />
          <Select
            label="Select Service"
            selectedKeys={[selectedService]}
            onChange={(e) => setSelectedService(e.target.value)}
            required
            variant="bordered"
          >
            {services.map((item) => (
              <SelectItem className="font-[Outfit]" value={item} key={item}>
                {item}
              </SelectItem>
            ))}
          </Select>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" onPress={onClose} className="w-full">
            Close
          </Button>
          <Button color="primary" onPress={handleSubmit} className="w-full">
            Update
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditModalStaff;
