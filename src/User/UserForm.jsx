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
import { collection, getDocs, onSnapshot, doc as firestoreDoc, setDoc, getDoc } from "firebase/firestore";
import { db, submitDataToFirestore } from "../firebase";
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument, rgb } from 'pdf-lib';

export default function UserForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [userData, setUserData] = useState([]);
  const [lastTokenNumber, setLastTokenNumber] = useState(0);
  const [counters, setCounters] = useState([]);

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
    const fetchLastTokenNumber = async () => {
      try {
        const tokenDocRef = firestoreDoc(db, "tokens", "lastToken");
        const tokenDocSnap = await getDoc(tokenDocRef);
        const lastToken = tokenDocSnap.exists() ? parseInt(tokenDocSnap.data().lastTokenNumber) || 0 : 0;
        setLastTokenNumber(lastToken);
      } catch (error) {
        console.error("Error fetching last token number: ", error);
      }
    };

    fetchLastTokenNumber();
  }, []);

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "counter"));
        const countersData = querySnapshot.docs.map((doc) => doc.data());
        setCounters(countersData);
      } catch (error) {
        console.error("Error fetching counters: ", error);
      }
    };

    fetchCounters();
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "requests"));
        const requestsData = querySnapshot.docs.map((doc) => doc.data());
        setUserData(requestsData);
      } catch (error) {
        console.error("Error fetching requests: ", error);
      }
    };

    const unsubscribeRequests = onSnapshot(collection(db, "requests"), (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => doc.data());
      setUserData(requestsData);
    });

    return () => {
      unsubscribeRequests();
    };
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
      // Generate the token number
      const tokenNumber = await generateTokenNumber();

      const userId = uuidv4();
      await submitDataToFirestore('requests', {
        id: userId,
        name: name,
        phone: phone,
        service: service,
        counter: tokenNumber.counter,
        token: tokenNumber.token
      });

      generatePDF(tokenNumber.token);

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

      const tokenString = userTokenNumber.toString();

      page.drawText(tokenString, {
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
  // Inside generateTokenNumber function
  const generateTokenNumber = async () => {
    try {
      // Increment the last token number by 1
      const newTokenNumber = lastTokenNumber + 1;

      // Randomly select a counter from the counters array
      const randomCounterIndex = Math.floor(Math.random() * counters.length);
      const randomCounter = counters[randomCounterIndex].counterName;

      // Update the last token number in the "tokens" collection
      const tokenDocRef = firestoreDoc(db, "tokens", "lastToken");
      await setDoc(tokenDocRef, { lastTokenNumber: newTokenNumber.toString() }, { merge: true });

      return { token: newTokenNumber.toString(), counter: randomCounter };
    } catch (error) {
      console.error("Error generating token number: ", error);
      return "";
    }
  };


  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />
      <div className="flex flex-1 justify-center flex-wrap md:mx-64 mx-2 md:py-10 py-5">
        <div className="md:min-w-[50%] min-w-full px-5 flex flex-col items-center justify-center md:p-10 gap-4">
          <h2 className="font-semibold md:text-xl">Create a request</h2>
          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
            <Input type="text" label="Name" value={name} onChange={handleNameChange} required autoComplete="off" id="name" variant="bordered" />
            <Input type="tel" label="Phone" value={phone} onChange={handlePhoneChange} required autoComplete="off" id="phone" variant="bordered" />
            <Select label="Select your Reason to be here" onChange={handleServiceChange} required variant="bordered" >
              {services.map((item) => (
                <SelectItem className="font-[Outfit]" value={item} key={item} d>{item}</SelectItem>
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
                    <TableCell>{user.counter}</TableCell>
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
