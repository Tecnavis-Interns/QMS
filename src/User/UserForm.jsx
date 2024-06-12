import { useState, useEffect } from "react";
import { Input, Button, Select, SelectItem } from "@nextui-org/react";
import Navbar from "../Components/Navbar";
import { collection, getDocs, doc as firestoreDoc, setDoc, getDoc } from "firebase/firestore";
import { db, submitDataToFirestore } from "../firebase";
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument, rgb } from 'pdf-lib';
import { useNavigate } from "react-router-dom";
import {RadioGroup, Radio} from "@nextui-org/radio";

export default function UserForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (showToken) {
      const timeout = setTimeout(() => {
        setShowToken(false); // Hide the token after 2 seconds
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [showToken]);

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handlePhoneChange = (event) => {
    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
  };

  const handleServiceChange = (event) => {
    setService(event.target.value);
  };

  const services = ['Personal Service (Income, Community, Nativity, etc)', 'Home related Service', 'Land Related Service', 'Education Related Service', 'Other Services'];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (phone.length < 10) {
      alert("Please enter a 10 digit Phone Number");
      return;
    }

    if (name === "") {
      alert("Please Enter your name.")
      return;
    }

    if (service === "") {
      alert("Please select a service.")
      return;
    }

    try {
      const counterSnapshot = await getDocs(collection(db, "counter"));
      let counterName = "";
      counterSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.service === service) {
          counterName = data.counterName;
        }
      });

      const tokenNumber = await generateTokenNumber(counterName);
      setToken(tokenNumber);
      setShowToken(true); // Set to true to show the token

      const userId = uuidv4();
      await submitDataToFirestore('requests', {
        id: userId,
        name: name,
        phone: phone,
        service: service,
        counter: counterName,
        token: tokenNumber
      });

      await submitDataToFirestore(counterName, {
        id: userId,
        name: name,
        phone: phone,
        service: service,
        counter: counterName,
        token: tokenNumber
      });

      navigate(`/confirmation`, { state: { tokenNumber } }); // Pass tokenNumber to ConfirmationPage

      // Reset form fields
      setName("");
      setPhone("");
      setService("");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const generateTokenNumber = async (counterName) => {
    try {
      const counterDocRef = firestoreDoc(db, "counter", counterName);
      const counterDocSnap = await getDoc(counterDocRef);
      let lastTokenNumber = counterDocSnap.exists() ? counterDocSnap.data().lastTokenNumber || 0 : 0;
  
      let newTokenNumber;
      switch (counterName) {
        case "Counter 1":
          newTokenNumber = "A" + (lastTokenNumber + 1);
          break;
        case "Counter 2":
          newTokenNumber = "B" + (lastTokenNumber + 1);
          break;
        case "Counter 3":
          newTokenNumber = "C" + (lastTokenNumber + 1);
          break;
        case "Counter 4":
          newTokenNumber = "D" + (lastTokenNumber + 1);
          break;
        case "Counter 5":
          newTokenNumber = "E" + (lastTokenNumber + 1);
          break;
        default:
          newTokenNumber = "";
      }
  
      await setDoc(counterDocRef, { lastTokenNumber: lastTokenNumber + 1 }, { merge: true });
  
      return newTokenNumber;
    } catch (error) {
      console.error("Error generating token number: ", error);
      return "";
    }
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <div className="flex flex-1 justify-center flex-wrap lg:mx-10">
        <div className="md:min-w-[50%] min-w-full px-5 flex flex-col items-center justify-center md:p-10 gap-4">
          <h2 className="font-semibold md:text-xl">Create a request</h2>
          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
            <Input type="text" label="Name" value={name} onChange={handleNameChange} required autoComplete="off" id="name" variant="bordered" />
            <Input type="tel" label="Phone" value={phone} onChange={handlePhoneChange} required autoComplete="off" id="phone" variant="bordered" />
            <RadioGroup
              label="Select your Reason to be here"
              onChange={handleServiceChange}
              value={service}
            >
              {services.map((item) => (
                <Radio className="font-[Outfit]" value={item} key={item}>{item}</Radio>
              ))}
            </RadioGroup>

            <Button className="bg-[#6236F5] text-white w-full" type="submit">Submit</Button>
          </form>
        </div>
      </div>
    </div>
  );
}