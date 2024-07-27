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
  Tooltip
} from "@nextui-org/react";
import Navbar from "./Navbar";
import { MdArrowDropDown, MdSearch } from "react-icons/md";
import { collection, doc, getDocs, getDoc, query, where } from "firebase/firestore";
import { db } from '../../services/firebase';
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ReportSection() {
  const [data, setData] = useState([]);
  const [counters, setCounters] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCounter, setSelectedCounter] = useState(new Set(["All"]));
  const [selectedService, setSelectedService] = useState(new Set(["All"]));
  const [reportType, setReportType] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [filterValue, setFilterValue] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    fetchCountersAndServices();
  }, []);

  useEffect(() => {
    if (reportType) {
      fetchData();
    }
  }, [selectedCounter, selectedService, reportType, startDate, endDate]);

  const fetchCountersAndServices = async () => {
    try {
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
        prefix: doc.data().prefix
      }));
      setServices([{ id: "All", name: "All", prefix: "" }, ...fetchedServices]);
    } catch (error) {
      console.error("Error fetching counters and services:", error);
    }
  };

  const fetchData = async () => {
    try {
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
          createdAt: doc.data().createdAt.toDate(),
        }));

        if (!selectedService.has("All")) {
          const selectedServiceNames = Array.from(selectedService).map(id => 
            services.find(s => s.id === id)?.name
          );
          fetchedData = fetchedData.filter(item => selectedServiceNames.includes(item.service));
        }
      } else {
        const selectedCounters = selectedCounter.has("All") 
          ? counters.filter(c => c.id !== "All")
          : counters.filter(c => selectedCounter.has(c.id));

        for (const counter of selectedCounters) {
          const counterName = counter.name.replace("Counter ", "").toLowerCase().replace(/\s/g, "");
          
          const completedTokensRef = doc(db, `counter${counterName}`, "CompletedTokens");
          const completedTokensSnapshot = await getDoc(completedTokensRef);
          
          if (completedTokensSnapshot.exists()) {
            const snapshotData = completedTokensSnapshot.data();
            
            if (!snapshotData.history || !Array.isArray(snapshotData.history)) {
              continue;
            }
            const historyData = snapshotData.history;
            
            fetchedData = [
              ...fetchedData,
              ...historyData.map((item, index) => {
                const uniqueKey = `${item?.token || 'unknown'}-${item?.completedAt || Date.now()}-${index}`;
                console.log('/////////////////////',item.serviceTime);
                return {
                  id: uniqueKey,
                  name: item?.name || 'N/A',
                  service: item?.service || 'N/A',
                  serviceTime: item?.serviceTime ? `${item.serviceTime} minutes` : '0 minutes',
                  token: item?.token || 'N/A',
                  counter: counter.name,
                  completedAt: item?.completedAt ? new Date(item.completedAt) : new Date(),
                };
              }),
            ];
          }
        }
      }

      // Apply date range filter
      if (startDate && endDate) {
        fetchedData = fetchedData.filter(item => {
          const itemDate = reportType === "service" ? item.createdAt : item.completedAt;
          return itemDate >= startDate && itemDate <= endDate;
        });
      }

      console.log("Fetched data:", fetchedData);
      fetchedData = fetchedData.map((item, index) => ({ 
        ...item, 
        siNo: index + 1,
        createdAt: item.createdAt ? item.createdAt.toLocaleString() : 'N/A',
        completedAt: item.completedAt ? item.completedAt.toLocaleString() : 'N/A'
      }));
      setData(fetchedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
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

  const hasData = data.length > 0;

  const exportToExcel = () => {
    if (!hasData) {
      console.log("No data to export");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "report.xlsx");
  };

  const exportToPDF = () => {
    if (!hasData) {
      console.log("No data to export");
      return;
    }
    const doc = new jsPDF();
    const columns = reportType === "service"
      ? ["siNo", "name", "service", "tokenNumber", "createdAt"]
      : ["siNo", "name", "service", "serviceTime", "token", "counter"];
  
    const rows = data.map(item => columns.map(columnKey => item[columnKey]));
  
    doc.autoTable({
      head: [columns.map(column => column.toUpperCase())],
      body: rows,
      startY: 10,
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      theme: 'striped',
      didDrawPage: function (data) {
        const str = "Page " + doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
      }
    });
  
    doc.save("report.pdf");
  };
  
  const columns = reportType === "service" 
    ? ["siNo", "name", "service", "tokenNumber", "createdAt"]
    : ["siNo", "name", "service", "serviceTime", "token", "counter"];

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 fixed h-full">
        <Navbar />
      </div>
      <div className="flex-1 ml-64 p-8 overflow-auto">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3">
              <Dropdown>
                <DropdownTrigger>
                  <Button endContent={<MdArrowDropDown />} variant="flat">
                    Report Type: {reportType ? reportType.charAt(0).toUpperCase() + reportType.slice(1) : "Select"}
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
                  <DropdownItem key="service">Token</DropdownItem>
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
              <div className="flex gap-2">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Start Date"
                  className="px-3 py-2 rounded-md border border-gray-300"
                />
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  placeholderText="End Date"
                  className="px-3 py-2 rounded-md border border-gray-300"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Tooltip content={hasData ? "Export to Excel" : "No data to export"}>
                <Button 
                  color="primary" 
                  onPress={exportToExcel}
                  isDisabled={!hasData}
                >
                  Export to Excel
                </Button>
              </Tooltip>
              <Tooltip content={hasData ? "Export to PDF" : "No data to export"}>
                <Button 
                  color="secondary" 
                  onPress={exportToPDF}
                  isDisabled={!hasData}
                >
                  Export to PDF
                </Button>
              </Tooltip>
            </div>
          </div>
          
          {reportType ? (
            <>
              <Input
                isClearable
                className="w-full sm:max-w-[30%] mb-4"
                placeholder="Search..."
                startContent={<MdSearch />}
                value={filterValue}
                onClear={() => setFilterValue("")}
                onValueChange={setFilterValue}
              />
              
              <Table
                aria-label="Report table"
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
            </>
          ) : (
            <div className="flex justify-center items-center h-[calc(100vh-200px)]">
              <p className="text-l text-gray-600">Please select a report type to view the data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
