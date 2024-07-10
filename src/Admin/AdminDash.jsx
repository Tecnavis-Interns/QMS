import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@nextui-org/react";
import moment from "moment";
import "./Dashboard.css";

import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import TokenChart from "../../src/tokenChart";

const Dashboard = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [currentTime, setCurrentTime] = useState(
    moment().format("MMMM Do YYYY, h:mm:ss a")
  );
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email === "admin@tecnavis.com") {
        setUser(currentUser);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribeAuth();
  }, [auth, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("MMMM Do YYYY, h:mm:ss a"));
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  return (
    <> 
    <div className="flex">
    <div className="bg-white w-1/4  rounded-lg shadow-md p-8 mb-6">
        <p className="text-gray-600">{currentTime}</p>
      </div>
    </div>
      

      {/* main cards */}

      <div className="warapper scrollbar-hide   h-[400px]  ">
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
            <p className="text-xl font-semibold text-red-700">CRITICAL RISK</p>
            <p className="mt-1 text-sm text-gray-500">32</p>
          </div>
          <div className="bg-yellow-100 h-24  text-center rounded-lg px-4 py-5">
            <p className="text-xl font-semibold text-yellow-700">
              MODERATE RISK
            </p>
            <p className="mt-1 text-sm text-gray-500">10</p>
          </div>
          <div className="bg-green-100 h-24  text-center rounded-lg px-4 py-5">
            <p className="text-xl font-semibold text-green-700">LOW RISK</p>
            <p className="mt-1 text-sm text-gray-500">12</p>
          </div>
        </div>
        <div className=" w-1/3 ml-2  -mt-14 ">
          <TokenChart />
        </div>
      </div>

      {/* Queue List & staff */}
      <div className="h-[400px] flex">
        <div className=" w-[700px] ml-5 -mt-20 ">
          <h1 className="text-xl py-2 px-3">Queue Details</h1>

          <Table aria-label="Queue Details">
            <TableHeader>
              <TableColumn>Sl. no.</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>Date</TableColumn>
              <TableColumn>Service</TableColumn>
              <TableColumn>Counter</TableColumn>
              <TableColumn>Status</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>1</TableCell>
                <TableCell>test</TableCell>
                <TableCell>07/05/2024</TableCell>
                <TableCell>Home Related Service</TableCell>
                <TableCell>Couter 1</TableCell>
                <TableCell>
                  <h1 className="bg-green-300 text-green-900 text-xs font-medium me-2 pr-2 px-2.5 pl-6 py-0.5 rounded dark:bg-green-900 dark:text-green-700">
                    In Queue
                  </h1>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>1</TableCell>
                <TableCell>test</TableCell>
                <TableCell>07/05/2024</TableCell>
                <TableCell>Home Related Service</TableCell>
                <TableCell>Couter 1</TableCell>
                <TableCell>
                  <h1 className="bg-orange-400 text-orange-900 text-xs font-medium me-2 pr-2 px-2.5 pl-6 py-0.5 rounded dark:bg-orange-900 dark:text-orange-700">
                    Pending
                  </h1>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>1</TableCell>
                <TableCell>test</TableCell>
                <TableCell>07/05/2024</TableCell>
                <TableCell>Home Related Service</TableCell>
                <TableCell>Couter 1</TableCell>
                <TableCell>
                  <h1 className="bg-orange-400 text-orange-900 text-xs font-medium me-2 pr-2 px-2.5 pl-6 py-0.5 rounded dark:bg-orange-900 dark:text-orange-700">
                    Pending
                  </h1>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>1</TableCell>
                <TableCell>test</TableCell>
                <TableCell>07/05/2024</TableCell>
                <TableCell>Home Related Service</TableCell>
                <TableCell>Couter 1</TableCell>
                <TableCell>
                  <h1 className="bg-orange-400 text-orange-900 text-xs font-medium me-2 pr-2 px-2.5 pl-6 py-0.5 rounded dark:bg-orange-900 dark:text-orange-700">
                    Pending
                  </h1>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>1</TableCell>
                <TableCell>test</TableCell>
                <TableCell>07/05/2024</TableCell>
                <TableCell>Home Related Service</TableCell>
                <TableCell>Couter 1</TableCell>
                <TableCell>
                  <h1 className="bg-green-300 text-green-900 text-xs font-medium me-2 pr-2 px-2.5 pl-6 py-0.5 rounded dark:bg-green-900 dark:text-green-700">
                    In Queue
                  </h1>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>1</TableCell>
                <TableCell>test</TableCell>
                <TableCell>07/05/2024</TableCell>
                <TableCell>Home Related Service</TableCell>
                <TableCell>Couter 1</TableCell>
                <TableCell>
                  <h1 className="bg-green-300 text-green-900 text-xs font-medium me-2 pr-2 px-2.5 pl-6 py-0.5 rounded dark:bg-green-900 dark:text-green-700">
                    In Queue
                  </h1>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="bg-white shadow-2xl h-72 ml-7 rounded-xl w-[335px]">
          <h1 className=" py-2 px-3">Current Staff</h1>
          <div className="flex mt-2">
            <img
              className="w-10 h-10 rounded-full ml-4 "
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXQIhCa4OVtg6VpVOpw2kHHByhxVyj29trOw&usqp=CAU"
              alt="image"
            />
            <div className="-mt-1">
              <h1 className="font-sans font-semibold py-1 ml-2">Test Staff</h1>
              <h1 className="font-sans text-xs -mt-1  ml-2">Counter 1</h1>
            </div>
          </div>
          <div className="flex mt-2">
            <img
              className="w-10 h-10 rounded-full ml-4 "
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXQIhCa4OVtg6VpVOpw2kHHByhxVyj29trOw&usqp=CAU"
              alt="image"
            />
            <div className="-mt-1">
              <h1 className="font-sans font-semibold py-1 ml-2">Test Staff</h1>
              <h1 className="font-sans text-xs -mt-1  ml-2">Counter 1</h1>
            </div>
          </div>
          <div className="flex mt-2">
            <img
              className="w-10 h-10 rounded-full ml-4 "
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXQIhCa4OVtg6VpVOpw2kHHByhxVyj29trOw&usqp=CAU"
              alt="image"
            />
            <div className="-mt-1">
              <h1 className="font-sans font-semibold py-1 ml-2">Test Staff</h1>
              <h1 className="font-sans text-xs -mt-1  ml-2">Counter 1</h1>
            </div>
          </div>
          <div className="flex mt-2">
            <img
              className="w-10 h-10 rounded-full ml-4 "
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXQIhCa4OVtg6VpVOpw2kHHByhxVyj29trOw&usqp=CAU"
              alt="image"
            />
            <div className="-mt-1">
              <h1 className="font-sans font-semibold py-1 ml-2">Test Staff</h1>
              <h1 className="font-sans text-xs -mt-1  ml-2">Counter 1</h1>
            </div>
          </div>
          <div className="flex mt-2">
            <img
              className="w-10 h-10 rounded-full ml-4 "
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXQIhCa4OVtg6VpVOpw2kHHByhxVyj29trOw&usqp=CAU"
              alt="image"
            />
            <div className="-mt-1">
              <h1 className="font-sans font-semibold py-1 ml-2">Test Staff</h1>
              <h1 className="font-sans text-xs -mt-1  ml-2">Counter 1</h1>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
