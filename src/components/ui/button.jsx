import React from "react";

export function Button({ children, className, variant = "default", ...props }) {
  const base =
    "px-4 py-2 rounded-xl font-medium flex items-center justify-center transition";
  const styles = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100",
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
