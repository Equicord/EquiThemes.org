import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@components/ui/alert-dialog";
import { 
    ContentCopy as CopyIcon, 
    Visibility as EyeIcon, 
    GitHub as GithubIcon, 
    Tag as HashIcon, 
    Refresh as RefreshIcon, 
    Settings as SettingsIcon, 
    Person as UserIcon, 
    AccountCircle as UserCircleIcon 
} from "@mui/icons-material";
import { deleteCookie, getCookie, setCookie } from "@utils/cookies";
import { useCallback, useEffect, useState, useRef } from "react";
import { useToast } from "@hooks/use-toast";
import { Skeleton } from "@components/ui/skeleton";
import { useWebContext } from "@context/auth";
import { useRouter } from "next/router";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";

function useAsyncAction(fn) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const run = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        try {
            await fn(...args);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }, [fn]);
    return { run, loading, error };
}

function AccountLinks() {
    const { authorizedUser } = useWebContext();
    const { toast } = useToast();
    const [donationLink, setDonationLink] = useState(authorizedUser?.donationLink || "");
    const [websiteLink, setWebsiteLink] = useState(authorizedUser?.websiteLink || "");
    const prevLinks = useRef({ donationLink: authorizedUser?.donationLink, websiteLink: authorizedUser?.websiteLink });

    useEffect(() => {
        setDonationLink(authorizedUser?.donationLink || "");
        setWebsiteLink(authorizedUser?.websiteLink || "");
        prevLinks.current = { donationLink: authorizedUser?.donationLink, websiteLink: authorizedUser?.websiteLink };
    }, [authorizedUser]);

    const { run: handleSave, loading: saving } = useAsyncAction(async () => {
        const response = await fetch("/api/user/links", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getCookie("_dtoken")}`
            },
            body: JSON.stringify({
                userId: authorizedUser?.id,
                donationLink,
                websiteLink
            })
        });
        if (response.ok) {
            toast({
                title: "Links updated!",
                description: "Your donation and website links have been saved."
            });
            prevLinks.current = { donationLink, websiteLink };
        } else {
            const data = await response.json();
            toast({
                title: "Error",
                description: data.message || "Failed to update links.",
                variant: "destructive"
            });
        }
    });

    const isChanged = donationLink !== prevLinks.current.donationLink || websiteLink !== prevLinks.current.websiteLink;

    return (
        <div className="space-y-6 mb-4 p-6 rounded-xl border border-muted/30 bg-muted/30 shadow-sm">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" /> Profile Links
            </h2>
            <div className="flex flex-col gap-4 md:flex-row md:gap-8">
                <div className="flex-1">
                    <label htmlFor="donation-link" className="block text-sm font-medium mb-1 text-muted-foreground">Donation Link</label>
                    <Input id="donation-link" placeholder="https://buymeacoffee.com/yourname" value={donationLink} onChange={e => setDonationLink(e.target.value)} autoComplete="off" className="rounded-lg" />
                </div>
                <div className="flex-1">
                    <label htmlFor="website-link" className="block text-sm font-medium mb-1 text-muted-foreground">Website Link</label>
                    <Input id="website-link" placeholder="https://yourwebsite.com" value={websiteLink} onChange={e => setWebsiteLink(e.target.value)} autoComplete="off" className="rounded-lg" />
                </div>
            </div>
            <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving || !isChanged} className="mt-2 w-fit px-6 py-2 rounded-lg shadow-sm" aria-busy={saving} aria-disabled={saving || !isChanged}>
                    {saving ? "Saving..." : "Save Links"}
                </Button>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { isAuthenticated, isLoading } = useWebContext();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            router.replace("/");
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="container mx-auto py-16 flex flex-col gap-8">
                <Skeleton className="h-12 w-56 mb-8 rounded-lg" />
                <Skeleton className="h-[520px] w-full rounded-xl" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="container mx-auto py-12 max-w-3xl">
            <h1 className="text-4xl font-extrabold mb-10 text-center tracking-tight">Settings</h1>
            <Tabs defaultValue="account" className="space-y-6">
                <TabsList className="w-full grid grid-cols-2 bg-muted rounded-lg mb-2">
                    <TabsTrigger value="account" className="rounded-l-lg data-[state=active]:bg-primary/90 data-[state=active]:text-white transition-colors">
                        <SettingsIcon className="w-4 h-4 mr-2" />
                        Account
                    </TabsTrigger>
                    <TabsTrigger value="data" className="rounded-r-lg data-[state=active]:bg-primary/90 data-[state=active]:text-white transition-colors">
                        <UserCircleIcon className="w-4 h-4 mr-2" />
                        User Data
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                    <Card className="shadow-lg border-2 border-muted bg-card">
                        <CardHeader className="pb-2 border-b border-muted/40">
                            <CardTitle className="text-2xl">Account Settings</CardTitle>
                            <CardDescription className="text-muted-foreground">Manage your account settings and preferences.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-10">
                            <div className="space-y-4 mb-4">
                                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                                    <HashIcon className="w-5 h-5 text-primary" /> API Key
                                </h2>
                                <Alert className="border-yellow-600/30 bg-yellow-500/10 shadow-none">
                                    <AlertTitle className="text-md font-semibold text-yellow-600 flex items-center gap-2">
                                        <EyeIcon className="w-4 h-4" /> Access to your Account Token
                                    </AlertTitle>
                                    <AlertDescription className="text-yellow-700/90 text-sm">
                                        <p className="text-sm text-muted-foreground">
                                            Your API key is a secure token that identifies your account. It grants access to:
                                            <ul className="list-disc list-inside mt-2 space-y-1">
                                                <li>Managing your themes</li>
                                                <li>Accessing account settings</li>
                                                <li>Performing automated actions</li>
                                            </ul>
                                            <span className="block mt-2">
                                                This is <b>not</b> your Discord Account token, however, still, do not share it with anyone who you don't trust.
                                            </span>
                                        </p>
                                    </AlertDescription>
                                </Alert>
                                <APIKey />
                            </div>
                            <div className="border-t border-muted/30 pt-8">
                                <DeleteAccount />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="data">
                    <Card className="shadow-lg border-2 border-muted bg-card">
                        <CardHeader className="pb-2 border-b border-muted/40">
                            <CardTitle className="text-2xl">User Data</CardTitle>
                            <CardDescription className="text-muted-foreground">View the data associated with your account.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <UserData />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function DeleteAccount() {
    const [deleteText, setDeleteText] = useState("");
    const { authorizedUser } = useWebContext();
    const { toast } = useToast();
    const [deleting, setDeleting] = useState(false);
    const [revoking, setRevoking] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const response = await fetch("/api/user/delete", {
                method: "DELETE",
                body: JSON.stringify({
                    userId: authorizedUser?.id
                }),
                headers: {
                    Authorization: `Bearer ${getCookie("_dtoken")}`,
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                toast({
                    title: "Error",
                    description: "Failed to delete your account & themes.",
                    variant: "destructive"
                });
                return;
            }
            toast({
                title: "Account Deleted",
                description: "Your account & themes have been permanently deleted."
            });
            deleteCookie("_dtoken");
            window.location.href = "/";
        } finally {
            setDeleting(false);
        }
    };

    const handleLogout = async () => {
        setRevoking(true);
        try {
            const response = await fetch("/api/user/revoke", {
                method: "DELETE",
                body: JSON.stringify({
                    userId: authorizedUser?.id
                }),
                headers: {
                    Authorization: `Bearer ${getCookie("_dtoken")}`,
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                toast({
                    title: "Failed to Logout",
                    description: (await response.json()).message,
                    variant: "destructive"
                });
                return;
            }
            await deleteCookie("_dtoken");
            toast({
                title: "Success",
                description: "You have been logged out & your account data has been deleted."
            });
            window.location.href = "/";
        } finally {
            setRevoking(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <UserCircleIcon className="w-5 h-5 text-destructive" /> Delete Account
            </h2>
            <Alert className="border-red-600/30 bg-red-500/10 shadow-none">
                <AlertTitle className="text-md font-semibold text-red-600 flex items-center gap-2">
                    <RefreshIcon className="w-4 h-4" /> Deleting your Account
                </AlertTitle>
                <AlertDescription className="text-red-700/90 text-sm">
                    <p className="text-sm text-muted-foreground">
                        This will delete your account including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>All your submitted themes</li>
                            <li>All liked themes</li>
                            <li>Other data associated with your account</li>
                        </ul>
                        <div className="flex items-center gap-2 mt-2">
                            <span>If you don't want your themes to be deleted, you can revoke the authorization instead below.</span>
                            <b>This action cannot be undone.</b>
                        </div>
                    </p>
                </AlertDescription>
            </Alert>
            {authorizedUser?.admin && (
                <Alert className="border-yellow-600/30 bg-yellow-500/10 shadow-none">
                    <AlertDescription className="text-yellow-700/90 text-sm">
                        <p className="text-sm text-muted-foreground">You are an admin, you cannot delete your account. Please contact us via Discord.</p>
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button disabled={authorizedUser?.admin ?? false} variant="destructive" className="rounded-lg px-6 py-2 shadow-sm" aria-disabled={authorizedUser?.admin ?? false} aria-busy={deleting}>
                            {deleting ? "Deleting..." : "Delete Account"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-2xl w-full">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                <div className="mt-2 mb-2">
                                    This will, <span className="text-red-500">delete all your submitted themes, liked themes, and other data associated with your account</span>. <b>EVERYTHING.</b>
                                </div>
                                <div className="mt-2 mb-2 text-xs text-muted-foreground">This does not affect your Discord Account in any way.</div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                            <Alert className="border-red-600/30 bg-red-500/10 shadow-none">
                                <AlertTitle className="text-md font-semibold text-red-600">Deleting your Account</AlertTitle>
                                <AlertDescription className="text-red-700/90 text-sm">
                                    <p className="text-sm text-muted-foreground">
                                        Type <b>DELETE</b> to confirm
                                    </p>
                                </AlertDescription>
                            </Alert>
                            <Input id="confirm-delete" placeholder="DELETE" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} aria-label="Type DELETE to confirm account deletion" autoComplete="off" className="rounded-lg" />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction disabled={deleteText !== "DELETE" || deleting} onClick={handleDelete} aria-disabled={deleteText !== "DELETE" || deleting} aria-busy={deleting} className="rounded-lg">
                                Delete Account & All Themes
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button disabled={authorizedUser?.admin ?? false} className="rounded-lg px-6 py-2 shadow-sm" variant="outline" aria-disabled={authorizedUser?.admin ?? false} aria-busy={revoking}>
                            {revoking ? "Revoking..." : "Revoke Authorization"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-2xl w-full">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Invalidate your current API Key</li>
                                    <li>Log you out</li>
                                    <li>Delete your account data</li>
                                </ul>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogout} disabled={revoking} aria-disabled={revoking} aria-busy={revoking} className="rounded-lg">Logout</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

interface UserField {
    icon: React.ElementType;
    label: string;
    value?: string;
    href?: string;
}

function UserData() {
    const [loading, setLoading] = useState(false);
    const { authorizedUser } = useWebContext();
    const { toast } = useToast();
    const router = useRouter();

    const refreshData = async () => {
        setLoading(true);
        try {
            toast({
                title: "Redirecting...",
                description: "Redirecting you to discord for authentication."
            });
            localStorage.setItem("redirect", "/users/@me/settings");
            router.push("/auth/login");
        } catch {
            toast({
                title: "Error",
                description: "Failed to refresh user data.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const userFields: UserField[] = [
        { icon: HashIcon, label: "User ID", value: authorizedUser?.id },
        { icon: UserIcon, label: "Username", value: authorizedUser?.global_name }
    ];
    if (authorizedUser?.social?.github) {
        userFields.push({ icon: GithubIcon, label: "GitHub", href: `https://github.com/${authorizedUser.social.github}`, value: authorizedUser?.social?.github });
    }
    if (authorizedUser?.donationLink) {
        userFields.push({ icon: EyeIcon, label: "Donation Link", href: authorizedUser.donationLink, value: authorizedUser.donationLink });
    }
    if (authorizedUser?.websiteLink) {
        userFields.push({ icon: EyeIcon, label: "Website", href: authorizedUser.websiteLink, value: authorizedUser.websiteLink });
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Refreshing will redirect you to Discord as we do not save any access/refresh tokens or similar, this is the only way to update your data.</p>
                <Button onClick={refreshData} disabled={loading} variant="outline" className="rounded-lg px-4 py-2" aria-busy={loading} aria-disabled={loading}>
                    <RefreshIcon className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Refreshing..." : "Refresh"}
                </Button>
            </div>
            <div className="grid gap-6 p-6 border border-muted/30 rounded-xl bg-muted/30 shadow-sm">
                {loading ? (
                    <div className="space-y-4">
                        {Array(4)
                            .fill(0)
                            .map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-[100px]" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {userFields.map((field, index) => (
                            <div key={index} className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent/60 transition-colors">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                    <field.icon className="h-4 w-4" aria-hidden="true" />
                                </div>
                                <div className="flex-1">
                                    <dt className="text-sm font-medium leading-none mb-1">{field.label}</dt>
                                    {field.href ? (
                                        <a href={field.href} target="_blank" rel="noreferrer" className="text-sm text-accent underline">
                                            <dd className="text-sm text-muted-foreground">{field.value || "—"}</dd>
                                        </a>
                                    ) : (
                                        <dd className="text-sm text-muted-foreground">{field.value || "—"}</dd>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <AccountLinks />
        </div>
    );
}

function APIKey() {
    const [isVisible, setIsVisible] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [cooldown, setCooldown] = useState(false);
    const { toast } = useToast();
    const { authorizedUser } = useWebContext();

    useEffect(() => {
        const token = getCookie("_dtoken");
        if (!token) return;
        setApiKey(token);
    }, []);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(apiKey);
            toast({
                title: "Copied!",
                description: "API key copied to clipboard"
            });
        } catch {
            toast({
                title: "Error",
                description: "Failed to copy API key",
                variant: "destructive"
            });
        }
    }, [apiKey, toast]);

    const handleRefresh = async () => {
        if (cooldown) return;
        setIsRefreshing(true);
        setCooldown(true);

        try {
            const response = await fetch("/api/user/refresh", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    userId: authorizedUser?.id
                })
            });

            const data = await response.json();

            if (response.ok) {
                setCookie("_dtoken", data.token);
                setApiKey(data.token);
                toast({
                    title: "Success",
                    description: "API key has been refreshed"
                });
            } else {
                toast({
                    title: "Error",
                    description: data.message,
                    variant: "destructive"
                });
            }
        } catch {
            toast({
                title: "Error",
                description: "Failed to refresh API key",
                variant: "destructive"
            });
        } finally {
            setIsRefreshing(false);
            setTimeout(() => setCooldown(false), 5000);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
                    <div className="relative flex-grow">
                        <Input id="api-key" type={isVisible ? "text" : "password"} value={apiKey} readOnly className="pr-10 font-mono rounded-lg bg-muted/40 border-muted/40" aria-label="API Key" />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 rounded-r-lg" onClick={() => setIsVisible(!isVisible)} aria-label={isVisible ? "Hide API Key" : "Show API Key"}>
                            <EyeIcon className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button onClick={handleCopy} aria-label="Copy API Key" className="rounded-lg">
                        <CopyIcon className="h-4 w-4 mr-2" />
                        Copy
                    </Button>
                    <Button onClick={handleRefresh} disabled={isRefreshing || cooldown} aria-busy={isRefreshing} aria-disabled={isRefreshing || cooldown} className="rounded-lg">
                        <RefreshIcon className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        {isRefreshing ? "Refreshing..." : "Refresh"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
