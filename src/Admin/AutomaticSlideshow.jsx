import React, { useState, useEffect } from 'react';
import { getDownloadURL, listAll, ref } from 'firebase/storage';
import { storage } from '../firebase';


const AutomaticSlideshow = ({ refresh, setRefresh }) => { // Accept setRefresh as prop
  const [imageList, setImageList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageListRef = ref(storage, 'images/');

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await listAll(imageListRef);
        const urls = await Promise.all(response.items.map(item => getDownloadURL(item)));
        setImageList(urls);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    };

    fetchImages();
  }, [refresh]); 

  useEffect(() => {
    if (imageList.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % imageList.length);
      }, 6000);

      return () => clearInterval(interval);
    }
  }, [imageList]);

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