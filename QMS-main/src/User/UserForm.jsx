import { useState, useEffect } from "react";
import {
  Input,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
} from "@nextui-org/react";
import Navbar from "../Components/Navbar";
import { collection, getDocs, onSnapshot, orderBy, query, where, doc as firestoreDoc, setDoc, getDoc } from "firebase/firestore";
import { db, submitDataToFirestore } from "../firebase";
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument, rgb } from 'pdf-lib';

export default function UserForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [userData, setUserData] = useState([]);
  const [counter, setCounter] = useState([]);
  const [lastTokenNumbers, setLastTokenNumbers] = useState({
    "Counter 1": 0,
    "Counter 2": 0,
    "Counter 3": 0,
    "Counter 4": 0,
    "Counter 5": 0,
  });

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

  useEffect(() => {
    const fetchLastTokenNumbers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "counter"));
        const countersData = querySnapshot.docs.map((doc) => doc.data());
        setCounter(countersData);

        // Fetch last token numbers from the counter collection and update state
        const lastTokenNumbers = {};
        querySnapshot.forEach((doc) => {
          lastTokenNumbers[doc.data().counterName] = doc.data().lastTokenNumber;
        });
        setLastTokenNumbers(lastTokenNumbers);
      } catch (error) {
        console.error("Error fetching counters and last token numbers: ", error);
      }
    };

    fetchLastTokenNumbers();
  }, []);

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
      const counterSnapshot = await getDocs(query(collection(db, "counter"), where("service", "==", service)));
      let counterName = "";
      if (!counterSnapshot.empty) {
        counterName = counterSnapshot.docs[0].data().counterName;
      }

      // Generate the token number and await its result
      const tokenNumber = await generateTokenNumber(counterName);

      const userId = uuidv4();
      await submitDataToFirestore('requests', {
        id: userId,
        name: name,
        phone: phone,
        service: service,
        counter: counterName,
        token: tokenNumber
      });

      generatePDF(tokenNumber);

      setName("");
      setPhone("");
      setService("");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };


  const generatePDF = async (userTokenNumber) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 472]);
      const { width, height } = page.getSize();
      const fontSize = 19.2;
      const textHeight = fontSize + 10;

      page.drawText("Queue Management System by Tecnavis", {
        x: width / 2 - 200,
        y: height - 100,
        size: 24,
        color: rgb(0, 0, 0),
      });

      page.drawText(userTokenNumber, {
        x: width / 2 - 40,
        y: height / 2,
        size: 35,
        color: rgb(0, 0, 0),
      });

      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(pdfBlob);
      a.download = 'token.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error generating PDF: ", error);
    }
  };

  const generateTokenNumber = async (counterName) => {
    try {
      // Fetch the counter document from Firestore
      const counterDocRef = firestoreDoc(db, "counter", counterName);
      const counterDocSnap = await getDoc(counterDocRef);
  
      // Get the current last token number from Firestore
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
  
      // Update the last token number in the counter collection
      await setDoc(counterDocRef, { lastTokenNumber: lastTokenNumber + 1 }, { merge: true });
  
      return newTokenNumber;
    } catch (error) {
      console.error("Error generating token number: ", error);
      return "";
    }
  };
  


  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "counter"));
      const countersData = querySnapshot.docs.map((doc) => doc.data());
      setCounter(countersData);
    } catch (error) {
      console.error("Error fetching counters: ", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const querySnapshot = await getDocs(query(collection(db, "requests"), orderBy("date", "asc")));
        const updatedData = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

        // Fetch counterName for each user
        const requestsWithCounterName = await Promise.all(updatedData.map(async (user) => {
          const counterSnapshot = await getDocs(query(collection(db, "counter"), where("counterName", "==", user.counter)));
          const counterData = counterSnapshot.docs.map((doc) => doc.data());
          const counterName = counterData.length > 0 ? counterData[0].counterName : "";
          return { ...user, counterName };
        }));

        // Group users by counter
        const groupedByCounter = requestsWithCounterName.reduce((acc, user) => {
          if (!acc[user.counter]) {
            acc[user.counter] = user;
          }
          return acc;
        }, {});

        // Extract values from the grouped object
        const usersPerCounter = Object.values(groupedByCounter);

        setUserData(usersPerCounter);
      } catch (error) {
        console.error("Error fetching requests: ", error);
      }
    };

    const fetchCounters = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "counter"));
        const countersData = querySnapshot.docs.map((doc) => doc.data());
        setCounter(countersData);
      } catch (error) {
        console.error("Error fetching counters: ", error);
      }
    };

    fetchRequests();
    fetchCounters();

    const unsubscribeRequests = onSnapshot(collection(db, "requests"), fetchRequests);
    const unsubscribeCounters = onSnapshot(collection(db, "counter"), fetchCounters);

    return () => {
      unsubscribeRequests();
      unsubscribeCounters();
    };
  }, []);

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
        <div className="md:min-w-[50%] min-w-full px-5 flex flex-col items-center justify-center md:p-10 gap-4">
          <h2 className="font-semibold md:text-xl">Current Queue</h2>
          <div className="overflow-auto w-full md:min-h-64 md:max-h-64">
            <Table aria-label="Example static collection table" removeWrapper isHeaderSticky isStriped className="h-full">
              <TableHeader>
                {/* <TableColumn>Sl. no.</TableColumn> */}
                <TableColumn>Token Number</TableColumn>
                <TableColumn>Counter</TableColumn>
              </TableHeader>
              <TableBody>
                {userData.map((user, index) => (
                  <TableRow key={index}>
                    {/* <TableCell>{index + 1}</TableCell> */}
                    <TableCell>{user.token}</TableCell>
                    <TableCell>{user.counterName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
