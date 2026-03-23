import * as React from "react"
import { cn } from "@/lib/utils"

import { Input as HeadlessInput } from '@headlessui/react'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <HeadlessInput
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-emerald-500 dark:focus:ring-offset-slate-900 transition-colors",
                    "data-[focus]:ring-emerald-500 data-[focus]:border-transparent data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
