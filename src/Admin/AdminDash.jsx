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
import Navbar from "./Navbar";

const UserForm = () => {
  return (
    <div className="md:mx-64 mx-2 md:py-10 py-5 flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 justify-center flex-wrap">
        <div className="flex flex-col items-center justify-center p-10 py-5 gap-4 w-full">
          <h2 className="font-semibold md:text-xl">Queue Details </h2>
          <Table aria-label="Example static collection table">
            <TableHeader>
              <TableColumn>Sl. no.</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>Date</TableColumn>
              <TableColumn>Phone</TableColumn>
              <TableColumn>Reason for Visit</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow key="1">
                <TableCell>1</TableCell>
                <TableCell>CEO</TableCell>
                <TableCell>09-02-2024</TableCell>
                <TableCell>9995559990</TableCell>
                <TableCell>Feeling Sick</TableCell>
              </TableRow>
              <TableRow key="2">
                <TableCell>2</TableCell>
                <TableCell>Technical Lead</TableCell>
                <TableCell>09-02-2024</TableCell>
                <TableCell>9995559990</TableCell>
                <TableCell>Feeling Sick</TableCell>
              </TableRow>
              <TableRow key="3">
                <TableCell>3</TableCell>
                <TableCell>Senior Developer</TableCell>
                <TableCell>09-02-2024</TableCell>
                <TableCell>9995559990</TableCell>
                <TableCell>Feeling Sick</TableCell>
              </TableRow>
              <TableRow key="4">
                <TableCell>4</TableCell>
                <TableCell>Community Manager</TableCell>
                <TableCell>09-02-2024</TableCell>
                <TableCell>9995559990</TableCell>
                <TableCell>Feeling Sick</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col items-center justify-center p-10 py-5 gap-4 w-full">
          <h2 className="font-semibold md:text-xl">Visited Queue </h2>
          <Table aria-label="Example static collection table">
            <TableHeader>
              <TableColumn>Sl. no.</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>Date</TableColumn>
              <TableColumn>Phone</TableColumn>
              <TableColumn>Reason for Visit</TableColumn>
              <TableColumn>Visited Counter</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow key="1">
                <TableCell>1</TableCell>
                <TableCell>CEO</TableCell>
                <TableCell>09-02-2024</TableCell>
                <TableCell>9995559990</TableCell>
                <TableCell>Feeling Sick</TableCell>
                <TableCell>001</TableCell>
              </TableRow>
              <TableRow key="2">
                <TableCell>2</TableCell>
                <TableCell>Technical Lead</TableCell>
                <TableCell>09-02-2024</TableCell>
                <TableCell>9995559990</TableCell>
                <TableCell>Feeling Sick</TableCell>
                <TableCell>001</TableCell>
              </TableRow>
              <TableRow key="3">
                <TableCell>3</TableCell>
                <TableCell>Senior Developer</TableCell>
                <TableCell>09-02-2024</TableCell>
                <TableCell>9995559990</TableCell>
                <TableCell>Feeling Sick</TableCell>
                <TableCell>001</TableCell>
              </TableRow>
              <TableRow key="4">
                <TableCell>4</TableCell>
                <TableCell>Community Manager</TableCell>
                <TableCell>09-02-2024</TableCell>
                <TableCell>9995559990</TableCell>
                <TableCell>Feeling Sick</TableCell>
                <TableCell>001</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default UserForm;
