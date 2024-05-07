import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@nextui-org/react';
import Navbar from './Navbar';

const AdminDash = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user || user.email !== 'admin@tecnavis.com') {
      navigate('/login');
    }
  }, [user, navigate]);

  const [userData, setUserData] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(
          query(collection(db, 'requests'), orderBy('date', 'asc'))
        );
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    const unsubscribe = onSnapshot(
      query(collection(db, 'requests'), orderBy('date', 'asc')),
      (snapshot) => {
        const updatedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserData(updatedData);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleShowMoreLess = () => {
    setShowAll(!showAll);
  };

  const visibleQueueRows = showAll ? userData : userData.slice(0, 3); // Only slice here
  const visibleActiveCounters = userData; // Always show all

  const totalCustomers = userData.length;
  const completedCustomers = userData.filter(
    (user) => user.status === 'completed'
  ).length;
  const pendingCustomers = userData.filter(
    (user) => user.status !== 'completed'
  ).length;

  const serviceSummary = {};
  userData.forEach((user) => {
    const serviceName = user.service;
    if (!serviceSummary[serviceName]) {
      serviceSummary[serviceName] = { total: 0, completed: 0, pending: 0 };
    }
    serviceSummary[serviceName].total += 1;
    if (user.status === 'completed') {
      serviceSummary[serviceName].completed += 1;
    } else {
      serviceSummary[serviceName].pending += 1;
    }
  });

  const serviceNames = Object.keys(serviceSummary);

  return (
    <div className="flex min-h-screen">
      <div className="w-64 fixed top-0 left-0 bottom-0 bg-gray-800">
        <Navbar />
      </div>

      <div className="flex-1 ml-64 p-6 relative">
        {/* Active Counters */}
        <div
          className="absolute top-16 right-16 bg-gray-200 p-4 rounded shadow w-1/4"
        >
          <h3 className="text-lg font-semibold">Active Counters</h3>
          <Table aria-label="Active counters">
            <TableHeader>
              <TableColumn>Counter no</TableColumn>
              <TableColumn>Service type</TableColumn>
              <TableColumn>Total Customer</TableColumn>
            </TableHeader>

            <TableBody>
              {visibleActiveCounters.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell>{user.counter}</TableCell>
                  <TableCell>{user.service}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Queue Status */}
        <div className="flex flex-col gap-10">
          <h2 className="text-xl font-semibold">Current Queue Status</h2>

          <div className="flex justify-start items-center gap-6">
            <div className="bg-gray-200 p-4 rounded shadow w-1/6">
              <h3 className="text-lg font-semibold">Total Customers</h3>
              <p>{totalCustomers}</p>
            </div>
            <div className="bg-gray-200 p-4 rounded shadow w-1/6">
              <h3 className="text-lg font-semibold">Completed</h3>
              <p>{completedCustomers}</p>
            </div>

            <div className="bg-gray-200 p-4 rounded shadow w-1/6">
              <h3 className="text-lg font-semibold">Pending</h3>
              <p>{pendingCustomers}</p>
            </div>
          </div>

          {/* Services */}
          <h2 className="font-semibold md:text-xl">Services</h2>

          <div className="flex flex-col gap-6">
            <div className="flex justify-start items-center gap-6">
              {serviceNames.slice(0, 3).map((serviceName) => (
                <div
                  key={serviceName}
                  className="bg-gray-200 p-4 rounded shadow w-1/6"
                >
                  <h3 className="text-lg font-semibold">{serviceName}</h3>
                  <p>Total: {serviceSummary[serviceName]?.total}</p>
                  <p>Completed: {serviceSummary[serviceName]?.completed}</p>
                  <p>Pending: {serviceSummary[serviceName]?.pending}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-start items-center gap-6">
              {serviceNames.slice(3, 5).map((serviceName) => (
                <div
                  key={serviceName}
                  className="bg-gray-200 p-4 rounded shadow w-1/6"
                >
                  <h3 className="text-lg font-semibold">{serviceName}</h3>
                  <p>Total: {serviceSummary[serviceName]?.total}</p>
                  <p>Completed: {serviceSummary[serviceName]?.completed}</p>
                  <p>Pending: {serviceSummary[serviceName]?.pending}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Queue Details */}
          <div className="flex flex-col justify-center items-center py-5 gap-4 w-full">
            <h2 className="font-semibold md:text-xl">Queue Details</h2>
            {userData.length === 0 ? (
              <p>No valid data available</p>
            ) : (
              <Table aria-label="Queue Details">
                <TableHeader>
                  <TableColumn>Sl. no.</TableColumn>
                  <TableColumn>Name</TableColumn>
                  <TableColumn>Phone</TableColumn>
                  <TableColumn>Date</TableColumn>
                  <TableColumn>Service</TableColumn>
                  <TableColumn>Counter</TableColumn>
                  <TableColumn>Status</TableColumn>
                </TableHeader>

                <TableBody>
                  {visibleQueueRows.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{user.date ? user.date.toDate().toLocaleString() : ''}
                      </TableCell>
                      <TableCell>{user.service}</TableCell>
                      <TableCell>{user.counter}</TableCell>
                      <TableCell>{user.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="text-right w-full">
              <span
                className="cursor-pointer text-black"
                onClick={handleShowMoreLess}
              >
                {showAll ? 'View Less' : 'View More'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDash;