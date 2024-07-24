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
  const [currentTime, setCurrentTime] = useState(
    moment().format("MMMM Do YYYY, h:mm:ss a")
  );
  const [counterData, setCounterData] = useState([]);

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
      const staffQuery = query(collection(db, "staff"),where("active", "==", true));
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

  const fetchCounterData = async () => {
    try {
      const countersQuery = query(collection(db, "counters"));
      const countersSnapshot = await getDocs(countersQuery);
      const countersData = countersSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      console.log("Fetched counter data:", countersData);
      setCounterData(countersData);
    } catch (error) {
      console.error("Error fetching counter data:", error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStaffMembers();
    fetchQueueCounts();
    fetchCounterData();
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
        <div className="bg-white w-1/4 rounded-lg shadow-md p-8 mb-6">
          <p className="text-gray-600">{currentTime}</p>
        </div>
      </div>

      {/* main cards */}
<div className="mt-6 mb-6">
  <div className="flex space-x-8 px-8 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
    <style jsx>{`
      .flex::-webkit-scrollbar {
        display: none;
      }
    `}</style>
    {counterData.map((counter) => (
   <div key={counter.id} className="flex-shrink-0 w-[200px] cursor-pointer"> {/* Reduced from 320px to 160px */}
        <div className="bg-indigo-200 h-20 rounded-xl p-3 mb-2 w-[200px] mx-auto relative z-0"> {/* Reduced from 280px to 140px, and adjusted height and padding */}
          <div className="flex justify-between items-center">
            <div>
            <h1 className="text-lg font-bold"> {/* Reduced font size */}
            {counter.completed} <span className="text-xs opacity-60 font-normal">Completed</span> {/* Reduced font size */}
            </h1>
            </div>
            <div>
              <h1 className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                counter.isActive ? 'bg-green-300 text-green-900' : 'bg-red-400 text-white'
              }`}>
                {counter.isActive ? 'Active' : 'Closed'}
              </h1>
            </div>
          </div>
        </div>
        <div className="bg-slate-100 rounded-xl p-3 -mt-6 pt-8 relative z-10"> {/* Adjusted padding and margin */}
        <div className="flex items-center mb-2"> {/* Reduced margin */}
        <img
              className="w-8 h-8 rounded-full mr-2" 
              src={counter.imageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXQIhCa4OVtg6VpVOpw2kHHByhxVyj29trOw&usqp=CAU"}
              alt="image"
            />
            <div>
            <h1 className="font-bold text-sm">{counter.staffName}</h1> {/* Reduced font size */}
            <h1 className="text-xs">{counter.counterName}</h1> {/* Reduced font size */}
            </div>
          </div>
          <div className="border-t pt-1"> {/* Reduced padding */}
            {/* <div className="flex justify-between">
              <div className="pt-4">
                <p>Pending: <span>{counter.pending}</span></p>
                <p>Total customer: <span>{counter.totalCustomers}</span></p>
                <p>Waiting: <span>{counter.waiting}</span></p>
              </div> 
              <div className="bg-black/25 mt-2 -ml-4 w-[1px] h-28"></div>
              <div>
                <h1 className="">Services</h1>
                <p>Pending: <span>{counter.servicePending}</span></p>
                <p>Total customer: <span>{counter.serviceTotalCustomers}</span></p>
                <p>Waiting: <span>{counter.serviceWaiting}</span></p>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
      {/* cards & charts */}
      <div className="flex w-full pt-8">
        <div className="grid w-3/5 ml-16 -mt-7 grid-cols-3 gap-4">
          <div className="bg-red-100 h-24 text-center rounded-lg px-4 py-5">
            <p className="text-xl font-semibold text-red-700">COMPLETED</p>
            <p className="mt-1 text-sm text-gray-500">{completedCount}</p>
          </div>
          <div className="bg-yellow-100 h-24 text-center rounded-lg px-4 py-5">
            <p className="text-xl font-semibold text-yellow-700">PENDING</p>
            <p className="mt-1 text-sm text-gray-500">{pendingCount}</p>
          </div>
          <div className="bg-green-100 h-24 text-center rounded-lg px-4 py-5">
            <p className="text-xl font-semibold text-green-700">REMAINING</p>
            <p className="mt-1 text-sm text-gray-500">{remainingCount}</p>
          </div>
        </div>
        <div className="w-1/3 ml-8 -mt-14">
          <TokenChart />
        </div>
      </div>

      {/* Queue List & staff */}
      <div className="h-[400px] flex">
        <div className="w-[700px] ml-14  -mt-20">
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

        <div className="bg-white shadow-2xl h-72 mt-13 ml-28  rounded-xl w-[335px] overflow-y-auto">
        <h1 className="py-2 px-5">Current Staff</h1>
        {staffMembers.map((staff) => (
          <div key={staff.id} className="flex mt-2">
            <img
              className="w-9 h-9 rounded-full ml-4"
              src={staff.imageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXQIhCa4OVtg6VpVOpw2kHHByhxVyj29trOw&usqp=CAU"}
              alt={`${staff.staffName} profile`}
            />
            <div className="-mt-0.5">
              <h2 className="font-sans font-semibold py-1 ml-2">{staff.staffName}</h2>
              <p className="font-sans text-xs -mt-1 ml-2">{staff.role || 'Staff Member'}</p>
            </div>
          </div>
        ))}
      </div>
      </div>
    </>
  );
};

export default Dashboard;