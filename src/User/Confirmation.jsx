import { useEffect } from "react";
import { Button } from "@nextui-org/react";
import { useNavigate, useLocation } from "react-router-dom";
import { PDFDocument, rgb } from 'pdf-lib';
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
export default function ConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tokenNumber } = location.state; // Retrieve tokenNumber from location state

  useEffect(() => {
    window.scrollTo(0, 0);
    console.log("Received token number:", tokenNumber);
    if (!tokenNumber) {
      console.warn("Token number is not available");
    }
  }, [tokenNumber]);

  const handleDownloadPDF = async () => {
    console.log("Download PDF function called");
    try {
      console.log("Creating PDF document");
      const pdfDoc = await PDFDocument.create();
      
      console.log("Adding page to PDF");
      const page = pdfDoc.addPage([612, 472]);
      const { width, height } = page.getSize();
      
      console.log("Drawing text on PDF");
      page.drawText("Queue Management System by Tecnavis", {
        x: width / 2 - 200,
        y: height - 100,
        size: 24,
        color: rgb(0, 0, 0),
      });
  
      console.log("Adding token number to PDF:", tokenNumber);
      console.log("Adding token number to PDF. Token number:", tokenNumber);
      console.log("Token number type:", typeof tokenNumber);

      let textToDisplay = tokenNumber;
      if (tokenNumber === undefined || tokenNumber === null) {
        console.warn("Token number is undefined or null");
        textToDisplay = "No token number";
      } else if (typeof tokenNumber !== 'string') {
        console.warn("Token number is not a string, attempting to convert");
        textToDisplay = String(tokenNumber);
      }

      try {
        page.drawText(textToDisplay, {
          x: width / 2 - 40,
          y: height / 2,
          size: 35,
          color: rgb(0, 0, 0),
        });
        console.log("Token number added successfully");
      } catch (error) {
        console.error("Error drawing text:", error);
        // If drawing fails, try to add a placeholder text
        try {
          page.drawText("Error displaying token", {
            x: width / 2 - 80,
            y: height / 2,
            size: 20,
            color: rgb(1, 0, 0), // Red color
          });
        } catch (innerError) {
          console.error("Failed to draw placeholder text:", innerError);
        }
      }
  
      console.log("Saving PDF");
      const pdfBytes = await pdfDoc.save();
      
      console.log("Creating Blob");
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      console.log("Creating download link");
      const a = document.createElement('a');
      a.href = URL.createObjectURL(pdfBlob);
      a.download = 'token.pdf';
      document.body.appendChild(a);
      
      console.log("Triggering download");
      a.click();
      document.body.removeChild(a);
      
      console.log("Download process completed");
    } catch (error) {
      console.error("Error generating PDF: ", error);
      alert("There was an error generating the PDF. Please check the console for details.");
    }
  };

  return (
    <div className="flex flex-col min-h-dvh justify-center items-center">
      <Card className="py-8 px-6 w-full max-w-lg mx-auto">
        <CardHeader className="pb-0 pt-4 px-6 flex-col items-center">
          <h1 className="font-semibold text-2xl mb-8">Request Submitted Successfully</h1>
        </CardHeader>
        <CardBody className="overflow-visible py-4 px-6">
          <div className="flex flex-col justify-center items-center">
          <p className="mb-8 text-lg font-semibold">Your token number is: {tokenNumber}</p>
          </div>
          <div className="flex flex-col justify-center items-center space-y-4">
            <Button className="bg-[#6e71d6] text-white w-64 py-3 text-lg" onClick={handleDownloadPDF}>
              Download Token
            </Button>
            <Button className="bg-[#6e71d6] text-white w-64 py-3 text-lg" onClick={() => navigate("/userForm")}>
              Go Back Home
            </Button>
          </div>
        </CardBody>
      </Card>  
    </div>
  );
}
