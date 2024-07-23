import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './Navbar';
import { Card, CardBody, CardFooter, Image, Button } from "@nextui-org/react";
import { storage } from "../firebase";
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';

const MediaUploadForm = ({ onUpload }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleUploadClick = () => {
    if (file) {
      onUpload(file);
      setFile(null);
    }
  };

  return (
    <div className="flex w-full flex-wrap justify-center md:flex-nowrap">
      <div className="max-w-sm">
        <label className="block">
          <span className="sr-only">Choose media</span>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
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
      </div>
      <Button onClick={handleUploadClick} className="ml-2">Upload Media</Button>
    </div>
  );
};

const MediaCard = ({ item, onDelete }) => (
  <Card shadow="sm" isPressable onPress={() => console.log("item pressed")}>
    <CardBody className="overflow-visible p-0">
      {item.isVideo ? (
        <video src={item.url} className="w-full object-cover h-[140px]" controls />
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
      <div onClick={(e) => e.stopPropagation()}>
        <Button
          color="error"
          auto
          flat
          size="sm"
          onClick={() => onDelete(item.ref)}
          className="transition-colors duration-200 ease-in-out bg-red-0 text-black hover:bg-red-500"
        >
          Delete
        </Button>
      </div>
    </CardFooter>
  </Card>
);

const Ads = () => {
  const [mediaList, setMediaList] = useState([]);
  const mediaListRef = ref(storage, "media/");

  const fetchMedia = useCallback(async () => {
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
  }, [mediaListRef]);

  const uploadMedia = async (file) => {
    if (!file) return;

    const mediaRef = ref(storage, `media/${file.name + v4()}`);
    try {
      await toast.promise(
        uploadBytes(mediaRef, file),
        {
          loading: 'Uploading...',
          success: 'Media uploaded successfully!',
          error: 'Upload failed',
        }
      );
      fetchMedia(); // Refresh the media list after successful upload
    } catch (error) {
      console.error("Error uploading media:", error);
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
      fetchMedia(); // Refresh the media list after successful deletion
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return (
    <div className="flex min-h-screen">
      <div className="fixed h-full">
        <Navbar />
      </div>
      <div className="flex flex-col flex-1 ml-64 p-4">
        <div className="flex justify-center mt-4 mb-8">
          <MediaUploadForm onUpload={uploadMedia} />
        </div>
        <div className="gap-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {mediaList.map((item, index) => (
            <MediaCard key={index} item={item} onDelete={deleteMedia} />
          ))}
        </div>
      </div>
      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
};

export default Ads;
