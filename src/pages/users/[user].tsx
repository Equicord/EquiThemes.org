import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ThemeCard } from "@components/theme/card";
import { ArrowUp, Ban, Book, Download, Flag, Heart, SearchX, Shield, Calendar, Clock, TrendingUp, Star, Users, Award, Zap, Trophy, Eye, ExternalLink, Share2, Copy, Lock } from "lucide-react";
import { type Author, type Theme } from "@types";
import { Button } from "@components/ui/button";
import { useWebContext } from "@context/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Badge } from "@components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { toast } from "@hooks/use-toast";
import { getCookie } from "@utils/cookies";
import ImageWithFallback from "@components/ui/image-fallback";
import { Separator } from "@components/ui/separator";
import Head from "next/head";

interface ThemesResponse {
    themes: Theme[];
    user: {
        id: string;
        global_name: string;
        preferredColor: string;
        avatar: string;
        admin?: boolean;
        joinedAt?: string;
        lastActive?: string;
    };
}

interface UserActivity {
    popularThemes: Theme[];
}

const THEMES_PER_PAGE = 6;

export default function User() {
    const router = useRouter();
    const { user } = router.query;
    const [userThemes, setUserThemes] = useState<ThemesResponse>({
        themes: [],
        user: { id: "", admin: false, global_name: "", preferredColor: "", avatar: "", joinedAt: "", lastActive: "" }
    });
    const [invalid, setInvalid] = useState(false);
    const [loading, setLoading] = useState(true);
    const [likedThemes, setLikedThemes] = useState<Theme[]>([]);
    const [userLikedThemes, setUserLikedThemes] = useState<Theme[]>([]);
    const [displayCount, setDisplayCount] = useState(THEMES_PER_PAGE);
    const [hasMore, setHasMore] = useState(true);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
    const [shareTooltip, setShareTooltip] = useState(false);
    const [showBanModal, setShowBanModal] = useState(false);
    const [banReason, setBanReason] = useState("");
    const [isBanning, setIsBanning] = useState(false);
    const { authorizedUser, isAuthenticated, isLoading, themes } = useWebContext();

    const userToken = useMemo(() => {
        if (typeof document === "undefined") return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; _dtoken=`);
        return parts.length === 2 ? parts.pop()?.split(";").shift() : undefined;
    }, []);

    const fetchThemes = useCallback(async () => {
        if (!user) return;
        try {
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (userToken) {
                headers.Authorization = `Bearer ${userToken}`;
            }

            const response = await fetch(`/api/user/themes`, {
                method: "POST",
                headers,
                body: JSON.stringify({ userId: user })
            });

            const data = await response.json();
            if (response.status === 200) {
                setUserThemes(data);
            } else {
                setInvalid(response.status === 404);
            }
        } catch (error) {
            console.error("Error fetching themes:", error);
            setInvalid(true);
        } finally {
            setLoading(false);
        }
    }, [user, userToken]);

    const fetchLikedThemes = useCallback(async () => {
        if (!userToken || !(user === "@me" || user === authorizedUser?.id) || loading || isLoading) return;

        try {
            const response = await fetch("/api/likes/get", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userToken}`
                }
            });
            const data = await response.json();

            const likedThemeIds = data.likes.filter((like: { themeId: number; hasLiked: boolean }) => like.hasLiked).map((like: { themeId: number }) => like.themeId);

            setUserLikedThemes(themes.filter((theme: Theme) => likedThemeIds.includes(theme.id)));
            setLikedThemes(data);
        } catch (error) {
            console.error("Error fetching liked themes:", error);
        }
    }, [userToken, user, authorizedUser, loading, themes, isLoading]);

    useEffect(() => {
        if (!isAuthenticated && !isLoading && user === "@me") {
            router.push("/auth/login");
        } else {
            fetchLikedThemes();
        }
    }, [isLoading, fetchLikedThemes, isAuthenticated, user, router]);

    useEffect(() => {
        fetchThemes();
        setDisplayCount(THEMES_PER_PAGE);
        setHasMore(true);
        setLoading(false);
    }, [user, userToken, fetchThemes]);

    const debounce = (func: Function, wait: number) => {
        let timeout: any;
        return (...args: any[]) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(null, args), wait);
        };
    };

    useEffect(() => {
        const handleScroll = debounce(() => {
            const scrolled = window.scrollY;
            setShowScrollTop(scrolled > 300);
        }, 100);

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleDelete = async () => {
        const response = await fetch("/api/user/delete", {
            method: "DELETE",
            body: JSON.stringify({
                userId: user
            }),
            headers: {
                Authorization: `Bearer ${getCookie("_dtoken")}`,
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            toast({
                title: "Error",
                description: "Failed to delete their account & themes.",
                variant: "destructive"
            });
            return;
        }
        toast({
            title: "Account Deleted",
            description: "Their account & themes have been permanently deleted."
        });
        window.location.reload();
    };
    const loadMore = () => {
        const newCount = displayCount + THEMES_PER_PAGE;
        setDisplayCount(newCount);
        setHasMore(newCount < themes.length);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const copyProfileLink = () => {
        const url = `${window.location.origin}/users/${user}`;
        navigator.clipboard.writeText(url);
        setShareTooltip(true);
        toast({
            title: "Profile Link Copied",
            description: "The profile link has been copied to your clipboard."
        });
        setTimeout(() => setShareTooltip(false), 2000);
    };

    const generateUserActivity = useCallback(() => {
        if (!userThemes.themes.length) return null;
        const popularThemes = [...userThemes.themes].sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 3);

        return {
            popularThemes
        };
    }, [userThemes]);

    useEffect(() => {
        if (invalid || isLoading || !userThemes || !userThemes.themes) return;
        if (userThemes.themes.length > 0) {
            setUserActivity(generateUserActivity());
        }
    }, [userThemes, invalid, isLoading, generateUserActivity]);

    const handleBanUser = async () => {
        if (!userThemes.user.id || !banReason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a reason for banning",
                variant: "destructive"
            });
            return;
        }

        setIsBanning(true);
        try {
            const response = await fetch("/api/user/ban", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getCookie("_dtoken")}`
                },
                body: JSON.stringify({
                    userId: userThemes.user.id,
                    action: "ban",
                    reason: banReason
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to ban user");
            }

            toast({
                title: "Success",
                description: `User ${userThemes.user.global_name} has been banned from submissions`,
                variant: "default"
            });

            setShowBanModal(false);
            setBanReason("");
            // Refresh user data
            await fetchThemes();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to ban user",
                variant: "destructive"
            });
        } finally {
            setIsBanning(false);
        }
    };

    const UserStats = () => (
        <div className="space-y-6 w-full mt-6">
            {userActivity && (
                <div className="space-y-4">
                    {userActivity.popularThemes.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-muted-foreground" />
                                    Popular Themes
                                </h3>
                                <div className="space-y-2">
                                    {userActivity.popularThemes.map((theme, index) => (
                                        <div key={theme.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                                                    {index + 1}
                                                </Badge>
                                                <span className="text-sm font-medium truncate max-w-32">{theme.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Download className="h-3 w-3" />
                                                {(theme.downloads || 0).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );

    function getAuthorDiscordName(author: Author | Author[], userId?: string): string {
        if (isLoading) return "Loading...";
        if (!userId) return "Unknown User";
        if (!author) return "Unknown User";
        if (Array.isArray(author)) {
            const matchingAuthor = author.find((a) => a.discord_snowflake === userId);
            return matchingAuthor?.discord_name ?? "Unknown User";
        }
        return author.discord_name;
    }

    const authorName = getAuthorDiscordName(userThemes.themes[0]?.author, userThemes.user.id);

    const primarySrc = userThemes.user?.avatar ? `https://cdn.discordapp.com/avatars/${userThemes.user.id}/${userThemes.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${Math.floor(Number(userThemes.user.id) / Math.pow(2, 22)) % 6}.png`;
    const fallbackSrc = `https://cdn.discordapp.com/embed/avatars/${Math.floor(Number(userThemes.user.id) / Math.pow(2, 22)) % 6}.png`;
    const UserProfile = () => (
        <div className="relative">
            <div className="w-full h-40 rounded-t-lg relative overflow-hidden" style={{ backgroundColor: userThemes.user?.preferredColor || "#5865F2" }}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Button disabled={invalid || isLoading} size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20" onClick={copyProfileLink}>
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                    </Button>
                    {user !== "@me" && user !== authorizedUser?.id && (
                        <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20" onClick={() => window.open(`https://discord.com/users/${userThemes.user.id}`, "_blank")}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Discord
                        </Button>
                    )}
                </div>
            </div>
            <div className="p-6 -mt-20">
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <ImageWithFallback src={primarySrc} fallbackSrc={fallbackSrc} height={128} width={128} className="w-32 h-32 rounded-full ring-4 ring-background shadow-xl" alt="Avatar" unoptimized draggable={false} priority />
                    </div>

                    <div className="flex flex-col items-center gap-2 mt-6">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{userThemes.user.global_name ? userThemes.user.global_name : userThemes.themes.length ? authorName : "Unknown User"}</h1>
                            {userThemes.user.admin && (
                                <Badge className="fill-current select-none bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Admin
                                </Badge>
                            )}
                        </div>
                    </div>

                    {invalid ? (
                        <div className="text-center mt-4">
                            <p className="text-sm text-muted-foreground">User not found or was deleted</p>
                        </div>
                    ) : (
                        <>
                            <UserStats />

                            {authorizedUser?.admin && (
                                <div className="w-full mt-6 space-y-4">
                                    {userThemes.user.admin && (
                                        <Alert className="border-yellow-600/20 bg-yellow-500/10">
                                            <AlertTitle className="text-md font-semibold text-yellow-600">You cannot moderate this user</AlertTitle>
                                            <AlertDescription className="text-yellow-600/90 text-sm">This user has administrative privileges and cannot be moderated.</AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button variant="outline" disabled className="flex items-center gap-2">
                                            <Flag className="w-4 h-4" />
                                            View Reports
                                        </Button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" disabled={userThemes.user.admin || invalid || isLoading} className="flex items-center gap-2">
                                                    <Ban className="w-4 h-4" />
                                                    Delete User
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the account and remove the user's data <b>permanently</b> until they sign up again.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDelete} className="hover:bg-destructive">
                                                        Continue
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
                                            <DialogTrigger asChild>
                                                <Button variant="secondary" disabled={userThemes.user.admin || invalid || isLoading} className="flex items-center gap-2">
                                                    <Lock className="w-4 h-4" />
                                                    Ban from Submissions
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Ban from Submissions</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="ban-reason">Reason for ban</Label>
                                                        <textarea
                                                            id="ban-reason"
                                                            value={banReason}
                                                            onChange={(e) => setBanReason(e.target.value)}
                                                            placeholder="Explain why this user is being banned from submissions..."
                                                            className="w-full h-24 p-2 border border-input rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2 pt-4">
                                                        <Button variant="outline" onClick={() => setShowBanModal(false)} disabled={isBanning}>
                                                            Cancel
                                                        </Button>
                                                        <Button 
                                                            variant="destructive" 
                                                            onClick={handleBanUser}
                                                            disabled={isBanning || !banReason.trim()}
                                                        >
                                                            {isBanning ? "Banning..." : "Confirm Ban"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
    const LoadingSkeleton = () => (
        <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <div className="flex justify-center -mt-20">
                <Skeleton className="h-32 w-32 rounded-full" />
            </div>
            <div className="space-y-2 text-center pt-4">
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
                <Skeleton className="h-6 w-24 mx-auto" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20" />
                ))}
            </div>
            <div className="space-y-3 mt-6">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        </div>
    );
    const ThemesList = ({ themes }: { themes: Theme[] }) => (
        <div className="space-y-6">
            <div className="grid gap-4">
                {themes.slice(0, displayCount).map((theme: Theme) => (
                    <div key={theme.id} className="transform transition-all duration-200 hover:scale-[1.02]">
                        <ThemeCard theme={theme} likedThemes={likedThemes} disableDownloads={activeTab === "authored"} />
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-center gap-4 mt-8">
                {hasMore && themes.length > displayCount && (
                    <Button variant="outline" onClick={loadMore} className="w-full max-w-xs hover:bg-primary/10 transition-colors">
                        Load More Themes
                    </Button>
                )}
                {!hasMore && themes.length > THEMES_PER_PAGE && (
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">🎉 You've reached the end!</p>
                        <p className="text-xs text-muted-foreground mt-1">Found {themes.length} themes in total</p>
                    </div>
                )}
            </div>

            {showScrollTop && (
                <Button variant="outline" size="icon" className="fixed bottom-8 right-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50" onClick={scrollToTop}>
                    <ArrowUp className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
    const Layout = ({ children }: { children: ReactNode }) => (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 rounded-lg">
            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col-reverse lg:flex-row gap-8 min-h-[calc(100vh-5rem)]">{children}</div>
            </main>
        </div>
    );

    const [activeTab, setActiveTab] = useState("authored");
    if (loading) {
        return (
            <Layout>
                <div className="w-full lg:w-2/3 p-4">
                    <Card className="p-6">
                        <div className="space-y-6">
                            <div className="grid gap-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-32 w-full" />
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="w-full lg:w-1/3">
                    <div className="sticky top-24">
                        <Card>
                            <LoadingSkeleton />
                        </Card>
                    </div>
                </div>
            </Layout>
        );
    }
    if (invalid) {
        router.push("/");
        return (
            <Layout>
                <div className="w-full lg:w-2/3">
                    <Card className="p-8">
                        <div className="h-[50vh] flex items-center justify-center">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 rounded-full bg-muted">
                                    <SearchX className="w-12 h-12 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold">User Not Found</h2>
                                    <p className="text-muted-foreground max-w-md">The user you're looking for doesn't exist or may have been removed from the platform.</p>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    {user === "@me" && isAuthenticated ? (
                                        <Button variant="default" onClick={() => router.push("/users/@me")}>
                                            <Users className="w-4 h-4 mr-2" />
                                            My Profile
                                        </Button>
                                    ) : (
                                        <Button variant="default" onClick={() => router.push("/")}>
                                            <Book className="w-4 h-4 mr-2" />
                                            Browse Themes
                                        </Button>
                                    )}
                                    <Button variant="outline" onClick={() => router.back()}>
                                        Go Back
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="w-full lg:w-1/3">
                    <div className="sticky top-24">
                        <Card>
                            <UserProfile />
                        </Card>
                    </div>
                </div>
            </Layout>
        );
    }
    return (
        <>
            <Head>
                <title>{userThemes.user.global_name || "User Profile"} - Discord Themes</title>
                <meta name="description" content={`Check out ${userThemes.user.global_name || "this user"}'s profile and their amazing Discord themes!`} />
                <meta property="og:title" content={`${userThemes.user.global_name || "User Profile"} - Discord Themes`} />
                <meta property="og:description" content={`Check out ${userThemes.user.global_name || "this user"}'s profile and their amazing Discord themes!`} />
                <meta property="og:image" content={primarySrc} />
                <meta property="og:url" content={`${process.env.NEXT_PUBLIC_BASE_URL}/users/${user}`} />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            <Layout>
                <div className="w-full lg:w-2/3">
                    <Card className="p-6 shadow-lg">
                        {user === "@me" || user === authorizedUser?.id ? (
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                                    <TabsTrigger value="authored" className="data-[state=active]:bg-background">
                                        <Book className="w-4 h-4 mr-2" />
                                        My Themes ({userThemes.themes.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="liked" className="data-[state=active]:bg-background">
                                        <Heart className="w-4 h-4 mr-2" />
                                        Liked ({userLikedThemes.length})
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="authored" className="space-y-6">
                                    {userThemes.themes.length > 0 ? (
                                        <ThemesList themes={userThemes.themes} />
                                    ) : (
                                        <EmptyState
                                            icon={Book}
                                            title="No themes yet"
                                            description="Start creating amazing Discord themes to share with the community!"
                                            actionButton={
                                                <Button onClick={() => router.push("/theme/submit")} className="mt-4">
                                                    <Book className="w-4 h-4 mr-2" />
                                                    Create Your First Theme
                                                </Button>
                                            }
                                        />
                                    )}
                                </TabsContent>
                                <TabsContent value="liked" className="space-y-6">
                                    {userLikedThemes.length > 0 ? (
                                        <ThemesList themes={userLikedThemes.reverse()} />
                                    ) : (
                                        <EmptyState
                                            icon={Heart}
                                            title="No liked themes"
                                            description="Discover and like themes that catch your eye!"
                                            actionButton={
                                                <Button onClick={() => router.push("/")} variant="outline" className="mt-4">
                                                    <Heart className="w-4 h-4 mr-2" />
                                                    Explore Themes
                                                </Button>
                                            }
                                        />
                                    )}
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="space-y-6">
                                {userThemes.themes.length > 0 ? (
                                    <div>
                                        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 rounded-full bg-primary/10">
                                                    <Book className="w-6 h-6 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold">
                                                        {userThemes.themes.length} {userThemes.themes.length === 1 ? "Theme" : "Themes"}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">Created by {userThemes.user.global_name || authorName || "Unknown User"}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <ThemesList themes={userThemes.themes} />
                                    </div>
                                ) : (
                                    <EmptyState icon={Book} title="No themes available" description="This user hasn't created any themes yet" />
                                )}
                            </div>
                        )}
                    </Card>
                </div>
                <div className="w-full lg:w-1/3 h-fit">
                    <div className="sticky top-24">
                        <Card className="shadow-lg overflow-hidden">
                            <UserProfile />
                        </Card>
                    </div>
                </div>
            </Layout>
        </>
    );
}

const EmptyState = ({ icon: Icon, title, description, actionButton }: { icon: any; title: string; description: string; actionButton?: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
            <Icon className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">{description}</p>
        {actionButton}
    </div>
);
