import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface ConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
}

export function useConfirm() {
    const [promise, setPromise] = useState<{ resolve: (value: boolean) => void } | null>(null);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);

    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        return new Promise<boolean>((resolve) => {
            setPromise({ resolve });
        });
    }, []);

    const handleClose = () => {
        setPromise(null);
        setOptions(null);
    };

    const handleConfirm = () => {
        promise?.resolve(true);
        handleClose();
    };

    const handleCancel = () => {
        promise?.resolve(false);
        handleClose();
    };

    const ConfirmationDialog = () => {
        if (!options || !promise) return null;

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl shrink-0 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 text-left">
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 leading-none tracking-tight">{options.title}</h2>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{options.description}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                        <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                            {options.cancelText || "Cancel"}
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleConfirm}
                            className={`w-full sm:w-auto ${options.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
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
