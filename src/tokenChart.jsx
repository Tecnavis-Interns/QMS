import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { db } from './firebase'; // Adjust this import path as needed
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import moment from 'moment';

const TokenChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const oneWeekAgo = moment().subtract(7, 'days').startOf('day').toDate();
        
        const q = query(
          collection(db, "ChartData"),
          where("createdAt", ">=", oneWeekAgo),
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const ChartData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        }));

        // Generate an array of the last 7 days
        const last7Days = Array.from({length: 7}, (_, i) => {
          return moment().subtract(i, 'days').format('YYYY-MM-DD');
        }).reverse();

        // Process the data
        const tokenRequestsByDay = ChartData.reduce((acc, request) => {
          const date = moment(request.createdAt).format('YYYY-MM-DD');
          if (!acc[date]) {
            acc[date] = 0;
          }
          acc[date]++;
          return acc;
        }, {});

        // Ensure all days in the last week are represented, even if there were no requests
        const data = last7Days.map(day => tokenRequestsByDay[day] || 0);

        setChartData({
          labels: last7Days,
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
        text: 'Token Requests Per Day (Last 7 Days)'
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