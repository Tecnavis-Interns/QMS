import { useState, useEffect } from "react";
import { Input, Radio, RadioGroup } from "@nextui-org/react";
import Navbar from "./Navbar";
import { collection, doc as firestoreDoc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp, getDocs } from "firebase/firestore";
import { db, submitDataToFirestore } from "../../services/firebase";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";
import { onSnapshot } from "firebase/firestore";

export default function UserForm() {
  const [name, setName] = useState("");
  const [service, setService] = useState("");
  const [services, setServices] = useState([]);
  const [nameError, setNameError] = useState("");
  const [serviceError, setServiceError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const servicesCollection = collection(db, "services");
  
    const unsubscribe = onSnapshot(servicesCollection, (snapshot) => {
      try {
        const servicesList = snapshot.docs.map(doc => doc.data().name);
        setServices(servicesList);
      } catch (error) {
        console.error("Error processing services data: ", error);
      }
    }, (error) => {
      console.error("Error fetching services: ", error);
    });
  
    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const handleNameChange = (event) => {
    const newName = event.target.value;
    setName(newName);
    
    if (/[^a-zA-Z\s]/.test(newName)) {
      setNameError("Please avoid symbols");
    } else {
      setNameError("");
    }
  };

  const handleServiceChange = async (value) => {
    setService(value);
    setServiceError("");

    if (name.trim() === "") {
      setNameError("Please enter your name.");
      return;
    }

    if (/[^a-zA-Z\s]/.test(name)) {
      setNameError("Please avoid symbols");
      return;
    }

    try {
      await handleSubmit(value);
    } catch (error) {
      console.error("Error submitting form: ", error);
    }
  };

  const handleSubmit = async (selectedService) => {
    try {
      const tokenNumber = await generateTokenNumber(selectedService);
      const userId = uuidv4();
  
      const requestData = {
        userId: userId,
        name: name.trim(),
        service: selectedService,
        tokenNumber: tokenNumber,
        createdAt: serverTimestamp(),
        status: true,
        transfer: false,
        waitingTime: "00:00:00"  // Initialize with 00:00:00
      };
  
      // Submit data to the 'requests' collection
      await submitDataToFirestore('requests', requestData);
  
      // Submit the same data to the 'ChartData' collection
      await submitDataToFirestore('ChartData', requestData);
  
      const queueDocRef = firestoreDoc(db, "queue/queueDoc");
      await updateDoc(queueDocRef, {
        token: arrayUnion(tokenNumber)
      });
  
      navigate(`/confirmation`, { state: { tokenNumber } });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const generateTokenNumber = async (selectedService) => {
    try {
      // First, fetch the custom ID for the selected service
      const servicesCollection = collection(db, "services");
      const serviceQuery = await getDocs(servicesCollection);
      const serviceDoc = serviceQuery.docs.find(doc => doc.data().name === selectedService);
      
      if (!serviceDoc) {
        throw new Error("Service not found");
      }
  
      const serviceCustomId = serviceDoc.data().customId;
      const servicePrefix = serviceCustomId.charAt(0); // Get the first letter of the custom ID
  
      // Now, get the last token number for this service
      const queueDocRef = firestoreDoc(db, "queue/queueDoc");
      const queueDocSnap = await getDoc(queueDocRef);
  
      let lastTokens = queueDocSnap.exists() ? queueDocSnap.data().lastTokens || {} : {};
      let lastTokenNumber = lastTokens[servicePrefix] || 0;
      let newTokenNumber = lastTokenNumber + 1;
  
      // Generate the new token
      const paddedNumber = newTokenNumber.toString().padStart(3, '0');
      const newToken = `${servicePrefix}${paddedNumber}`;
  
      // Update the last token number for this service
      lastTokens[servicePrefix] = newTokenNumber;
      await setDoc(queueDocRef, { lastTokens: lastTokens }, { merge: true });
  
      return newToken;
    } catch (error) {
      console.error("Error generating token number: ", error);
      return "";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 justify-center flex-wrap lg:mx-10">
        <div className="md:min-w-[40%] min-w-full px-5 flex flex-col items-center justify-center md:p-10 gap-4">
          <h2 className="font-semibold md:text-xl">Create a request</h2>
          <div className="flex flex-col w-[27rem] gap-4">
            <Input
              type="text"
              label="Name"
              value={name}
              onChange={handleNameChange}
              required
              autoComplete="off"
              id="name"
              variant="bordered"
              errorMessage={nameError}
              isInvalid={nameError !== ""}
            />
            <RadioGroup
              label="Select your Reason to be here"
              value={service}
              onValueChange={handleServiceChange}
              orientation="horizontal"
              classNames={{
                base: "w-full max-w-md",
                wrapper: "grid grid-cols-3 gap-5 sm:grid-cols-4 md:grid-cols-1"
              }}
              errorMessage={serviceError}
              isInvalid={serviceError !== ""}
            >
              {services.map((item) => (
                <Radio
                  key={item}
                  value={item}
                  classNames={{
                    base: "w-full inline-flex m-0 bg-default hover:bg-default-200 items-center justify-center cursor-pointer rounded-md px-2 py-3 border border-default transition-all duration-200 ease-in-out data-[selected=true]:bg-primary data-[selected=true]:border-primary data-[selected=true]:text-primary-foreground",
                    label: "font-normal text-sm p-0 text-center w-96"
                  }}
                >
                  {item}
                </Radio>
              ))}
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  );
  
  
}