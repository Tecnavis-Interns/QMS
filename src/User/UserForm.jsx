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
import { collection, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db, submitDataToFirestore } from "../firebase";
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument, rgb } from 'pdf-lib';

export default function UserForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [userData, setUserData] = useState([]);

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

    let counter = '';
    let tokenPrefix = '';
    let tokenNumber = '';

    switch (service) {
      case 'Personal Service (Income, Community, Nativity, etc)':
      case 'Education Related Service':
        counter = 'Counter 1';
        tokenPrefix = 'A';
        break;
      case 'Home related Service':
      case 'Land Related Service':
        counter = 'Counter 2';
        tokenPrefix = 'B';
        break;
      case 'Other Services':
        counter = 'Counter 3';
        tokenPrefix = 'C';
        break;
      default:
        counter = 'Counter 3';
        tokenPrefix = 'C';
        break;
    }

    try {
      const collectionName = 'requests';
      const querySnapshot = await getDocs(collection(db, collectionName));
      const usersInCounter = querySnapshot.docs.filter(doc => doc.data().counter === counter);

      if (usersInCounter.length > 0) {
        const lastTokenNumber = usersInCounter.reduce((max, doc) => {
          const currentTokenNumber = parseInt(doc.data().token.replace(tokenPrefix, ''));
          return currentTokenNumber > max ? currentTokenNumber : max;
        }, 0);
        tokenNumber = tokenPrefix + (lastTokenNumber + 1);
      } else {
        tokenNumber = tokenPrefix + 1;
      }

      const userId = uuidv4();
      await submitDataToFirestore(collectionName, {
        id: userId,
        name: name,
        phone: phone,
        service: service,
        counter: counter,
        token: tokenNumber
      });

      // Generate PDF with token number
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
      const fontSize = 19.2; // 20% smaller font size
      const textHeight = fontSize + 10;

      // Draw header
      page.drawText("Queue Management System by Tecnavis", {
        x: width /2 - 200, // Adjust as needed
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "requests"));
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUserData(data);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();

    const unsubscribe = onSnapshot(collection(db, "requests"), (snapshot) => {
      const updatedData = snapshot.docs.map((doc) => doc.data());
      const uniqueCounters = Array.from(new Set(updatedData.map(user => user.counter)));
      const usersPerCounter = uniqueCounters.reduce((acc, counter) => {
        const userInCounter = updatedData.find(user => user.counter === counter);
        if (userInCounter) acc.push(userInCounter);
        return acc;
      }, []);
      setUserData(usersPerCounter);
    });

    return () => unsubscribe();
  }, []);

  const handleRemoveUser = async (id) => {
    try {
      await db.collection("requests").doc(id).delete();
      const updatedData = await getDocs(collection(db, "requests"), orderBy("date", "desc"));
      const uniqueCounters = Array.from(new Set(updatedData.docs.map(doc => doc.data().counter)));
      const usersPerCounter = uniqueCounters.reduce((acc, counter) => {
        const userInCounter = updatedData.docs.find(doc => doc.data().counter === counter);
        if (userInCounter) acc.push(userInCounter.data());
        return acc;
      }, []);
      setUserData(usersPerCounter);
    } catch (error) {
      console.error("Error removing document: ", error);
    }
  };

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
