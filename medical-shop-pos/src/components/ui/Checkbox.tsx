import * as React from "react"
import { Checkbox as HeadlessCheckbox, type CheckboxProps as HeadlessCheckboxProps } from '@headlessui/react'
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends Omit<HeadlessCheckboxProps, 'className' | 'children'> {
    className?: string;
    id?: string;
}

export const Checkbox = React.forwardRef<HTMLElement, CheckboxProps>(
    ({ className, id, ...props }, ref) => {
        return (
            <HeadlessCheckbox
                ref={ref as any}
                id={id}
                className={cn(
                    "group flex size-5 shrink-0 items-center justify-center rounded border border-slate-300 bg-white data-[checked]:border-none data-[checked]:bg-emerald-600 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 dark:border-slate-700 dark:bg-slate-900/50 dark:data-[checked]:bg-emerald-500 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-colors",
                    className
                )}
                {...props}
            >
                <Check className="hidden size-3.5 text-white group-data-[checked]:block" />
            </HeadlessCheckbox>
        )
    }
)

Checkbox.displayName = "Checkbox"
