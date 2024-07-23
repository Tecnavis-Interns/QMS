import React, { useState, useEffect, useRef } from 'react';
import { getDownloadURL, listAll, ref } from 'firebase/storage';
import { storage } from '../firebase';

const AutomaticSlideshow = ({ refresh, setRefresh }) => {
  const [mediaList, setMediaList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const mediaListRef = ref(storage, "media/");
  const containerRef = useRef(null);
  const mediaRefs = useRef([]);

  useEffect(() => {
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
      }
    };

    fetchMedia();
  }, [refresh]);

  useEffect(() => {
    const preloadNextMedia = (index) => {
      const nextIndex = (index + 1) % mediaList.length;
      const nextMedia = mediaRefs.current[nextIndex];
      if (nextMedia) {
        if (nextMedia.tagName === 'VIDEO') {
          nextMedia.load();
        }
      }
    };

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % mediaList.length;
        preloadNextMedia(newIndex);
        if (newIndex === 0) {
          setRefresh(prev => !prev);
        }
        return newIndex;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [mediaList, setRefresh]);

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          mediaRefs.current.forEach((media) => {
            if (media) {
              media.style.width = `${width}px`;
              media.style.height = `${height}px`;
            }
          });
        }
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[600px] overflow-hidden">
      {mediaList.map((media, index) => (
        <div
          key={media.url}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {media.isVideo ? (
            <video
              ref={(el) => (mediaRefs.current[index] = el)}
              src={media.url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              ref={(el) => (mediaRefs.current[index] = el)}
              src={media.url}
              alt={`Slideshow ${index}`}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default React.memo(AutomaticSlideshow);