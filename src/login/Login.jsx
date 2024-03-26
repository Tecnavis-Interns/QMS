import React from "react";
import Navbar from "./Navbar";
import { Card, CardHeader, CardBody, CardFooter, Input, Button } from "@nextui-org/react";

const Login = () => {
  return (
    <div className="md:mx-64 mx-2 md:py-10 py-5 flex flex-col min-h-screen min-w-screen">
      <Navbar />
      <div className="flex flex-1 items-center justify-center">
        <Card className="p-5 min-w-96">
          <CardHeader className="justify-center">
            <h2 className="font-semibold">Please Login Here</h2>
          </CardHeader>
          <CardBody className="gap-5">
            <Input type="email" label="Email" />
            <Input type="password" label="Password" />
            <Button className="bg-[#6236F5] text-white">Submit</Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Login;
