import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";
import moment from "moment";
import "./Dashboard.css";

import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import TokenChart from "../../src/tokenChart";
import { db } from '../firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';

const Dashboard = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [remainingCount, setRemainingCount] = useState(0);
  const [counters, setCounters] = useState([]);
  const [currentTime, setCurrentTime] = useState(
    moment().format("MMMM Do YYYY, h:mm:ss a")
  );
  useEffect(() => {
    const checkAuth = () => {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      console.log('Current user:', user);
      if (!user || user.role !== 'admin') {
        console.log('Redirecting to login');
        navigate('/login');
      } else {
        console.log('Admin authenticated');
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchCounters = async () => {
    try {
      const countersQuery = query(collection(db, "counters"));
      const countersSnapshot = await getDocs(countersQuery);
      const countersData = countersSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      console.log("Fetched counters:", countersData);
      setCounters(countersData);
    } catch (error) {
      console.error("Error fetching counters:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, "requests"), where("status", "==", true));
      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      console.log("Fetched requests:", requestsData);
      setRequests(requestsData);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };
  const fetchStaffMembers = async () => {
    try {
      const staffQuery = query(collection(db, "staff"));
      const staffSnapshot = await getDocs(staffQuery);
      const staffData = staffSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      console.log("Fetched staff members:", staffData);
      setStaffMembers(staffData);
    } catch (error) {
      console.error("Error fetching staff members:", error);
    }
  };
  const fetchQueueCounts = async () => {
    try {
      const queueDocRef = doc(db, "queue", "queueDoc");
      const queueDocSnap = await getDoc(queueDocRef);
      
      if (queueDocSnap.exists()) {
        const queueData = queueDocSnap.data();
        console.log('queueData : '+queueData);
        setCompletedCount(queueData.receivedToken?.length || 0);
        setPendingCount(queueData.pending?.length || 0);
        setRemainingCount(queueData.token?.length || 0);
        console.log("Queue counts fetched:", {
          completed: queueData.receivedToken?.length || 0,
          pending: queueData.pending?.length || 0,
          remaining: queueData.token?.length || 0
        });
      } else {
        console.log("No queue document found!");
      }
    } catch (error) {
      console.error("Error fetching queue counts:", error);
    }
  };
  
  useEffect(() => {
    fetchRequests();
    fetchStaffMembers();
    fetchQueueCounts();
    fetchCounters();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("MMMM Do YYYY, h:mm:ss a"));
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  return (
    <> 
    <div className="flex ml-14 mt-6">
    <div className="bg-white w-1/4  rounded-lg shadow-md p-8 mb-6">
        <p className="text-gray-600">{currentTime}</p>
      </div>
    </div>
      

      {/* main cards */}

      <div className="warapper scrollbar-hide   h-[400px]  ">
        <div className="items cursor-pointer relative  z-20 w-[270px] ml-8 bg-red-300 pt-20  h-24 rounded-xl ">
          <div className="absolute bg-slate-200 -ml-6  mt w-80 h-64  rounded-xl">
            <div className="py-6 px-3">
              

              <div className="bg-black/25 mt-6 h-[1px]"></div>

              <div className="flex ">
                <div className="mt-4 ">
                  <div className="mr-14">
                    <h1>Counter 1</h1>
                    <h1 className="mt-2">
                      Pending : <span>0</span>
                    </h1>
                    <h1 className="mt-2">
                      Total customer : <span>0</span>
                    </h1>
                    <h1 className="mt-2">
                      Wating : <span>0</span>
                    </h1>
                  </div>
                </div>
                {/* vertical line */}
                <div className="bg-black/25 mt-6  -ml-10  w-[1px] h-28"></div>
                <div className="mt-4 ml-4  ">
                  <div>
                    <h1>Services</h1>
                    <h1 className="mt-2">
                      Pending : <span>0</span>
                    </h1>
                    <h1 className="mt-2">
                      Total customer : <span>0</span>
                    </h1>
                    <h1 className="mt-2">
                      Wating : <span>0</span>
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative -mt-10 flex justify-between">
            <div className="-mt-6 ml-4">
              <h1>Counter1</h1>
              <h1 className="text-xl font-bold">
                10{" "}
                <span className="text-sm opacity-60 font-normal">
                  Completed
                </span>
              </h1>
            </div>
            <div>
              <h1 className="bg-green-300  text-green-900 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-700">
                Active
              </h1>
            </div>
          </div>
        </div>
        <div className="items cursor-pointer relative  z-20 w-[270px] ml-8 bg-red-300 pt-20  h-24 rounded-xl ">
          <div className="absolute bg-slate-200 -ml-6  mt w-80 h-64  rounded-xl">
            <div className="py-6 px-3">
              <div className="flex">
                <div className="ml-2">
                  <img
                    className="w-10 h-10 rounded-full"
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXQIhCa4OVtg6VpVOpw2kHHByhxVyj29trOw&usqp=CAU"
                    alt="image"
                  />
                </div>

                <div className=" ml-3 ">
                  <h1 className=" font-bold">ABDCED</h1>
                  <h1 className="text-sm font-sans">Home Related Service</h1>
                </div>
              </div>

              <div className="bg-black/25 mt-6 h-[1px]"></div>

              <div className="flex ">
                <div className="mt-4 ">
                  <div className="mr-14">
                    <h1>Counter 1</h1>
                    <h1 className="mt-2">
                      Pending : <span>0</span>
                    </h1>
                    <h1 className="mt-2">
                      Total customer : <span>0</span>
                    </h1>
                    <h1 className="mt-2">
                      Wating : <span>0</span>
                    </h1>
                  </div>
                </div>
                {/* vertical line */}
                <div className="bg-black/25 mt-6  -ml-10  w-[1px] h-28"></div>
                <div className="mt-4 ml-4  ">
                  <div>
                    <h1>Services</h1>
                    <h1 className="mt-2">
                      Pending : <span>0</span>
                    </h1>
                    <h1 className="mt-2">
                      Total customer : <span>0</span>
                    </h1>
                    <h1 className="mt-2">
                      Wating : <span>0</span>
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative -mt-10 flex justify-between">
            <div className="-mt-6 ml-4">
              <h1>Counter1</h1>
              <h1 className="text-xl font-bold">
                10{" "}
                <span className="text-sm opacity-60 font-normal">
                  Completed
                </span>
              </h1>
            </div>
            <div>
              <h1 className="bg-red-400 text-white text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-700">
                Clossed
              </h1>
            </div>
          </div>
        </div>
        <div className="items cursor-pointer relative  z-20 w-[270px] ml-8 bg-red-300 pt-20  h-24 rounded-xl ">
          <div className="absolute bg-slate-200 -ml-6  mt w-80 h-64  rounded-xl">
            <div className="py-6 px-3">
              <div className="flex">
                <div className="ml-2">
                  <img
                    className="w-10 h-10 rounded-full"
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXQIhCa4OVtg6VpVOpw2kHHByhxVyj29trOw&usqp=CAU"
                    alt="image"
                  />
                </div>

                <div className=" ml-3 ">
                  <h1 className=" font-bold">ABDCED</h1>
                  <h1 className="text-sm font-sans">Home Related Service</h1>
                </div>
              </div>

              <div className="bg-black/25 mt-6 h-[1px]"></div>

              <div className="flex ">
                <div className="mt-4 ">
                  <div className="mr-14">
                    <h1>Counter 1</h1>
                    <h1 className="mt-2">
                      Pending : <span>0</span>
                    </h1>
                    <h1 className="mt-2">
                      Total customer : <span>0</span>
                    </h1>
                    <h1 className="mt-2">
                      Wating : <span>0</span>
                    </h1>
                  </div>
                </div>
                {/* vertical line */}
                <div className="bg-black/25 mt-6  -ml-10  w-[1px] h-28"></div>
                <div className="mt-4 ml-4  ">
                  <div>
                    <h1>Services</h1>
                    <h1 className="mt-2">
                      Pending : <span>0</span>
                    </h1>
                    <h1 className="mt-2">
                      Total customer : <span>0</span>
                    </h1>
                    <h1 className="mt-2">
                      Wating : <span>0</span>
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative -mt-10 flex justify-between">
            <div className="-mt-6 ml-4">
              <h1>Counter1</h1>
              <h1 className="text-xl font-bold">
                10{" "}
                <span className="text-sm opacity-60 font-normal">
                  Completed
                </span>
              </h1>
            </div>
            <div>
              <h1 className="bg-green-300  text-green-900 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-700">
                Active
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* cards & charts */}
      <div className="flex w-full  ">
        <div className="grid  w-3/5  ml-16 -mt-7  grid-cols-3 gap-4">
          <div className="bg-red-100 h-24 text-center rounded-lg px-4 py-5">
            <p className="text-xl font-semibold text-red-700">COMPLETED</p>
            <p className="mt-1 text-sm text-gray-500">{completedCount}</p>
          </div>
          <div className="bg-yellow-100 h-24  text-center rounded-lg px-4 py-5">
            <p className="text-xl font-semibold text-yellow-700">
              PENDING
            </p>
            <p className="mt-1 text-sm text-gray-500">{pendingCount}</p>
          </div>
          <div className="bg-green-100 h-24  text-center rounded-lg px-4 py-5">
            <p className="text-xl font-semibold text-green-700">REMAINING</p>
            <p className="mt-1 text-sm text-gray-500">{remainingCount}</p>
          </div>
        </div>
        <div className=" w-1/3 ml-8  -mt-14 ">
          <TokenChart />
        </div>
      </div>

      {/* Queue List & staff */}
      <div className="h-[400px] flex">
        <div className=" w-[700px] ml-14 mr-4 -mt-20 ">
          <h1 className="text-xl py-2 px-3">Queue Details</h1>
          

          <Table aria-label="Queue Details">
            <TableHeader>
              <TableColumn>Sl. no.</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>Date</TableColumn>
              <TableColumn>Service</TableColumn>
              <TableColumn>Status</TableColumn>
            </TableHeader>
            <TableBody>
              {requests.map((request, index) => (
                <TableRow key={request.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{request.name}</TableCell>
                  <TableCell>{request.date && request.date.toDate ? moment(request.date.toDate()).format('DD/MM/YYYY') : 'N/A'}</TableCell>
                  <TableCell>{request.service}</TableCell>
                  <TableCell>
                    <h1 className={`text-xs font-medium me-2 pr-2 px-2.5 pl-6 py-0.5 rounded ${
                      request.pending 
                        ? 'bg-orange-400 text-orange-900 dark:bg-orange-900 dark:text-orange-700'
                        : 'bg-green-300 text-green-900 dark:bg-green-900 dark:text-green-700'
                    }`}>
                      {request.pending ? 'Pending' : 'In Queue'}
                    </h1>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-white shadow-2xl h-72 ml-7 mr-6 rounded-xl w-[335px] overflow-y-auto">
          <h1 className=" py-2 px-3">Current Staff</h1>
          {staffMembers.map((staff) => (
          <div key={staff.id} className="flex mt-2">
            <img
              className="w-10 h-10 rounded-full ml-4 "
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXQIhCa4OVtg6VpVOpw2kHHByhxVyj29trOw&usqp=CAU"
              alt="image"
            />
              <div key={staff.id} className="-mt-1">
              <h1 className="font-sans font-semibold py-1 ml-2">{staff.staffName}</h1>
              <h1 className="font-sans text-xs -mt-1  ml-2"></h1>
            </div>
          </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
