import { useState, useEffect } from "react";
import { Input, Button } from "@nextui-org/react";
import Navbar from "../Components/Navbar";
import { collection, getDocs, doc as firestoreDoc, setDoc, getDoc } from "firebase/firestore";
import { db, submitDataToFirestore } from "../firebase";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";
import {RadioGroup, Radio} from "@nextui-org/radio";

export default function UserForm() {
  const [name, setName] = useState("");
  //const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (showToken) {
      const timeout = setTimeout(() => {
        setShowToken(false); // Hide the token after 3 seconds
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [showToken]);

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

 /* const handlePhoneChange = (event) => {
    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
  };
  */

  const handleServiceChange = (event) => {
    setService(event.target.value);
  };

  const services = ['Personal Service (Income, Community, Nativity, etc)', 'Home related Service', 'Land Related Service', 'Education Related Service', 'Other Services'];

  const handleSubmit = async (event) => {
    event.preventDefault();
    /* 
    if (phone.length < 10) {
      alert("Please enter a 10 digit Phone Number");
      return;
    } 
    */

    if (name === "") {
      alert("Please Enter your name.");
      return;
    }

    if (service === "") {
      alert("Please select a service.");
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

      if (!counterName) {
        throw new Error("No matching counter found for the selected service.");
      }

      const tokenNumber = await generateTokenNumber(counterName);
      setToken(tokenNumber);
      setShowToken(true);

      const userId = uuidv4();
      await submitDataToFirestore('requests', {
        id: userId,
        name: name,
        //phone: phone,
        service: service,
        counter: counterName,
        token: tokenNumber
      });

      await submitDataToFirestore(counterName, {
        id: userId,
        name: name,
        //phone: phone,
        service: service,
        counter: counterName,
        token: tokenNumber
      });

      navigate("/confirmation", { state: { tokenNumber } });

      // Reset form fields
      setName("");
      //setPhone("");
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
          throw new Error("Invalid counter name");
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
        <div className="md:min-w-[40%] min-w-full px-5 flex flex-col items-center justify-center md:p-10 gap-4">
          <h2 className="font-semibold md:text-xl">Create a request</h2>
          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
            <Input type="text" label="Name" value={name} onChange={handleNameChange} required autoComplete="off" id="name" variant="bordered" />
            <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
            <label className="font-medium">Select your Reason to be here:</label>
            <div className="flex flex-col gap-2">
              {services.map((item) => (
                <label key={item} className={`radio-button ${service === item ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value={item}
                    checked={service === item}
                    onChange={handleServiceChange}
                    className="hidden"
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
          </div>
            <Button className="bg-[#6236F5] text-white w-full" type="submit">Submit</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
