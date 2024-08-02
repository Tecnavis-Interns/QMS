import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { db } from '../../services/firebase'; // Adjust this import path as needed
import { collection, getDocs, onSnapshot } from 'firebase/firestore';

const getRandomBrightColor = () => {
  const hue = Math.floor(Math.random() * 360); // Random hue between 0 and 360
  const saturation = Math.floor(Math.random() * 41) + 60; // Saturation between 60% and 100%
  const lightness = Math.floor(Math.random() * 21) + 60; // Lightness between 60% and 80%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};


const TokenChart = () => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "ChartData"), (snapshot) => {
      try {
        const ChartData = snapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        }));
  
        // Process the data
        const tokenRequests = ChartData.reduce((acc, request) => {
          const date = request.createdAt.toDateString(); // Use date as a key
          if (!acc[date]) {
            acc[date] = 0;
          }
          acc[date]++;
          return acc;
        }, {});
  
        // Extract labels and data
        const labels = Object.keys(tokenRequests);
        const data = Object.values(tokenRequests);
  
        const colors = labels.map(() => getRandomBrightColor());
  
        setChartData({
          labels: labels,
          datasets: [{
            label: '# of Token Requests',
            data: data,
            backgroundColor: colors,
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1
          }]
        });
  
      } catch (error) {
        console.error("Error processing token data:", error);
      }
    }, (error) => {
      console.error("Error fetching token data:", error);
    });
  
    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const options = {
    plugins: {
      title: {
        display: true,
        text: 'Token Requests Distribution'
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          // Custom legend label styling
          boxWidth: 20,
          padding: 10,
          // Use a custom function to stack the labels vertically
          generateLabels: (chart) => {
            const data = chart.data;
            if (!data.labels.length) return [];
  
            return data.labels.map((label, index) => ({
              text: label,
              fillStyle: data.datasets[0].backgroundColor[index],
              strokeStyle: data.datasets[0].borderColor[index],
              lineWidth: data.datasets[0].borderWidth,
              hidden: false,
              // Adjust the styling here to control how the labels are displayed
            }));
          }
        }
      }
    }
  };
  

  if (!chartData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TokenChart;
