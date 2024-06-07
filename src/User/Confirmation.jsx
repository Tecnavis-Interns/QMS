import { useEffect, useRef, useState } from "react";
import { Button } from "@nextui-org/react";
import { useNavigate, useLocation } from "react-router-dom";
import { PDFDocument, rgb } from 'pdf-lib';
import { Card, CardHeader, CardBody } from "@nextui-org/card";

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tokenNumber } = location.state; // Retrieve tokenNumber from location state
  const downloadTimeoutRef = useRef(null); // Ref for the download timeout
  const [downloaded, setDownloaded] = useState(false); // State to track if token is downloaded
  const [remainingTime, setRemainingTime] = useState(15); // Remaining time in seconds

  useEffect(() => {
    // Scroll to the top of the page when the component mounts
    window.scrollTo(0, 0);

    // Set the download timeout
    downloadTimeoutRef.current = setTimeout(() => {
      // Redirect back to the form after 15 seconds if token is not downloaded
      if (!downloaded) {
        showManualDownloadOption();
      }
    }, 15000); // 15 seconds

    // Try to download the token automatically
    downloadTokenPDF();

    // Update remaining time every second
    const interval = setInterval(() => {
      setRemainingTime((prevTime) => prevTime - 1);
    }, 1000);

    return () => {
      clearTimeout(downloadTimeoutRef.current);
      clearInterval(interval);
    };
  }, []);

  const downloadTokenPDF = async () => {
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

      page.drawText(tokenNumber, {
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

      setDownloaded(true); // Set downloaded to true
    } catch (error) {
      console.error("Error generating PDF: ", error);
      showManualDownloadOption(); // Show manual download option if auto download fails
    }
  };

  const showManualDownloadOption = () => {
    clearTimeout(downloadTimeoutRef.current); // Clear the download timeout

    if (!downloaded) {
      alert("Token download failed. Click below to download manually.");
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
            <Button className="bg-[#6236F5] text-white w-64 py-3 text-lg" onClick={downloadTokenPDF}>
              Download Token
            </Button>
            <Button className="bg-[#6236F5] text-white w-64 py-3 text-lg" onClick={() => navigate("/userForm")}>
              Go Back Home
            </Button>
            {remainingTime > 0 && (
              <p className="text-sm text-gray-500">This page will redirect in {remainingTime} seconds</p>
            )}
            {!downloaded && (
              <p className="text-sm text-gray-500">
                If the token has not downloaded, click below to download manually.
              </p>
            )}
          </div>
        </CardBody>
      </Card>  
    </div>
  );
}
