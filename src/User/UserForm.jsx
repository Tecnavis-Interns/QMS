import { useState, useEffect } from "react";
import { Input, Button, Select, SelectItem } from "@nextui-org/react";
import Navbar from "../Components/Navbar";
import { collection, doc as firestoreDoc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp, getDocs } from "firebase/firestore";
import { db, submitDataToFirestore } from "../firebase";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";

export default function UserForm() {
  const [name, setName] = useState("");
  const [service, setService] = useState("");
  const [services, setServices] = useState([]); // State for services
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const navigate = useNavigate();
  const [lastGeneratedToken, setLastGeneratedToken] = useState('');

  useEffect(() => {
    if (showToken) {
      const timeout = setTimeout(() => {
        setShowToken(false); // Hide the token after 2 seconds
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [showToken]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesCollection = collection(db, "services");
        const servicesSnapshot = await getDocs(servicesCollection);
        const servicesList = servicesSnapshot.docs.map(doc => doc.data().name); // Assuming each document has a 'name' field
        setServices(servicesList);
      } catch (error) {
        console.error("Error fetching services: ", error);
      }
    };

    fetchServices();
  }, []);

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleServiceChange = (event) => {
    setService(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (name === "") {
      alert("Please Enter your name.")
      return;
    }

    if (service === "") {
      alert("Please select a service.")
      return;
    }

    try {
      const tokenNumber = await generateTokenNumber();
      setToken(tokenNumber);
      setShowToken(true); // Set to true to show the token
      setLastGeneratedToken(tokenNumber);

      const userId = uuidv4();
      const currentDate = new Date().toISOString();

      // Submit data to 'requests' collection
      await submitDataToFirestore('requests', {
        userId: userId,
        name: name,
        service: service,
        tokenNumber: tokenNumber,
        createdAt: serverTimestamp(),
        status: true
      });

      // Update 'queue' document with the new tokenNumber in the token array
      const queueDocRef = firestoreDoc(db, "queue/queueDoc");
      await updateDoc(queueDocRef, {
        token: arrayUnion(tokenNumber)
      });

      navigate(`/confirmation`, { state: { tokenNumber } }); // Pass tokenNumber to ConfirmationPage

      // Reset form fields
      setName("");
      setService("");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const generateTokenNumber = async () => {
    try {
      const queueDocRef = firestoreDoc(db, "queue/queueDoc");
      const queueDocSnap = await getDoc(queueDocRef);

      let lastTokenNumber = queueDocSnap.exists() ? queueDocSnap.data().lastTokenNumber || 0 : 0;
      let newTokenNumber = lastTokenNumber + 1;

      await setDoc(queueDocRef, { lastTokenNumber: newTokenNumber }, { merge: true });

      return newTokenNumber;
    } catch (error) {
      console.error("Error generating token number: ", error);
      return "";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 justify-center flex-wrap lg:mx-10">
        <div className="md:min-w-[50%] min-w-full px-5 flex flex-col items-center justify-center md:p-10 gap-4">
          <h2 className="font-semibold md:text-xl">Create a request</h2>
          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
            <Input type="text" label="Name" value={name} onChange={handleNameChange} required autoComplete="off" id="name" variant="bordered" />
            <Select label="Select your Reason to be here" onChange={handleServiceChange} required variant="bordered" selectedKeys={[service]}>
              {services.map((item) => (
                <SelectItem className="font-[Outfit]" value={item} key={item}>{item}</SelectItem>
              ))}
            </Select>
            <Button className="bg-[#6236F5] text-white w-full" type="submit">Submit</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
