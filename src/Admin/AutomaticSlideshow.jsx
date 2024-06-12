import React, { useState, useEffect } from 'react';
import { getDownloadURL, listAll, ref } from 'firebase/storage';
import { storage } from '../firebase';

const AutomaticSlideshow = ({ refresh, setRefresh }) => {
  const [imageList, setImageList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycleComplete, setCycleComplete] = useState(false);
  const imageListRef = ref(storage, 'images/');

  useEffect(() => {
    const fetchImages = async () => {
      console.log("Fetching images...");
      try {
        const response = await listAll(imageListRef);
        const urls = await Promise.all(response.items.map(item => getDownloadURL(item)));
        setImageList(urls);
        console.log("Images fetched:", urls);
        setCurrentIndex(0); // Reset to first image after fetching new images
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, [refresh]);

  useEffect(() => {
    if (imageList.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % imageList.length;
          if (newIndex === 0) {
            console.log("Cycle complete, triggering refresh");
            setCycleComplete(true);
          }
          return newIndex;
        });
      }, 6000);

      return () => clearInterval(interval);
    }
  }, [imageList]);

  useEffect(() => {
    if (cycleComplete) {
      setCycleComplete(false);
      console.log("Toggling refresh");
      setRefresh(prev => !prev);
    }
  }, [cycleComplete, setRefresh]);

  return (
    <div className="relative border rounded-lg shadow-lg overflow-hidden w-full h-[600px]">
      {imageList.length > 0 ? (
        <img
          src={imageList[currentIndex]}
          alt="Automatic Slideshow"
          className="w-full h-full object-cover" 
        />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default AutomaticSlideshow;
