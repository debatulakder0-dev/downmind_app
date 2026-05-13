import React from "react";
import { motion } from "motion/react";
import { Mic, Loader2 } from "lucide-react";
import { AppStatus } from "../types";
import { cn } from "../lib/utils";

interface MicButtonProps {
  status: AppStatus;
  onClick: () => void;
}

export const MicButton: React.FC<MicButtonProps> = ({ status, onClick }) => {
  const getGlowClass = () => {
    switch (status) {
      case "listening": return "mic-glow-red bg-red-500 scale-110";
      case "thinking": return "mic-glow-amber bg-amber-500";
      case "speaking": return "mic-glow-white bg-white/40";
      default: return "mic-glow-white bg-white/20 hover:bg-white/30";
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 z-40">
      <motion.button
        onClick={onClick}
        animate={status === "listening" ? {
          scale: [1, 1.1, 1],
        } : status === "idle" ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={status === "listening" ? {
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        } : {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 outline-none relative",
          getGlowClass()
        )}
      >
        {status === "thinking" ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : (
          <Mic className={cn("w-8 h-8 text-white")} />
        )}
      </motion.button>
      
      <p className="text-white/60 text-sm font-medium tracking-widest uppercase">
        {status === "idle" && "Tap to start"}
        {status === "listening" && "Listening..."}
        {status === "thinking" && "Thinking..."}
        {status === "speaking" && "Speaking..."}
      </p>
    </div>
  );
};
