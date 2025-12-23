import { motion } from "framer-motion";
import { Upload, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  progress: number;
  fileName?: string;
  isComplete?: boolean;
  className?: string;
}

export const UploadProgress = ({ 
  progress, 
  fileName, 
  isComplete = false,
  className 
}: UploadProgressProps) => {
  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-300">
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Upload className="w-4 h-4 text-primary animate-pulse" />
          )}
          <span className="truncate max-w-[200px]">
            {fileName || "Upload en cours..."}
          </span>
        </div>
        <span className={cn(
          "font-mono font-bold",
          isComplete ? "text-green-500" : "text-primary"
        )}>
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            isComplete ? "bg-green-500" : "bg-primary"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

interface SubmitProgressOverlayProps {
  progress: number;
  currentStep: string;
  isVisible: boolean;
}

export const SubmitProgressOverlay = ({ 
  progress, 
  currentStep, 
  isVisible 
}: SubmitProgressOverlayProps) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center"
    >
      <div className="bg-[#1a1f2e] rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-white/10">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Circular Progress */}
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#374151"
                strokeWidth="8"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#C41E25"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={351.86}
                initial={{ strokeDashoffset: 351.86 }}
                animate={{ strokeDashoffset: 351.86 - (351.86 * progress) / 100 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Status Text */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">
              Envoi en cours...
            </h3>
            <p className="text-sm text-gray-400 flex items-center gap-2 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              {currentStep}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#C41E25] to-[#e63946] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
