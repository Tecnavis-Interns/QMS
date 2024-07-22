import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { Card, CardBody, CardFooter, Image, Button } from "@nextui-org/react";
import { storage } from "../firebase";
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';

const Ads = () => {
  const [mediaUpload, setMediaUpload] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const mediaListRef = ref(storage, "media/");

  const uploadMedia = async (mediaUpload) => {
    if (mediaUpload == null) return;

    const mediaRef = ref(storage, `media/${mediaUpload.name + v4()}`);
    try {
      await toast.promise(
        uploadBytes(mediaRef, mediaUpload),
        {
          loading: 'Uploading...',
          success: 'Media uploaded successfully!',
          error: 'Upload failed',
        }
      );
      // After successful upload, fetch the new list of media
      fetchMedia();
    } catch (error) {
      console.error("Error uploading media:", error);
    }
  };

  const fetchMedia = async () => {
    try {
      const response = await listAll(mediaListRef);
      const mediaItems = await Promise.all(
        response.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return { 
            url, 
            ref: item, 
            name: item.name, 
            isVideo: item.name.toLowerCase().includes('.mp4') || item.name.toLowerCase().includes('.mov')
          };
        })
      );
      setMediaList(mediaItems);
    } catch (error) {
      console.error("Error fetching media:", error);
      toast.error("Failed to fetch media");
    }
  };

  const deleteMedia = (mediaRef) => {
    toast((t) => (
      <div>
        <p>Are you sure you want to delete this media?</p>
        <div className="mt-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmDelete(mediaRef);
            }}
            className="bg-red-500 text-white border-none px-3 py-1 rounded-md cursor-pointer mr-2"
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-500 text-white border-none px-3 py-1 rounded-md cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      style: {
        background: '#FFF3CD',
        color: '#856404',
        border: '1px solid #FFEEBA',
      },
    });
  };
  
  const confirmDelete = async (mediaRef) => {
    try {
      await toast.promise(
        deleteObject(mediaRef),
        {
          loading: 'Deleting...',
          success: 'Media deleted successfully',
          error: 'Failed to delete media',
        }
      );
      // After successful deletion, fetch the updated list of media
      fetchMedia();
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  return (
    <div className="flex min-h-screen">
      <div className="fixed h-full">
        <Navbar />
      </div>
      <div className="flex flex-col flex-1 ml-64 p-4">
        <div className="flex justify-center mt-4 mb-8">
          <div className="flex w-full flex-wrap justify-center md:flex-nowrap">
            <div className="max-w-sm">
              <form>
                <label className="block">
                  <span className="sr-only">Choose media</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(event) => {
                      const file = event.target.files[0];
                      setMediaUpload(file);
                    }}
                    className="mb-2 block w-full text-sm text-gray-500
                      file:me-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-[#908fe2] file:text-white
                      hover:file:bg-[#6e71d6]
                      file:disabled:opacity-50 file:disabled:pointer-events-none
                      dark:text-neutral-500
                      dark:file:bg-red-500
                      dark:hover:file:bg-red-400"
                  />
                </label>
              </form>
            </div>
            <Button onClick={() => uploadMedia(mediaUpload)} className="ml-2">Upload Media</Button>
          </div>
        </div>
        
        <div className="gap-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {mediaList.map((item, index) => (
            <Card shadow="sm" key={index} isPressable onPress={() => console.log("item pressed")}>
              <CardBody className="overflow-visible p-0">
                {item.isVideo ? (
                  <video
                    src={item.url}
                    className="w-full object-cover h-[140px]"
                    controls
                  />
                ) : (
                  <Image
                    shadow="sm"
                    radius="lg"
                    width="100%"
                    alt={item.name}
                    className="w-full object-cover h-[140px]"
                    src={item.url}
                  />
                )}
              </CardBody>
              <CardFooter className="text-small justify-between">
                <b>{item.name.split('-')[0]}</b>
                <Button 
                  color="error" 
                  auto 
                  flat 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card press event
                    deleteMedia(item.ref);
                  }}
                  className="transition-colors duration-200 ease-in-out bg-red-0 text-black hover:bg-red-500"
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
};

export default Ads;