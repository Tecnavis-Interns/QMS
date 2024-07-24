import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Input,
} from "@nextui-org/react";
import Navbar from "./Navbar";
import { MdArrowDropDown, MdSearch } from "react-icons/md";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from '../firebase';
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function ReportSection() {
  const [data, setData] = useState([]);
  const [counters, setCounters] = useState([]);
  const [services, setServices] = useState([{ id: "All", name: "All" }]);
  const [selectedCounter, setSelectedCounter] = useState(new Set(["All"]));
  const [selectedService, setSelectedService] = useState(new Set(["All"]));
  const [reportType, setReportType] = useState(" ");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    fetchCountersAndServices();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedCounter, selectedService, reportType]);

  const fetchCountersAndServices = async () => {
    const countersSnapshot = await getDocs(collection(db, "counters"));
    const fetchedCounters = countersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().counterName
    }));
    setCounters([{ id: "All", name: "All" }, ...fetchedCounters]);

    const servicesSnapshot = await getDocs(collection(db, "services"));
    const fetchedServices = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      prefix: doc.data().prefix // Assuming each service has a prefix field
    }));
    setServices([{ id: "All", name: "All", prefix: "" }, ...fetchedServices]);
  };

  const fetchData = async () => {
    let fetchedData = [];

    if (reportType === "service") {
      const chartDataRef = collection(db, "ChartData");
      let q = chartDataRef;

      if (!selectedService.has("All")) {
        const selectedPrefixes = Array.from(selectedService).map(id => 
          services.find(s => s.id === id)?.prefix
        ).filter(Boolean);

        if (selectedPrefixes.length > 0) {
          q = query(q, where("tokenNumber", "in", selectedPrefixes.map(prefix => new RegExp(`^${prefix}`))))
        }
      }

      const querySnapshot = await getDocs(q);
      fetchedData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        service: doc.data().service,
        tokenNumber: doc.data().tokenNumber,
        createdAt: doc.data().createdAt.toDate().toLocaleString(),
      }));

      // Additional filtering if needed
      if (!selectedService.has("All")) {
        const selectedServiceNames = Array.from(selectedService).map(id => 
          services.find(s => s.id === id)?.name
        );
        fetchedData = fetchedData.filter(item => selectedServiceNames.includes(item.service));
      }
    } else {
      // Counter report (unchanged)
      const selectedCounters = selectedCounter.has("All") 
      ? counters.filter(c => c.id !== "All")
      : counters.filter(c => selectedCounter.has(c.id));

    for (const counter of selectedCounters) {
      const counterNumber = counter.name.replace("Counter ", "");
      const completedTokensRef = doc(db, `counter${counterNumber}`, "CompletedTokens");
      const completedTokensSnapshot = await getDoc(completedTokensRef);
      
      if (completedTokensSnapshot.exists()) {
        const historyData = completedTokensSnapshot.data()?.History || [];
        
        fetchedData = [
          ...fetchedData,
          ...historyData.map(item => ({
            name: item.name || 'N/A',
            service: item.service || 'N/A',
            serviceTime: item.serviceTime ? new Date(item.serviceTime.seconds * 1000).toLocaleString() : 'N/A',
            token: item.token || 'N/A',
            counter: counter.name
          })),
        
        ];
      }
    }
    }

    fetchedData = fetchedData.map((item, index) => ({ ...item, siNo: index + 1 }));
    setData(fetchedData);
  };
  
  const filteredItems = useMemo(() => {
    let filteredData = [...data];
    if (filterValue) {
      filteredData = filteredData.filter((item) =>
        Object.values(item).some((val) =>
          val.toString().toLowerCase().includes(filterValue.toLowerCase())
        )
      );
    }
    return filteredData;
  }, [data, filterValue]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const renderCell = (item, columnKey) => {
    const cellValue = item[columnKey];
    if (filterValue && cellValue) {
      const parts = cellValue.toString().split(new RegExp(`(${filterValue})`, 'gi'));
      return (
        <span>
          {parts.map((part, i) => 
            part.toLowerCase() === filterValue.toLowerCase() ? 
              <mark key={i}>{part}</mark> : part
          )}
        </span>
      );
    }
    return cellValue;
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "report.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({ html: '#reportTable' });
    doc.save("report.pdf");
  };

  const columns = reportType === "service" 
    ? ["siNo", "name", "service", "tokenNumber", "createdAt"]
    : ["siNo", "name", "service", "serviceTime", "token", "counter"];

  return (
    <div className="flex">
      <div className="w-64 fixed h-full">
        <Navbar />
      </div>
      <div className="flex-1 ml-64 p-8">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between gap-3 items-end flex-wrap">
            <Dropdown>
              <DropdownTrigger>
                <Button endContent={<MdArrowDropDown />} variant="flat">
                  Report Type: {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Select Report Type"
                selectedKeys={new Set([reportType])}
                selectionMode="single"
                onSelectionChange={(keys) => setReportType(Array.from(keys)[0])}
              >
                <DropdownItem key="counter">Counter</DropdownItem>
                <DropdownItem key="service">Service</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            {reportType === "counter" && (
              <Dropdown>
                <DropdownTrigger>
                  <Button endContent={<MdArrowDropDown />} variant="flat">
                    Counter: {Array.from(selectedCounter).map(id => counters.find(c => c.id === id)?.name).join(", ")}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="Select Counter"
                  selectedKeys={selectedCounter}
                  selectionMode="multiple"
                  onSelectionChange={setSelectedCounter}
                >
                  {counters.map((counter) => (
                    <DropdownItem key={counter.id}>{counter.name}</DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            )}
            {reportType === "service" && (
              <Dropdown>
                <DropdownTrigger>
                <Button endContent={<MdArrowDropDown />} variant="flat">
                    Service: {Array.from(selectedService).map(id => services.find(s => s.id === id)?.name).join(", ")}
                </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disallowEmptySelection
                  aria-label="Select Service"
                  selectedKeys={selectedService}
                  selectionMode="multiple"
                  onSelectionChange={setSelectedService}
                >
                {services.map((service) => (
                    <DropdownItem key={service.id}>{service.name}</DropdownItem>
                    ))}
                </DropdownMenu>
              </Dropdown>
            )}
            <Button color="primary" onPress={exportToExcel}>
              Export to Excel
            </Button>
            <Button color="secondary" onPress={exportToPDF}>
              Export to PDF
            </Button>
          </div>
          
          <Input
            isClearable
            className="w-full sm:max-w-[30%]"
            placeholder="Search..."
            startContent={<MdSearch />}
            value={filterValue}
            onClear={() => setFilterValue("")}
            onValueChange={setFilterValue}
          />
          
          <Table
            aria-label="Report table"
            id="reportTable"
            bottomContent={
              <div className="flex w-full justify-center">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="primary"
                  page={page}
                  total={pages}
                  onChange={setPage}
                />
              </div>
            }
            bottomContentPlacement="outside"
          >
            <TableHeader>
              {columns.map((columnKey) => (
                <TableColumn key={columnKey}>{columnKey.toUpperCase()}</TableColumn>
              ))}
            </TableHeader>
            <TableBody items={items}>
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}