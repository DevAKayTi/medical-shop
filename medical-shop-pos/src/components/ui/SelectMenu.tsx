import * as React from "react"
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
    value: string | number;
    label: string;
}

export interface SelectMenuProps {
    value: string | number;
    onChange: (value: any) => void;
    options: SelectOption[];
    className?: string;
    disabled?: boolean;
}

export const SelectMenu = React.forwardRef<HTMLButtonElement, SelectMenuProps>(
    ({ value, onChange, options, className, disabled }, ref) => {
        const selectedOption = options.find((opt) => opt.value === value) || options[0];

        return (
            <Listbox value={value} onChange={onChange} disabled={disabled}>
                <div className="relative w-full">
                    <ListboxButton
                        ref={ref}
                        className={cn(
                            "grid h-10 w-full cursor-default grid-cols-1 items-center rounded-md border border-slate-300 bg-white py-2 pr-2 pl-3 text-left text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent data-[focus]:ring-2 data-[focus]:ring-emerald-500 data-[focus]:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-50 dark:focus:ring-emerald-500 transition-colors",
                            className
                        )}
                    >
                        <span className="col-start-1 row-start-1 truncate pr-6">{selectedOption?.label || "Select..."}</span>
                        <ChevronsUpDown
                            aria-hidden="true"
                            className="col-start-1 row-start-1 size-4 self-center justify-self-end text-slate-500 dark:text-slate-400"
                        />
                    </ListboxButton>

                    <ListboxOptions
                        transition
                        className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-slate-200 py-1 text-sm shadow-lg outline-none transition duration-100 ease-in data-[closed]:data-[leave]:opacity-0 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
                    >
                        {options.map((option) => (
                            <ListboxOption
                                key={option.value}
                                value={option.value}
                                className="group relative cursor-pointer py-2 pr-9 pl-3 text-slate-900 select-none data-[focus]:bg-emerald-600 data-[focus]:text-white dark:text-slate-100 dark:data-[focus]:bg-emerald-500"
                            >
                                <span className="block truncate font-normal group-data-[selected]:font-semibold">{option.label}</span>

                                <span className="absolute inset-y-0 right-0 hidden group-data-[selected]:flex items-center pr-4 text-emerald-600 group-data-[focus]:text-white dark:text-emerald-400">
                                    <Check aria-hidden="true" className="size-4" />
                                </span>
                            </ListboxOption>
                        ))}
                    </ListboxOptions>
                </div>
            </Listbox>
        )
    }
)

SelectMenu.displayName = "SelectMenu"
