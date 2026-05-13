import React from "react";
import { motion } from "motion/react";
import { BASE_ASSETS_URL, COMPANIONS } from "../constants";
import { CompanionId } from "../types";
import { cn } from "../lib/utils";

interface CompanionProps {
  id: CompanionId;
  pose: string;
}

export const Companion: React.FC<CompanionProps> = ({ id, pose }) => {
  const companion = COMPANIONS[id];
  // Map common pose names to filenames
  const getPoseSrc = () => {
    const poses = companion.poses as Record<string, string>;
    const src = poses[pose.toLowerCase()] || poses.idle;
    return `${BASE_ASSETS_URL}${src}`;
  };

  return (
    <div 
      className="absolute left-[50%] -translate-x-1/2 z-10 pointer-events-none flex justify-center items-end"
      style={{ bottom: '-120px' }}
    >
      <motion.img
        key={`${id}-${pose}`}
        src={getPoseSrc()}
        alt={id}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "w-auto object-contain drop-shadow-2xl",
          pose === "idle" && "animate-float"
        )}
        style={{ height: '110vh', maxWidth: '70vw' }}
      />
    </div>
  );
};
