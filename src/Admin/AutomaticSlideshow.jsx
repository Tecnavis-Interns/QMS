import { useState, useEffect } from 'react';
import { getDownloadURL, listAll, ref } from 'firebase/storage';
import { storage } from '../firebase';

const AutomaticSlideshow = ({ refresh, setRefresh }) => {
  const [mediaList, setMediaList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycleComplete, setCycleComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentVideoDuration, setCurrentVideoDuration] = useState(null);
  const mediaListRef = ref(storage, "media/");

  useEffect(() => {
    const fetchMedia = async () => {
      console.log("Fetching media...");
      setIsLoading(true);
      setError(null);
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
        console.log("Media fetched:", mediaItems);
        setMediaList(mediaItems);
        setCurrentIndex(0); // Reset to first media after fetching new media
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching media:", error);
        setError("Failed to load media. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchMedia();
  }, [refresh]);

  useEffect(() => {
    let interval;
    if (mediaList.length > 0) {
      const currentMedia = mediaList[currentIndex];
      if (currentMedia.isVideo) {
        interval = setTimeout(() => {
          setCurrentIndex((prevIndex) => {
            const newIndex = (prevIndex + 1) % mediaList.length;
            if (newIndex === 0) {
              console.log("Cycle complete, triggering refresh");
              setCycleComplete(true);
            }
            return newIndex;
          });
        }, currentVideoDuration || 6000); // use video duration or default 6s
      } else {
        interval = setInterval(() => {
          setCurrentIndex((prevIndex) => {
            const newIndex = (prevIndex + 1) % mediaList.length;
            if (newIndex === 0) {
              console.log("Cycle complete, triggering refresh");
              setCycleComplete(true);
            }
            return newIndex;
          });
        }, 6000); // default 6s for images
      }
    }

    return () => clearInterval(interval);
  }, [mediaList, currentIndex, currentVideoDuration]);

  useEffect(() => {
    if (cycleComplete) {
      setCycleComplete(false);
      console.log("Toggling refresh");
      setRefresh(prev => !prev);
    }
  }, [cycleComplete, setRefresh]);

  const handleVideoDurationChange = (event) => {
    setCurrentVideoDuration(event.target.duration * 1000); // convert to milliseconds
  };

  const handleVideoEnded = () => {
    setCurrentIndex((prevIndex) => {
      const newIndex = (prevIndex + 1) % mediaList.length;
      if (newIndex === 0) {
        console.log("Cycle complete, triggering refresh");
        setCycleComplete(true);
      }
      return newIndex;
    });
  };

  // if (isLoading) {
  //   return <div className="relative border rounded-lg shadow-lg overflow-hidden w-full h-[600px] flex items-center justify-center">Loading...</div>;
  // }

  if (error) {
    return <div className="relative border rounded-lg shadow-lg overflow-hidden w-full h-[600px] flex items-center justify-center text-red-500">{error}</div>;
  }

  if (mediaList.length === 0) {
    return <div className="relative border rounded-lg shadow-lg overflow-hidden w-full h-[600px] flex items-center justify-center">No media available</div>;
  }

  return (
    <div className="relative border rounded-lg shadow-lg overflow-hidden w-full h-[600px]">
      {mediaList[currentIndex].isVideo ? (
        <video
          key={mediaList[currentIndex].url}
          src={mediaList[currentIndex].url}
          autoPlay
          onLoadedMetadata={handleVideoDurationChange}
          onEnded={handleVideoEnded}
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={mediaList[currentIndex].url}
          alt="Automatic Slideshow"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export default AutomaticSlideshow;