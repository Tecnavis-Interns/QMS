import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      staffName: "",
      email: "",
      password: "",
    //   selectedService: "",
    }
  });

  useEffect(() => {
    if (isOpen && staff) {
      reset({
        staffName: staff.staffName || "",
        email: staff.email || "",
        password: "",
        // selectedService: staff.service || "",
      });
    }
  }, [isOpen, staff, reset]);

  const onSubmitForm = async (data) => {
    try {
      // Hash the password if it was changed
      const hashedPassword = data.password ? await hash(data.password, 10) : null;

      // Fetch the staff document reference
      const staffDocRef = doc(db, "staff", staff.id);
      const staffDocSnapshot = await getDoc(staffDocRef);

      // Check if the document exists
      if (staffDocSnapshot.exists()) {
        // Update staff member in Firestore
        const updateData = {
          staffName: data.staffName,
          email: data.email,
        //   service: data.selectedService,
        };
        if (hashedPassword) updateData.password = hashedPassword;
        await updateDoc(staffDocRef, updateData);

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
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <ModalHeader className="flex flex-col gap-1">Edit Staff</ModalHeader>
          <ModalBody>
            <Controller
              name="staffName"
              control={control}
              rules={{ required: "Staff Name is required" }}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  label="Staff Name"
                  variant="bordered"
                  isInvalid={!!errors.staffName}
                  errorMessage={errors.staffName?.message}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              rules={{ 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  label="Email"
                  variant="bordered"
                  isInvalid={!!errors.email}
                  errorMessage={errors.email?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              rules={{ 
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters"
                }
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  type="password"
                  label="Password"
                  variant="bordered"
                  placeholder="Leave empty to keep current password"
                  isInvalid={!!errors.password}
                  errorMessage={errors.password?.message}
                />
              )}
            />
            {/* <Controller
              name="selectedService"
              control={control}
              rules={{ required: "Service is required" }}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Select Service"
                  variant="bordered"
                  selectedKeys={field.value ? [field.value] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0];
                    setValue("selectedService", selected);
                  }}
                  isInvalid={!!errors.selectedService}
                  errorMessage={errors.selectedService?.message}
                >
                  {services.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </Select>
              )}
            /> */}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onPress={onClose} className="w-full">
              Close
            </Button>
            <Button color="primary" type="submit" className="w-full">
              Update
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default EditModalStaff;