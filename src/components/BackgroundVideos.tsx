import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BASE_ASSETS_URL, VIDEOS } from "../constants";

export const BackgroundVideos: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const video = document.getElementById(`video-${currentIndex}`) as HTMLVideoElement;
    if (video) {
      video.onended = () => {
        setCurrentIndex((prev) => (prev + 1) % VIDEOS.length);
      };
    }
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 z-0 bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          <video
            id={`video-${currentIndex}`}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
            onEnded={() => setCurrentIndex((prev) => (prev + 1) % VIDEOS.length)}
          >
            <source src={`${BASE_ASSETS_URL}${VIDEOS[currentIndex]}`} type="video/mp4" />
          </video>
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-black/25 z-10" />
    </div>
  );
};
