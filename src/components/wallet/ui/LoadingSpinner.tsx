"use client";
import { FaSpinner } from "react-icons/fa";
import { memo } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

const LoadingSpinner = memo(({ size = "sm" }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <FaSpinner
      className={`animate-spin ${sizeClasses[size]}`}
      aria-label="Loading"
    />
  );
});

LoadingSpinner.displayName = "LoadingSpinner";
export default LoadingSpinner;
