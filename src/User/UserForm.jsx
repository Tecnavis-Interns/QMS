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
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { db, submitDataToFirestore } from "../firebase";
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument, rgb } from 'pdf-lib';

export default function UserForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [userData, setUserData] = useState([]);
  const [counters, setCounters] = useState([]); // State to store counters

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
      const counterSnapshot = await getDocs(query(collection(db, "counter"), where("service", "==", service))); // Fetch counter data
      let counterName = ""; // Initialize counterName variable
      if (!counterSnapshot.empty) {
        counterName = counterSnapshot.docs[0].data().counterName; // Get counterName from counter data
      }

      const tokenNumber = generateTokenNumber(counterName, counters); // Generate token number dynamically

      const userId = uuidv4();
      await submitDataToFirestore('requests', {
        id: userId,
        name: name,
        phone: phone,
        service: service,
        counter: counterName, // Get the counter name from the counter data
        token: tokenNumber
      });

      // Generate PDF with token number
      generatePDF(tokenNumber);

      // Fetch updated data from Firestore
      const querySnapshot = await getDocs(collection(db, "requests"));
      const updatedData = querySnapshot.docs.map(async (doc) => {
        const userData = doc.data();
        const counterSnapshot = await getDocs(query(collection(db, "counter"), where("service", "==", userData.service)));
        if (!counterSnapshot.empty) {
          userData.counterName = counterSnapshot.docs[0].data().counterName;
        } else {
          userData.counterName = ""; // Set a default value if counterName is not found
        }
        return { id: doc.id, ...userData };
      });
      const resolvedData = await Promise.all(updatedData);
      setUserData(resolvedData);

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
      const fontSize = 19.2; // 20% smaller font size
      const textHeight = fontSize + 10;

      // Draw header
      page.drawText("Queue Management System by Tecnavis", {
        x: width / 2 - 200, // Adjust as needed
        y: height - 100, // Adjust as needed
        size: 24, // Adjust as needed
        color: rgb(0, 0, 0),
      });

      // Draw token number
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

  const generateTokenNumber = (counterName, counters) => {
    console.log("Counter Name:", counterName);

    // Initialize a map to store the last token number for each counter
    const lastTokenNumbers = {
      "Counter 1": 0,
      "Counter 2": 0,
      "Counter 3": 0,
      "Counter 4": 0,
      "Counter 5": 0,
    };

    // Get the last token number for the specified counter
    let lastTokenNumber = lastTokenNumbers[counterName] || 0;

    console.log("Last Token Number:", lastTokenNumber);

    // Increment the last token number for the counter and return the new token number
    let newTokenNumber;
    switch (counterName) {
      case "Counter 1":
        newTokenNumber = "A" + (++lastTokenNumber);
        break;
      case "Counter 2":
        newTokenNumber = "B" + (++lastTokenNumber);
        break;
      case "Counter 3":
        newTokenNumber = "C" + (++lastTokenNumber);
        break;
      case "Counter 4":
        newTokenNumber = "D" + (++lastTokenNumber);
        break;
      case "Counter 5":
        newTokenNumber = "E" + (++lastTokenNumber);
        break;
      default:
        newTokenNumber = "";
    }

    console.log("New Token Number:", newTokenNumber);

    // Update the last token number for the counter
    lastTokenNumbers[counterName] = lastTokenNumber;

    console.log("Updated Last Token Numbers:", lastTokenNumbers);

    return newTokenNumber;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "counter"));
        const countersData = querySnapshot.docs.map((doc) => doc.data());
        setCounters(countersData);
      } catch (error) {
        console.error("Error fetching counters: ", error);
      }
    };

    fetchData(); // Fetch counters when component mounts
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "requests"));
        const data = querySnapshot.docs.map(async (doc) => {
          const userData = doc.data();
          const counterSnapshot = await getDocs(query(collection(db, "counter"), where("service", "==", userData.service)));
          if (!counterSnapshot.empty) {
            userData.counterName = counterSnapshot.docs[0].data().counterName;
          } else {
            userData.counterName = ""; // Set a default value if counterName is not found
          }
          return { id: doc.id, ...userData };
        });
        const resolvedData = await Promise.all(data);
        setUserData(resolvedData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();

    const unsubscribe = onSnapshot(collection(db, "requests"), async (snapshot) => {
      const updatedData = snapshot.docs.map((doc) => doc.data());
      const uniqueCounters = Array.from(new Set(updatedData.map(user => user.counter)));
      const usersPerCounter = uniqueCounters.reduce((acc, counter) => {
        const userInCounter = updatedData.find(user => user.counter === counter);
        if (userInCounter) acc.push(userInCounter);
        return acc;
      }, []);
      setUserData(usersPerCounter);

      try {
        const countersSnapshot = await getDocs(collection(db, "counter"));
        const countersData = countersSnapshot.docs.map((doc) => doc.data());
        setCounters(countersData);
      } catch (error) {
        console.error("Error updating counters: ", error);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="md:mx-64 mx-2 md:py-10 py-5 flex flex-col min-h-dvh">
      <Navbar />
      <div className="flex flex-1 justify-center flex-wrap">
        <div className="md:min-w-[50%] min-w-full px-5 flex flex-col items-center justify-center md:p-10 gap-4">
          <h2 className="font-semibold md:text-xl">Create a request</h2>
          <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
            <Input type="text" label="Name" value={name} onChange={handleNameChange} required autoComplete="off" id="name" />
            <Input type="tel" label="Phone" value={phone} onChange={handlePhoneChange} required autoComplete="off" id="phone" />
            <Select label="Select your Reason to be here" onChange={handleServiceChange} required>
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
                <TableColumn>Sl. no.</TableColumn>
                <TableColumn>Token Number</TableColumn>
                <TableColumn>Counter</TableColumn>
              </TableHeader>
              <TableBody>
                {userData.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
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
