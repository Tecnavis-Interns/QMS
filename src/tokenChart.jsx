import React from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const dummyRequests = [
  { userId: "user1", name: "John Doe", service: "Personal Service (Income, Community, Nativity, etc)", tokenNumber: 1, createdAt: "2023-07-01T10:00:00Z" },
  { userId: "user2", name: "Jane Smith", service: "Personal Service (Income, Community, Nativity, etc)", tokenNumber: 2, createdAt: "2023-07-01T11:00:00Z" },
  { userId: "user3", name: "Alice Johnson", service: "Home Related Service", tokenNumber: 1, createdAt: "2023-07-02T09:00:00Z" },
  { userId: "user4", name: "Bob Brown", service: "Land Related Service", tokenNumber: 1, createdAt: "2023-07-02T10:00:00Z" },
  { userId: "user5", name: "Charlie Davis", service: "Education Related Service", tokenNumber: 1, createdAt: "2023-07-03T08:00:00Z" },
  { userId: "user6", name: "Diana Evans", service: "Other Services", tokenNumber: 1, createdAt: "2023-07-03T09:30:00Z" },
  { userId: "user7", name: "Eva Green", service: "Personal Service (Income, Community, Nativity, etc)", tokenNumber: 3, createdAt: "2023-07-04T11:00:00Z" },
  { userId: "user8", name: "Frank Harris", service: "Home Related Service", tokenNumber: 2, createdAt: "2023-07-04T12:00:00Z" },
  { userId: "user9", name: "Grace Lee", service: "Land Related Service", tokenNumber: 2, createdAt: "2023-07-05T10:00:00Z" },
  { userId: "user10", name: "Henry Miller", service: "Education Related Service", tokenNumber: 2, createdAt: "2023-07-05T11:00:00Z" },
  { userId: "user11", name: "Ivy Nelson", service: "Other Services", tokenNumber: 2, createdAt: "2023-07-06T08:00:00Z" },
  { userId: "user12", name: "Jack Owens", service: "Personal Service (Income, Community, Nativity, etc)", tokenNumber: 4, createdAt: "2023-07-06T09:00:00Z" },
];

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Group requests by day and count tokens
const tokenRequestsByDay = dummyRequests.reduce((acc, request) => {
  const date = formatDate(new Date(request.createdAt));
  if (!acc[date]) {
    acc[date] = 0;
  }
  acc[date]++;
  return acc;
}, {});

const labels = Object.keys(tokenRequestsByDay);
const data = Object.values(tokenRequestsByDay);

const TokenChart = () => {
  const chartData = {
    labels: labels,
    datasets: [{
      label: '# of Token Requests',
      data: data,
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Token Requests Per Day'
      },
      legend: {
        display: false,
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TokenChart;