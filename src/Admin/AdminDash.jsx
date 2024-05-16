import React, { useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
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

  const isValidUserData = (user) => {
    return (
      user.name &&
      user.date &&
      user.phone &&
      user.service &&
      user.counter &&
      user.token
    );
  };

  const handleAddCounter = () => {
    setShowModal(true);
  };

  const handleManageCounter = (counter) => {
    setSelectedCounter(counter);
  };

  const handleCloseModal = () => {
    setSelectedCounter(null);
  };

  return (
    <div className=" flex flex-col min-h-screen">
      <Navbar />
      <div className="lg:mx-24 flex justify-center flex-wrap gap-10">
        <div className="flex items-center justify-center gap-10 w-full py-10">
          <div className="flex flex-col items-center gap-10">
            <ModalCounter />
          </div>

          {/* Services */}
          <h2 className="font-semibold md:text-xl">Services</h2>

          <div className="flex flex-col gap-6">
            <div className="flex justify-start items-center gap-6">
              {serviceNames.slice(0, 3).map((serviceName, index) => (
                <div
                  key={index}
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
              {serviceNames.slice(3, 6).map((serviceName, index) => (
                <div
                  key={index}
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
                      <TableCell>{user.date ? user.date.toDate().toLocaleString() : ''}</TableCell>
                      <TableCell>{user.service}</TableCell>
                      <TableCell>{user.counter}</TableCell>
                      <TableCell>{user.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="text-right w-full">
              <span className="cursor-pointer text-black" onClick={handleShowMoreLess}>
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