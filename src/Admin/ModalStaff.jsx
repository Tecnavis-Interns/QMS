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
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { hash } from "bcryptjs";

const ModalStaff = ({ isOpen, onClose, services, onSubmit }) => {
  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      staffName: "",
      email: "",
      password: "",
    //   selectedService: "",
      newStaffID: "",
    }
  });

  useEffect(() => {
    if (isOpen) {
      generateNewStaffID();
      reset();
    }
  }, [isOpen, reset]);

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
    setValue("newStaffID", newID);
  };

  const onSubmitForm = async (data) => {
    try {
      // Hash the password
      const hashedPassword = await hash(data.password, 10);

      // Add new staff member
      await setDoc(doc(db, "staff", data.newStaffID), {
        id: data.newStaffID,
        staffName: data.staffName,
        email: data.email,
        password: hashedPassword,
        // service: data.selectedService,
        active: true,
      });

      // Close the modal
      onClose();

      // Notify parent component of successful submission
      onSubmit();
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="bg-[#F8F8F9] font-[Outfit]">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Add Staff</ModalHeader>
        <form onSubmit={handleSubmit(onSubmitForm)}>
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
                required: "Password is required",
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
                  isInvalid={!!errors.selectedService}
                  errorMessage={errors.selectedService?.message}
                >
                  {services.map((item) => (
                    <SelectItem className="font-[Outfit]" value={item} key={item}>
                      {item}
                    </SelectItem>
                  ))}
                </Select>
              )}
            /> */}
            <Controller
              name="newStaffID"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  label="Staff ID"
                  readOnly
                  variant="bordered"
                />
              )}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" onPress={onClose} className="w-full">
              Close
            </Button>
            <Button color="primary" type="submit" className="w-full">
              Submit
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ModalStaff;