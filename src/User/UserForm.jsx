// Import necessary modules
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

// Define the UserForm component
export default function UserForm() {
  // State variables
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [userData, setUserData] = useState([]);

  // Event handlers for form inputs
  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handlePhoneChange = (event) => {
    setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
  };

  const handleServiceChange = (event) => {
    setService(event.target.value);
  };

  // Array of service options
  const services = ['Personal Service (Income, Community, Nativity, etc)', 'Home related Service', 'Land Related Service', 'Education Related Service', 'Other Services'];

  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    // Validate form inputs
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

    // Generate PDF with token number
    generatePDF();
    
    // Handle form submission as before...
  };

  // Function to generate PDF with token number
  const generatePDF = async () => {
    try {
      // Get the token number assigned to the user upon form submission
      const userTokenNumber = user.token; // Replace with the actual token number from your state or data source

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Add a new page to the document
      const page = pdfDoc.addPage([250, 150]); // Specify page size (width, height)

      // Add the token number to the PDF
      page.drawText(userTokenNumber, {
        x: 50,
        y: 100,
        size: 24,
        color: rgb(0, 0, 0), // Black color
      });

      // Convert the PDF document to bytes
      const pdfBytes = await pdfDoc.save();

      // Create a Blob from the PDF bytes
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      // Create a download link
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

  // useEffect hook to fetch data and update state
  useEffect(() => {
    // Fetch data and update state...
  }, []);

  // JSX code for rendering the component
  return (
    <div className="md:mx-64 mx-2 md:py-10 py-5 flex flex-col min-h-dvh">
      {/* Navbar component */}
      <Navbar />
      {/* Form and queue display */}
      <div className="flex flex-1 justify-center flex-wrap">
        {/* Form section */}
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
        {/* Queue display section */}
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
                {/* Iterate over userData array to display each user's data */}
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
