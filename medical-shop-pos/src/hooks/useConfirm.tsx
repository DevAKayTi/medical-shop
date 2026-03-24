import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface ConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    confirmInput?: {
        label: string;
        placeholder?: string;
        requiredValue: string;
    };
}

export function useConfirm() {
    const [promise, setPromise] = useState<{ resolve: (value: boolean) => void } | null>(null);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [inputValue, setInputValue] = useState("");

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        setInputValue("");
        return new Promise<boolean>((resolve) => {
            setPromise({ resolve });
        });
    }, []);

    const handleClose = () => {
        setPromise(null);
        setOptions(null);
        setInputValue("");
    };

    const handleConfirm = () => {
        if (options?.confirmInput && inputValue !== options.confirmInput.requiredValue) {
            return;
        }
        promise?.resolve(true);
        handleClose();
    };

    const handleCancel = () => {
        promise?.resolve(false);
        handleClose();
    };

    const ConfirmationDialog = () => {
        if (!options || !promise) return null;

        const isInputValid = !options.confirmInput || inputValue === options.confirmInput.requiredValue;

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl shrink-0 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 text-left">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 leading-none tracking-tight">{options.title}</h2>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{options.description}</p>

                        {options.confirmInput && (
                            <div className="mt-5 space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    {options.confirmInput.label}
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-slate-50"
                                    placeholder={options.confirmInput.placeholder || "Type here..."}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && isInputValid) handleConfirm();
                                    }}
                                />
                                <p className="text-[10px] text-slate-400 italic">
                                    Type <span className="font-mono font-bold text-slate-600 dark:text-slate-200 not-italic select-all">{options.confirmInput.requiredValue}</span> to confirm.
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                        <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                            {options.cancelText || "Cancel"}
                        </Button>
                        <Button
                            variant="default"
                            disabled={!isInputValid}
                            onClick={handleConfirm}
                            className={`w-full sm:w-auto font-bold shadow-lg transition-all ${options.variant === 'destructive'
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/10 disabled:opacity-50'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10 disabled:opacity-50'
                                }`}
                        >
                            {options.confirmText || "Confirm"}
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return [ConfirmationDialog, confirm] as const;
}
