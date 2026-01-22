import App from "@components/page/theme-list";
import { useWebContext } from "@context/auth";

export default function ThemeSubmittedList() {
    const { authorizedUser, isLoading } = useWebContext();

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow container mx-auto flex flex-col mt-6">
                {isLoading ? (
                    <div className="text-center text-lg text-foreground">Loading...</div>
                ) : !authorizedUser?.admin ? (
                    <div className="text-center text-lg text-foreground">
                        You need to be an admin to view this page.
                        <div className="mt-2">
                            <a href="/" className="text-primary hover:underline">
                                Return to home
                            </a>
                        </div>
                    </div>
                ) : (
                    <App />
                )}
            </main>
        </div>
    );
}
