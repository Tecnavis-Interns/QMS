import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { hash } from "bcryptjs";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function ModalCounter({ onCounterAdded }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      counterName: "",
      email: "",
      password: "",
      service: "",
    },
  });

  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      const servicesCollection = collection(db, "services");
      const servicesSnapshot = await getDocs(servicesCollection);
      const servicesList = servicesSnapshot.docs.map((doc) => doc.data());

      setServices(servicesList);
    };

    fetchServices();
  }, []);

  const onSubmit = async (data) => {
    if (!data.counterName || !data.email || !data.password || !data.service) {
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      const id = uuidv4();
      const hashedPassword = await hash(data.password, 10);

      const newCounter = {
        counterId: id,
        counterName: data.counterName,
        email: data.email,
        password: hashedPassword,
        service: data.service,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        uid: user.uid,
      };

      await addDoc(collection(db, "counters"), newCounter);

      reset();
      onClose();
      onCounterAdded(newCounter);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <>
      <Button onPress={onOpen} className="bg-[#908fe2] text-white">
        + Add Counter
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} className="bg-[#F8F8F9] font-[Outfit]">
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader className="flex flex-col gap-1">Add Counter</ModalHeader>
            <ModalBody>
              <Controller
                name="counterName"
                control={control}
                rules={{ required: "Counter Name is required" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    label="Counter Name"
                    variant="bordered"
                    isInvalid={!!errors.counterName}
                    errorMessage={errors.counterName?.message}
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
                    message: "Invalid email address",
                  },
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
                  minLength: { value: 6, message: "Password must be at least 6 characters" },
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
              <Controller
                name="service"
                control={control}
                rules={{ required: "Service is required" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Select Service"
                    variant="bordered"
                    isInvalid={!!errors.service}
                    errorMessage={errors.service?.message}
                  >
                    {services.map((service) => (
                      <SelectItem key={service.name} value={service.name}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </Select>
                )}
              />
            </ModalBody>
            <ModalFooter>
              <Button onPress={onClose} className="w-full bg-slate-400">
                Close
              </Button>
              <Button type="submit" className="w-full bg-[#6e71d6]">
                Submit
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
