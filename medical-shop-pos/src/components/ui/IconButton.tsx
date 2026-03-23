import * as React from "react";
import { cn } from "@/lib/utils";

export interface AddButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    buttonSize?: "sm" | "md" | "lg";
    title?: string;
    icon?: React.ReactNode;
}

export const AddButton = React.forwardRef<HTMLButtonElement, AddButtonProps>(
    ({ className, title, icon, buttonSize = "md", ...props }, ref) => {
        const sizeClasses = {
            sm: "p-1",
            md: "p-1.5",
            lg: "p-2",
        };

        return (
            <button
                ref={ref}
                type="button"
                className="flex items-center gap-2"
                {...props}
            >
                <div className={cn(
                    "rounded-full bg-emerald-600 text-white shadow-xs hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors",
                    "dark:bg-emerald-500 dark:shadow-none dark:hover:bg-emerald-400 dark:focus-visible:outline-emerald-500",
                    sizeClasses[buttonSize],
                    className
                )}>
                    {icon}
                </div>
                <span className="text-md font-semibold text-slate-700 dark:text-slate-300">
                    {title}
                </span>
            </button>
        );
    }
);

AddButton.displayName = "AddButton";
