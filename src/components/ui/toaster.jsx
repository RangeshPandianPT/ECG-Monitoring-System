import * as React from "react";
import { Toaster as SonnerToaster } from "sonner";

// Thin wrapper to avoid TS usage and keep the same API surface
const Toaster = ({ position = "top-right" }) => {
  return <SonnerToaster position={position} />;
};

export { Toaster };
