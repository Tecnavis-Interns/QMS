import { useEffect, useState } from "react";
import { Button } from "@nextui-org/react";
import { useNavigate, useLocation } from "react-router-dom";
import { PDFDocument, rgb } from 'pdf-lib';
import { Card, CardHeader, CardBody } from "@nextui-org/card";

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tokenNumber } = location.state;
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!tokenNumber) {
      console.warn("Token number is not available");
      navigate("/userForm");
      return;
    }

    // Automatically generate and download PDF
    generateAndDownloadPDF();

    // Start the countdown
    const timer = setInterval(() => {
      setCountdown((prevCount) => prevCount - 1);
    }, 1000);

    // Redirect after 5 seconds
    const redirect = setTimeout(() => {
      navigate("/userForm");
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [tokenNumber, navigate]);

  const generatePDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 472]);
    const { width, height } = page.getSize();
    
    page.drawText("Queue Management System", {
      x: width / 2 - 200,
      y: height - 100,
      size: 24,
      color: rgb(0, 0, 0),
    });

    page.drawText(String(tokenNumber), {
      x: width / 2 - 40,
      y: height / 2,
      size: 35,
      color: rgb(0, 0, 0),
    });

    return await pdfDoc.save();
  };

  const downloadPDF = (pdfBytes, fileName) => {
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(pdfBlob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const generateAndDownloadPDF = async () => {
    try {
      const pdfBytes = await generatePDF();
      downloadPDF(pdfBytes, 'token.pdf');
    } catch (error) {
      console.error("Error generating PDF: ", error);
      alert("There was an error generating the PDF. Please try again.");
    }
  };

  const handleReturn = () => {
    navigate("/userForm");
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
            <p className="mb-4">Redirecting to home in {countdown} seconds...</p>
          </div>
          <div className="flex flex-col justify-center items-center space-y-4">
            <Button className="bg-[#6e71d6] text-white w-64 py-3 text-lg" onClick={generateAndDownloadPDF}>
              Download Token Again
            </Button>
            <Button className="bg-[#6e71d6] text-white w-48 py-3 text-lg" onClick={handleReturn}>
              Return
            </Button>
          </div>
        </CardBody>
      </Card>  
    </div>
  );
}