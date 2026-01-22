import { useWebContext } from "@context/auth";
import { Alert, AlertDescription } from "@components/ui/alert";
import { AlertCircle } from "lucide-react";

export function BanBanner() {
    const { authorizedUser, isAuthenticated, isLoading } = useWebContext();

    if (isLoading || !isAuthenticated || !authorizedUser?.bannedFromSubmissions) {
        return null;
    }

    return (
        <div className="w-full bg-gradient-to-r from-red-500/5 via-red-500/10 to-red-500/5 border-b border-red-600/40">
                <Alert className="border-red-600/40 bg-red-500/5 p-4 rounded-lg">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <AlertDescription className="text-red-700 flex-1">
                            <div className="space-y-1">
                                <p className="font-semibold text-base">Your account was <b>banned</b> from submitting themes</p>
                                <p className="text-xs text-red-600/80 mt-2">
                                    You can still browse, view, and like themes. If you believe this is a mistake, please contact support.
                                </p>
                            </div>
                        </AlertDescription>
                    </div>
                </Alert>
        </div>
    );
}
