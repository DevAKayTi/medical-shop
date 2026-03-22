import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
            <div className="flex flex-col items-center space-y-4 max-w-md">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <AlertCircle className="h-10 w-10 text-slate-400" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mt-4">
                    404
                </h1>
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">
                    Page not found
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                    Sorry, we couldn't find the page you're looking for. It might have been removed, or you might have mistyped the address.
                </p>
                <div className="pt-6 w-full flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                        variant="default"
                        size="lg"
                        onClick={() => navigate("/dashboard", { replace: true })}
                        className="w-full sm:w-auto"
                    >
                        Go to Dashboard
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
}
