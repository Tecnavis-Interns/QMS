import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { Button } from '@nextui-org/react';
import { storage } from "../firebase"; 
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 } from 'uuid';
import { Input } from "@nextui-org/input";

const Slideshow = ({ imageList, currentImageIndex, nextImage, prevImage, onDeleteImage }) => {
  return (
    <div className="relative border rounded-lg shadow-lg overflow-hidden" style={{ maxWidth: '500px', width: '100%', height: 'auto' }}>
      <img
        src={imageList[currentImageIndex].url}
        alt="Slideshow"
        className="w-full h-full object-cover"
        style={{ aspectRatio: '1 / 1' }} // Maintain aspect ratio 1:1
      />
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 ">
        <button onClick={prevImage} className="text-white">&#10094;</button>
        <button onClick={nextImage} className="text-white">&#10095;</button>
      </div>
      <Button
        auto
        flat
        color="error"
        onClick={() => onDeleteImage(imageList[currentImageIndex].ref)}
        className="absolute bottom-2 right-2 bg-[#6236F5] p-2 px-5 rounded-md text-white w-32 mt-8"
      >
        Delete
      </Button>
    </div>
  );
};

const Ads = ({ onShowSlideshow }) => {
  const [imageUpload, setImageUpload] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // State to track current image index
  const imageListRef = ref(storage, "images/");


  

  const uploadImage = () => {
    if (imageUpload == null) return;

    const imageRef = ref(storage, `images/${imageUpload.name + v4()}`);
    uploadBytes(imageRef, imageUpload).then(() => {
      alert("Image uploaded");
      fetchImages(); // Fetch images again after upload
    });
  };

  const fetchImages = () => {
    setImageList([]); // Clear the image list to avoid duplicates
    listAll(imageListRef).then((response) => {
      const urls = response.items.map((item) => {
        return getDownloadURL(item).then((url) => {
          return { url, ref: item }; // Save the reference to delete later
        });
      });
      Promise.all(urls).then((urlList) => setImageList(urlList));
    });
  };

  const deleteImage = (imageRef) => {
    deleteObject(imageRef).then(() => {
      alert("Image deleted");
      fetchImages(); // Fetch images again after delete
    }).catch((error) => {
      console.error("Error deleting image: ", error);
    });
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageList.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + imageList.length) % imageList.length);
  };

 const showSlideshow = () => {
    if (onShowSlideshow) {
      onShowSlideshow(imageList, currentImageIndex, nextImage, prevImage); // Removed deleteImage parameter
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="fixed h-full">
        <Navbar />
      </div>
      <div className="flex flex-col flex-1 ml-64 p-4">
        <div className="flex justify-center mt-4">
          <div className="flex w-full flex-wrap justify-center md:flex-nowrap ">
                    <div class="max-w-sm">
            <form>
              <label class="block">
                <span class="sr-only">Choose profile photo</span>
                <input type="file"  onChange={(event) => setImageUpload(event.target.files[0])} className="mb-2" class="block w-full text-sm text-gray-500
                  file:me-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-[#6236F5] file:text-white
                  hover:file:bg-blue-700
                  file:disabled:opacity-50 file:disabled:pointer-events-none
                  dark:text-neutral-500
                  dark:file:bg-blue-500
                  dark:hover:file:bg-blue-400
                "/>
              </label>
            </form>
          </div>
          
            <Button onClick={uploadImage}>Upload</Button>
           
          </div>
        </div>
        {imageList.length > 0 && (
          <div className="flex justify-center items-center h-full">
            <Slideshow
              imageList={imageList}
              currentImageIndex={currentImageIndex}
              nextImage={nextImage}
              prevImage={prevImage}
              onDeleteImage={deleteImage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Ads;
