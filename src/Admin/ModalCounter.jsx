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
import { v4 as uuidv4 } from "uuid";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { hash } from "bcryptjs";

export default function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [counterName, setCounterName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  // const [staff, setStaff] = useState([]);
  // const [staffId, setStaffId] = useState("");
  // const [filteredStaff, setFilteredStaff] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      const servicesCollection = collection(db, "services");
      const servicesSnapshot = await getDocs(servicesCollection);
      const servicesList = servicesSnapshot.docs.map(doc => doc.data());

      const mappedServices = servicesList.map((service, index) => ({
        id: `service${index + 1}`,
        name: service.name
      }));

      setServices(mappedServices);
    };

    fetchServices();
  }, []);

  // useEffect(() => {
  //   const fetchStaff = async () => {
  //     const staffCollection = collection(db, "staff");
  //     const staffSnapshot = await getDocs(staffCollection);
  //     const staffList = staffSnapshot.docs.map(doc => doc.data());

  //     const mappedStaff = staffList.map((staffMember, index) => ({
  //       id: `staff${index + 1}`,
  //       name: staffMember.name,
  //       service: staffMember.service
  //     }));

  //     setStaff(mappedStaff);
  //   };

  //   fetchStaff();
  // }, []);

  const handleSubmit = async () => {
    try {
      const id = uuidv4();
      const hashedPassword = await hash(password, 10);
      const type = selectedServices.length > 1 ? "multipleQueueService" : "singleQueueService";

      await addDoc(collection(db, "counters"), {
        counterId: id,
        counterName,
        email,
        password: hashedPassword,
        serviceIds: selectedServices,
        // staffId,
        type,
        status: "active",
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });

      // Clear form fields after submission
      setCounterName("");
      setEmail("");
      setPassword("");
      setSelectedServices([]);
      // setStaffId("");
      // setFilteredStaff([]);

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleServiceChange = (event) => {
    const selectedServiceId = event.target.value;
    setSelectedServices([selectedServiceId]);
    // const selectedServiceName = services.find(
    //   (service) => service.id === selectedServiceId
    // ).name;

    // const filtered = staff.filter((s) => s.service === selectedServiceName);

    console.log("Selected Service ID:", selectedServiceId);
    // console.log("Selected Service Name:", selectedServiceName);
    // console.log("Filtered Staff:", filtered);

    // setFilteredStaff(filtered);
  };

  // const handleStaffChange = (event) => {
  //   setStaffId(event.target.value);
  // };

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
            <Select
              label="Select your Reason to be here"
              onChange={(value) => handleServiceChange(value)}
              required
              variant="bordered"
            >
              {services.map((item) => (
                <SelectItem className="font-[Outfit]" value={item.name} key={item.name}>
                  {item.name}
                </SelectItem>
              ))}
            </Select>
            {/* <Select
              label="Select staff"
              onChange={handleStaffChange}
              required
              variant="bordered"
              isDisabled={!selectedServices.length}
            >
              {filteredStaff.map((item) => (
                <SelectItem className="font-[Outfit]" value={item.id} key={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </Select> */}
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