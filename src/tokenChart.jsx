import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { db } from './firebase'; // Adjust this import path as needed
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import moment from 'moment';

const TokenChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const requests = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        }));

        // Process the data
        const tokenRequestsByDay = requests.reduce((acc, request) => {
          const date = moment(request.createdAt).format('YYYY-MM-DD');
          if (!acc[date]) {
            acc[date] = 0;
          }
          acc[date]++;
          return acc;
        }, {});

        const labels = Object.keys(tokenRequestsByDay).sort();
        const data = labels.map(label => tokenRequestsByDay[label]);

        setChartData({
          labels: labels,
          datasets: [{
            label: '# of Token Requests',
            data: data,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        });

      } catch (error) {
        console.error("Error fetching token data:", error);
      }
    };

    fetchData();
  }, []);

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

  if (!chartData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TokenChart;