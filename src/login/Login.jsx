import React, { useState } from "react";
import Navbar from "./Navbar";
import { useNavigate } from 'react-router-dom';
import { signIn } from "../firebase";
import { Card, CardHeader, CardBody, CardFooter, Input, Button } from "@nextui-org/react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const isAdmin = await signIn(email, password);
      const isCounter1 =  await signIn(email,password)
      const isCounter2 =  await signIn(email,password)
      const isCounter3 =  await signIn(email,password)
      if (isAdmin) {
        navigate('/adminDash');
      } else if (isCounter1) {
        navigate('/counterDash');
      } else if (isCounter2) {
        navigate('/counterDash');
      } else if (isCounter3) {
        navigate('/counterDash');
      } else {
        return error
      }
    } catch (error) {
      setError(error.message);
    }
  };
  return (
    <div className="md:mx-64 mx-2 md:py-10 py-5 flex flex-col min-h-screen min-w-screen">
      <Navbar />
      <div className="flex flex-1 items-center justify-center">
        <Card className="p-5 min-w-96">
          <CardHeader className="justify-center">
            <h2 className="font-semibold">Please Login Here</h2>
          </CardHeader>
          <form action="post" onSubmit={handleLogin}>
            <CardBody className="gap-5">
              <Input type="email" label="Email" value={email}
                autoComplete='off'
                onChange={(e) => setEmail(e.target.value)}
                required />
              <Input type="password" label="Password"
                value={password}
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                required />
              {error && <p className="text-red-500 text-xs italic">{error}</p>}
              <Button className="bg-[#6236F5] text-white" type="submit">Submit</Button>
            </CardBody>
          </form >
        </Card>
      </div>
    </div>
  );
};

export default Login;
