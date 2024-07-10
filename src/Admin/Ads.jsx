import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { Button } from '@nextui-org/react';
import { storage } from "../firebase";
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';

const Slideshow = ({ mediaList, currentMediaIndex, nextMedia, prevMedia, onDeleteMedia }) => {
  if (!mediaList || mediaList.length === 0) return null;

  const currentMedia = mediaList[currentMediaIndex];

  return (
    <div className="relative border rounded-lg shadow-lg overflow-hidden" style={{ maxWidth: '500px', width: '100%', height: 'auto' }}>
      {currentMedia.isVideo ? (
        <video
          src={currentMedia.url}
          controls
          className="w-full h-full object-cover"
          style={{ aspectRatio: '1 / 1' }}
        />
      ) : (
        <img
          src={currentMedia.url}
          alt="Slideshow"
          className="w-full h-full object-cover"
          style={{ aspectRatio: '1 / 1' }}
        />
      )}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 ">
        <button onClick={prevMedia} className="text-white">&#10094;</button>
        <button onClick={nextMedia} className="text-white">&#10095;</button>
      </div>
      <Button
        auto
        flat
        color="error"
        onClick={() => onDeleteMedia(currentMedia.ref)}
        className="absolute bottom-2 right-2 bg-[#6236F5] p-2 px-5 rounded-md text-white w-32 mt-8"
      >
        Delete
      </Button>
    </div>
  );
};

const Ads = () => {
  const [mediaUpload, setMediaUpload] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [videoList, setVideoList] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const imageListRef = ref(storage, "images/");
  const videoListRef = ref(storage, "videos/");

  const uploadMedia = (mediaUpload) => {
    if (mediaUpload == null) return;

    const isVideo = mediaUpload.type.startsWith('video/');
    const mediaRef = ref(storage, `${isVideo ? 'videos' : 'images'}/${mediaUpload.name + v4()}`);
    
    toast.promise(
      uploadBytes(mediaRef, mediaUpload),
      {
        loading: 'Uploading...',
        success: () => {
          setRefresh(prev => !prev);
          return `${isVideo ? 'Video' : 'Image'} uploaded successfully!`;
        },
        error: 'Upload failed',
      }
    );
  };

  const fetchMedia = () => {
    setImageList([]);
    setVideoList([]);

    listAll(imageListRef).then((response) => {
      const urls = response.items.map((item) => {
        return getDownloadURL(item).then((url) => {
          return { url, ref: item, isVideo: false };
        });
      });
      Promise.all(urls).then((urlList) => {
        setImageList(urlList);
      });
    });

    listAll(videoListRef).then((response) => {
      const urls = response.items.map((item) => {
        return getDownloadURL(item).then((url) => {
          return { url, ref: item, isVideo: true };
        });
      });
      Promise.all(urls).then((urlList) => {
        setVideoList(urlList);
      });
    });
  };


  const deleteMedia = (mediaRef) => {
    toast((t) => (
      <div>
        <p>Are you sure you want to delete this media?</p>
        &nbsp;&nbsp;&nbsp;
        <div>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              confirmDelete(mediaRef);
            }}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
          &nbsp;&nbsp;&nbsp;
          <button onClick={() => toast.dismiss(t.id)}
                        style={{
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
            >Cancel</button>
        </div>
      </div>
    ), {
      duration:5000,
      style: {
        background: '#FFF3CD',
        color: '#856404',
        border: '1px solid #FFEEBA',
      },
    });
  };
  
  const confirmDelete = (mediaRef) => {
    toast.promise(
      deleteObject(mediaRef),
      {
        loading: 'Deleting...',
        success: () => {
          setRefresh(prev => !prev);
          return 'Media deleted successfully';
        },
        error: 'Failed to delete media',
      }
    );
  };

  const nextMedia = () => {
    setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % (imageList.length + videoList.length));
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prevIndex) => (prevIndex - 1 + imageList.length + videoList.length) % (imageList.length + videoList.length));
  };

  useEffect(() => {
    fetchMedia();
  }, [refresh]);

  useEffect(() => {
    if (currentMediaIndex >= (imageList.length + videoList.length)) {
      setCurrentMediaIndex(0);
    }
  }, [imageList, videoList]);

  const combinedMediaList = [...imageList, ...videoList];

  return (
    <div className="flex min-h-screen">
      <div className="fixed h-full">
        <Navbar />
      </div>
      <div className="flex flex-col flex-1 ml-64 p-4">
        <div className="flex justify-center mt-4">
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
                      file:bg-[#6236F5] file:text-white
                      hover:file:bg-blue-700
                      file:disabled:opacity-50 file:disabled:pointer-events-none
                      dark:text-neutral-500
                      dark:file:bg-blue-500
                      dark:hover:file:bg-blue-400"
                  />
                </label>
              </form>
            </div>
            <Button onClick={() => uploadMedia(mediaUpload)}>Upload Media</Button>
          </div>
        </div>
        {combinedMediaList.length > 0 && (
          <div className="flex justify-center items-center h-full">
            <Slideshow
              mediaList={combinedMediaList}
              currentMediaIndex={currentMediaIndex}
              nextMedia={nextMedia}
              prevMedia={prevMedia}
              onDeleteMedia={deleteMedia}
            />
          </div>
        )}
      </div>
      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
};

export default Ads;