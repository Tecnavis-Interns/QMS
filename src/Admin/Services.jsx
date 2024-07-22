import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@nextui-org/react';

const Services = () => {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState('');
  const [editServiceId, setEditServiceId] = useState(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'services'));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          customId: doc.data().customId,
          ...doc.data(),
        }));
        // Sort the services by customId
        const sortedData = data.sort((a, b) => a.customId.localeCompare(b.customId));
        setServices(sortedData);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
  
    fetchServices();
  }, []);

  const handleAddService = async () => {
    if (!newService.trim()) {
      setAlertMessage('Service name cannot be blank.');
      return;
    }
  
    const existingService = services.find(
      (service) => service.name.trim().toLowerCase() === newService.trim().toLowerCase()
    );
    if (existingService) {
      setAlertMessage('This service already exists.');
      return;
    }
  
    try {
      // Generate the new custom ID
      let customId = 'A001';
      if (services.length > 0) {
        // Sort services by customId to ensure we're using the latest one
        const sortedServices = [...services].sort((a, b) => a.customId.localeCompare(b.customId));
        const lastId = sortedServices[sortedServices.length - 1].customId;
        let letter = lastId.charAt(0);
        let number = parseInt(lastId.slice(1));
  
        // Increment letter
        letter = String.fromCharCode(letter.charCodeAt(0) + 1);
  
        // If we've gone past 'Z', reset to 'A' and increment the number
        if (letter > 'Z') {
          letter = 'A';
          number++;
        }
  
        customId = `${letter}${number.toString().padStart(3, '0')}`;
      }
  
      const docRef = await addDoc(collection(db, 'services'), { 
        customId: customId,
        name: newService.trim() 
      });
      
      // Fetch and update the services list
      const querySnapshot = await getDocs(collection(db, 'services'));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        customId: doc.data().customId,
        ...doc.data(),
      }));
      const sortedData = data.sort((a, b) => a.customId.localeCompare(b.customId));
      setServices(sortedData);
      
      setNewService('');
      setAlertMessage('');
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };
  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
  
    try {
      await deleteDoc(doc(db, 'services', id));
      setServices(services.filter((service) => service.id !== id));
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };
  
  const handleEditService = (service) => {
    setEditServiceId(service.id);
    setEditServiceName(service.name);
    setIsModalOpen(true);
  };

  const handleUpdateService = async () => {
    if (!editServiceName.trim()) {
      setAlertMessage('Service name cannot be blank.');
      return;
    }

    try {
      const serviceDoc = doc(db, 'services', editServiceId);
      await updateDoc(serviceDoc, { name: editServiceName });
      setServices(
        services.map((service) =>
          service.id === editServiceId
            ? { ...service, name: editServiceName }
            : service
        )
      );
      setIsModalOpen(false);
      setAlertMessage('');
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-64 fixed top-0 left-0 bottom-0 bg-gray-800">
        <Navbar />
      </div>

      <div className="flex-1 ml-64 p-6">
        <h2 className="text-xl font-semibold">Services</h2>
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="New Service"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              className="border p-2 rounded"
            />
            <Button onClick={handleAddService} className="bg-[#908fe2] text-white px-4 py-2 rounded hover:bg-[#6e71d6">
              Add Service
            </Button>
          </div>
          {alertMessage && <div className="text-red-500">{alertMessage}</div>}
          <Table aria-label="Service List" className="min-w-full bg-white border rounded shadow-md">
            <TableHeader>
              <TableColumn>ID</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.customId}</TableCell>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleEditService(service)} className="bg-[#b9b0eb] text-black hover:text-black-200 mr-2">
                      Edit
                    </Button>
                    <Button size="small" color="error" onClick={() => handleDeleteService(service.id)} className="text-red-500 hover:text-red-700">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded shadow-lg">
              <h2 className="text-xl font-bold mb-4">Edit Service</h2>
              <Input
                value={editServiceName}
                onChange={(e) => setEditServiceName(e.target.value)}
                className="border p-2 rounded mb-4 w-full"
              />
              <div className="flex justify-end">
                <Button onClick={handleUpdateService} className="bg-[#b9b0eb] text-black px-4 py-2 rounded mr-2 hover:bg-red-[#908fe2]">
                  Update
                </Button>
                <Button onClick={() => setIsModalOpen(false)} className="bg-gray-400 text-black px-4 py-2 rounded hover:bg-gray-500">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default Services;
