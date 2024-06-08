import { useState, useEffect } from "react";
import { Input, Button, Select, SelectItem } from "@nextui-org/react";
import Navbar from "../Components/Navbar";
import { doc as firestoreDoc, getDoc, collection, setDoc, writeBatch, doc, getDocs } from "firebase/firestore";
import { db, submitDataToFirestore } from "../firebase";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";

export default function UserForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handlePhoneChange = (event) => {
    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
  };

  const handleServiceChange = (event) => {
    setService(event.target.value);
  };

  const services = [
    'Personal Service (Income, Community, Nativity, etc)',
    'Home related Service',
    'Land Related Service',
    'Education Related Service',
    'Other Services'
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (phone.length < 10) {
      alert("Please enter a 10 digit Phone Number");
      return;
    }
  
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
      setToken(tokenNumber);
  
      const userId = uuidv4();
      await submitDataToFirestore(`SingleQueue`, {
        id: userId,
        name: name,
        phone: phone,
        service: service,
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
    

  const generateTokenNumber = async () => {
    try {
      const counterDocRef = firestoreDoc(db, "globalCounter", "counter");
      const counterDocSnap = await getDoc(counterDocRef);
      let lastTokenNumber = counterDocSnap.exists() ? counterDocSnap.data().lastTokenNumber || 0 : 0;

      let newTokenNumber = lastTokenNumber + 1;

      await setDoc(counterDocRef, { lastTokenNumber: newTokenNumber }, { merge: true });

      return newTokenNumber.toString();
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