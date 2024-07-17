import { useState, useContext } from "react";
import Navbar from "./Navbar";
import { signIn } from "../firebase";
import { Card, CardHeader, CardBody, Input, Button } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { AuthContext } from "../Context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import bcrypt from 'bcryptjs';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loggedInAs, setLoggedInAs] = useState(null);
  const navigate = useNavigate();
  const { setEmail: setContextEmail } = useContext(AuthContext);

  

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
  
    try {
      if (email === "admin@qms.com" && password === "QMS@123") {
        localStorage.setItem('currentUser', JSON.stringify({
          email: email,
          role: "admin"
        }));
        navigate("/adminDash");
        return;
      }
  
      if (email.endsWith("@qms.com")) {
        const countersRef = collection(db, "counters");
        const q = query(countersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
  
        if (!querySnapshot.empty) {
          const counterDoc = querySnapshot.docs[0];
          const counterData = counterDoc.data();
          const hashedPassword = counterData.password;
  
          // Compare the input password with the hashed password
          const isPasswordCorrect = await bcrypt.compare(password, hashedPassword);
  
          if (isPasswordCorrect) {
            const counterName = email.split("@")[0];
            localStorage.setItem('currentUser', JSON.stringify({
              email: email,
              role: "counter",
              counterName: counterName
            }));
            setContextEmail(email);
            navigate(`/${counterName}`);
            return;
          }
        }
      }
  
      throw new Error("Invalid credentials");
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Invalid email or password");
    }
  };
  return (
    <div className="flex flex-col min-h-dvh min-w-screen">
      <Navbar />
      <div className="md:mx-64 mx-2 md:py-10 py-5 flex flex-1 items-center justify-center">
        <Card className="p-2 md:p-5 md:min-w-96 min-w-[75vw]">
          <CardHeader className="justify-center">
            <h2 className="font-semibold">Please Login Here</h2>
          </CardHeader>
          <form action="post" onSubmit={handleLogin}>
            <CardBody className="gap-5">
              <Input
                type="email"
                label="Email"
                value={email}
                autoComplete='off'
                onChange={(e) => setEmail(e.target.value)}
                required
                variant='bordered'
              />
              <Input
                type="password"
                label="Password"
                value={password}
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                required
                variant='bordered'
              />
              {error && <p className="text-red-500 text-xs italic">{error}</p>}
              <Button className="bg-[#6e71d6] text-white" type="submit">Submit</Button>
            </CardBody>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
