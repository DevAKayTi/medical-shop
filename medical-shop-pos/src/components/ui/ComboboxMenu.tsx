import * as React from "react"
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboboxOptionType {
    value: string | number;
    label: string;
}

export interface ComboboxMenuProps {
    value: string | number;
    onChange: (value: any) => void;
    options: ComboboxOptionType[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const ComboboxMenu = React.forwardRef<HTMLInputElement, ComboboxMenuProps>(
    ({ value, onChange, options, placeholder = "Search...", className, disabled }, ref) => {
        const [query, setQuery] = React.useState('')

        const filteredOptions =
            query === ''
                ? options
                : options.filter((option) =>
                    option.label.toLowerCase().includes(query.toLowerCase())
                )

        return (
            <Combobox value={value} onChange={(val) => {
                onChange(val);
                setQuery('');
            }} disabled={disabled}>
                <div className="relative w-full">
                    <div className="relative w-full cursor-default overflow-hidden rounded-md bg-white text-left focus:outline-none sm:text-sm">
                        <ComboboxInput
                            ref={ref}
                            className={cn(
                                "w-full border border-slate-300 rounded-md bg-white py-2 pl-3 pr-10 text-sm leading-5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-50 transition-colors",
                                className
                            )}
                            displayValue={(val: any) => options.find((opt) => opt.value === val)?.label || ""}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={placeholder}
                        />
                        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronsUpDown
                                className="size-4 text-slate-500 dark:text-slate-400 group-data-[hover]:text-slate-600 dark:group-data-[hover]:text-slate-300"
                                aria-hidden="true"
                            />
                        </ComboboxButton>
                    </div>

                    <ComboboxOptions
                        transition
                        className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-slate-200 py-1 text-sm shadow-lg outline-none transition duration-100 ease-in data-[closed]:data-[leave]:opacity-0 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
                    >
                        {filteredOptions.length === 0 && query !== '' ? (
                            <div className="relative cursor-default select-none px-4 py-2 text-slate-700 dark:text-slate-300">
                                Nothing found.
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <ComboboxOption
                                    key={option.value}
                                    value={option.value}
                                    className="group relative cursor-pointer py-2 pl-10 pr-4 text-slate-900 select-none data-[focus]:bg-emerald-600 data-[focus]:text-white dark:text-slate-100 dark:data-[focus]:bg-emerald-500"
                                >
                                    <span className="block truncate font-normal group-data-[selected]:font-semibold">
                                        {option.label}
                                    </span>

                                    <span className="absolute inset-y-0 left-0 hidden group-data-[selected]:flex items-center pl-3 text-emerald-600 group-data-[focus]:text-white dark:text-emerald-400">
                                        <Check aria-hidden="true" className="size-4" />
                                    </span>
                                </ComboboxOption>
                            ))
                        )}
                    </ComboboxOptions>
                </div>
            </Combobox>
        )
    }
)

ComboboxMenu.displayName = "ComboboxMenu"
