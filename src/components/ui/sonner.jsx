import * as React from "react";
import { Toaster as SonnerToaster, toast } from "sonner";

// Simple passthrough Toaster so imports resolve to a JS file during conversion.
const Toaster = (props) => {
  return <SonnerToaster {...props} />;
};

export { Toaster, toast };
