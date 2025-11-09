import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Alert = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn("rounded-md p-4 [&>svg]:h-4 [&>svg]:w-4", className)} {...props}>
    {children}
  </div>
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn("mb-1 font-medium leading-none", className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
