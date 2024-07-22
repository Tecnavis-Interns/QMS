import { useState, useEffect } from "react";
import { Input, Button, Radio, RadioGroup } from "@nextui-org/react";
import Navbar from "../Components/Navbar";
import { collection, doc as firestoreDoc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp, getDocs } from "firebase/firestore";
import { db, submitDataToFirestore } from "../firebase";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";

export default function UserForm() {
  const [name, setName] = useState("");
  const [service, setService] = useState("");
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesCollection = collection(db, "services");
        const servicesSnapshot = await getDocs(servicesCollection);
        const servicesList = servicesSnapshot.docs.map(doc => doc.data().name);
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

  const handleServiceChange = (value) => {
    setService(value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (name === "") {
      alert("Please Enter your name.");
      return;
    }
  
    if (service === "") {
      alert("Please select a service.");
      return;
    }
  
    try {
      const tokenNumber = await generateTokenNumber();
      const userId = uuidv4();
  
      const requestData = {
        userId: userId,
        name: name,
        service: service,
        tokenNumber: tokenNumber,
        createdAt: serverTimestamp(),
        status: true
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
        <div className="md:min-w-[40%] min-w-full px-5 flex flex-col items-center justify-center md:p-10 gap-4">
          <h2 className="font-semibold md:text-xl">Create a request</h2>
          <form onSubmit={handleSubmit} className="flex flex-col w-[27rem] gap-4">
            <Input
              type="text"
              label="Name"
              value={name}
              onChange={handleNameChange}
              required
              autoComplete="off"
              id="name"
              variant="bordered"
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
            <Button className="bg-[#6e71d6] text-white w-[27rem]" type="submit">
              Submit
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
  
  
}