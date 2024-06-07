import { useState, useEffect, useRef } from "react";
import { Input, Button } from "@nextui-org/react";
import Navbar from "../Components/Navbar";
import { collection, getDocs, doc as firestoreDoc, setDoc, getDoc } from "firebase/firestore";
import { db, submitDataToFirestore } from "../firebase";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";

export default function UserForm() {
  const [name, setName] = useState("");
  const [services, setServices] = useState([]);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const navigate = useNavigate();
  
  const submissionTimerRef = useRef(null); // Ref for the form submission timer

  useEffect(() => {
    if (showToken) {
      const timeout = setTimeout(() => {     
        setShowToken(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [showToken]);

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleServiceChange = (event) => {
    const value = event.target.value;
    const checked = event.target.checked;
    if (checked) {
      setServices([...services, value]);
    } else {
      setServices(services.filter((service) => service !== value));
    }
  };

  const servicesList = [
    'Personal Service (Income, Community, Nativity, etc)',
    'Home related Service',
    'Land Related Service',
    'Education Related Service',
    'Other Services'
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (name === "") {
      alert("Please Enter your name.")
      return;
    }

    if (services.length === 0) {
      alert("Please select at least one service.");
      return;
    }

    try {
      const counterSnapshot = await getDocs(collection(db, "counter"));
      let counterName = "";
      counterSnapshot.forEach(doc => {
        const data = doc.data();
        if (services.includes(data.service)) {
          counterName = data.counterName;
        }
      });

      const tokenNumber = await generateTokenNumber(counterName);
      setToken(tokenNumber);
      setShowToken(true);

      const userId = uuidv4();
      await submitDataToFirestore('requests', {
        id: userId,
        name: name,
        services: services,
        counter: counterName,
        token: tokenNumber
      });

      await submitDataToFirestore(counterName, {
        id: userId,
        name: name,
        services: services,
        counter: counterName,
        token: tokenNumber
      });

      navigate(`/confirmation`, { state: { tokenNumber } });

      setName("");
      setServices([]);
      
      // Set the submission timer
      submissionTimerRef.current = setTimeout(() => {
        navigate("/userForm"); // Redirect back to the form
      }, 15000); // 15 seconds
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
            <div className="flex flex-col gap-2">
              <label className="font-medium">Select your Reason to be here:</label>
              {servicesList.map((item) => (
                <label key={item} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="service"
                    value={item}
                    checked={services.includes(item)}
                    onChange={handleServiceChange}
                  />
                  <Button
                    onClick={() => handleServiceChange({ target: { value: item, checked: !services.includes(item) } })}
                    className={`w-full ${services.includes(item) ? 'bg-[#6236F5] text-white' : 'bg-gray-200 text-black'}`}
                  >
                    {item}
                  </Button>
                </label>
              ))}
            </div>
            <Button className="bg-[#6236F5] text-white w-full" type="submit">Submit</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
