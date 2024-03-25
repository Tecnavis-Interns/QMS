import React from "react";
import {
  Input,
  Textarea,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";
import Navbar from '../Components/Navbar'

const UserForm = () => {
  return (
    <div className="md:mx-64 mx-2 md:py-10 py-5 flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 justify-center flex-wrap">
      <div className="min-w-[50%] flex flex-col items-center justify-center p-10 gap-4">
        <h2 className="font-semibold">Create a request</h2>
        <div className="flex flex-col w-full gap-4">
          <Input type="text" label="Name" />
          <Input type="email" label="Email" />
          <Textarea label="Reason for your Visit" className="max-w-full" />
        </div>
        <Button className="bg-[#6236F5] text-white w-full">Submit</Button>
      </div>
      <div className="min-w-[50%] flex flex-col items-center justify-center p-10 gap-4">
        <h2 className="font-semibold">Current Queue</h2>
          <Table aria-label="Example static collection w-full table">
            <TableHeader>
              <TableColumn>Sl. no.</TableColumn>
              <TableColumn>Name</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow key="1">
                <TableCell>1</TableCell>
                <TableCell>CEO</TableCell>
              </TableRow>
              <TableRow key="2">
                <TableCell>2</TableCell>
                <TableCell>Technical Lead</TableCell>
              </TableRow>
              <TableRow key="3">
                <TableCell>3</TableCell>
                <TableCell>Senior Developer</TableCell>
              </TableRow>
              <TableRow key="4">
                <TableCell>4</TableCell>
                <TableCell>Community Manager</TableCell>
              </TableRow>
            </TableBody>
          </Table>
      </div>
    </div>
    </div>
  );
};

export default UserForm;
