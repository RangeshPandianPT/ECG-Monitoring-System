import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = ({ children }) => {
  return <TooltipPrimitive.Provider>{children}</TooltipPrimitive.Provider>;
};

const Tooltip = ({ children }) => {
  return <>{children}</>;
};

const TooltipTrigger = ({ children, ...props }) => (
  <TooltipPrimitive.Trigger asChild {...props}>
    {children}
  </TooltipPrimitive.Trigger>
);

const TooltipContent = React.forwardRef(({ className, side = "top", ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      side={side}
      className={cn(
        "z-50 rounded-md bg-neutral-900 p-2 text-sm text-white shadow-md",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
