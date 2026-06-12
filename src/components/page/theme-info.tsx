/* eslint-disable no-constant-binary-expression */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import { memo, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { useWebContext } from "@context/auth";
import { Card, CardContent } from "@components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";
import { useToast } from "@hooks/use-toast";
import { getCookie } from "@utils/cookies";
import { SERVER } from "@constants";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { EditThemeModal } from "@components/theme/edit-modal";
import { ConfirmDialog } from "@components/ui/confirm-modal";
import { type LikesData, type Theme, type ThemeUpdatePayload } from "@types";
import { Download as DownloadIcon, Heart as HeartOutlineIcon, Calendar as CalendarIcon, BookOpen as BookIcon, Code as CodeIcon, Copy as CopyIcon, Check as CheckIcon, Github as GithubIcon, Eye as EyeIcon, ExternalLink as ExternalLinkIcon, Pencil as EditIcon, Trash2 as DeleteIcon, type LucideProps } from "lucide-react";

const HeartIcon = (props: LucideProps) => <HeartOutlineIcon fill="currentColor" {...props} />;

SyntaxHighlighter.registerLanguage("css", css);

const Skeleton = ({ className = "", ...props }) => <div className={`animate-pulse bg-muted/30 rounded ${className}`} {...props} />;

const decodeThemeContent = (content: string) => {
    try {
        return atob(content);
    } catch {
        return content;
    }
};

const ThemeCodeBlock = memo(function ThemeCodeBlock({ content }: { content: string }) {
    return (
        <SyntaxHighlighter
            language="css"
            style={vscDarkPlus}
            customStyle={{
                maxHeight: 500,
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                background: "transparent",
                margin: 0,
                padding: "1rem",
                fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            }}
            codeTagProps={{ style: { fontFamily: "inherit" } }}
            wrapLongLines={true}
        >
            {content}
        </SyntaxHighlighter>
    );
});

export default function Component({ id, theme }: { id?: string; theme: Theme }) {
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [likedThemes, setLikedThemes] = useState<LikesData | null>(null);
    const [isLikeDisabled, setIsLikeDisabled] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { authorizedUser, isAuthenticated, isLoading, mutateThemes } = useWebContext();
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const router = useRouter();
    const previewUrl = `/api/preview?url=/api/${id}`;

    const downloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const likeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const decodedContent = useMemo(() => decodeThemeContent(theme?.content ?? ""), [theme?.content]);

    const statsItems = useMemo(
        () => [
            {
                icon: DownloadIcon,
                label: "Downloads",
                value: theme?.downloads || 0
            },
            {
                icon: HeartIcon,
                label: "Likes",
                value: theme?.likes || 0
            },
            {
                icon: CalendarIcon,
                label: "Created",
                value: theme?.release_date ? new Date(theme.release_date).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }) : "Recently"
            },
            {
                icon: BookIcon,
                label: "Version",
                value: theme?.version || "1.0.0"
            }
        ],
        [theme]
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 768px)");
        setIsMobile(mediaQuery.matches);

        const handleChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            getLikedThemes();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        return () => {
            if (downloadTimeoutRef.current) clearTimeout(downloadTimeoutRef.current);
            if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        };
    }, []);

    if (!id) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Skeleton className="w-32 h-8" />
            </div>
        );
    }

    const handleAuthorClick = (author) => {
        router.push(`/users/${author.discord_snowflake}`);
    };

    const handleGithubClick = (githubName) => {
        window.open(`https://github.com/${githubName}`, "_blank");
    };

    const handleEdit = async (updatedTheme: ThemeUpdatePayload) => {
        try {
            const response = await fetch(`/api/themes/${theme.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getCookie("_dtoken")}`
                },
                body: JSON.stringify(updatedTheme)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to update theme");
            }

            toast({
                title: "Success",
                description: "Theme updated successfully"
            });

            if (mutateThemes) {
                await mutateThemes();
            }

            window.location.reload();
        } catch (error) {
            toast({
                title: "Error",
                description: (error instanceof Error && error.message) || "Failed to update theme",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/themes/${theme.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${getCookie("_dtoken")}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to delete theme");
            }

            toast({
                title: "Success",
                description: "Theme deleted successfully"
            });
            window.location.href = "/";
        } catch (error) {
            toast({
                title: "Error",
                description: (error instanceof Error && error.message) || "Failed to delete theme",
                variant: "destructive"
            });
        }
    };

    const renderAuthor = (author) => {
        if (isLoading) {
            return (
                <div key={author.discord_snowflake} className="p-2 rounded-lg border bg-background border-input">
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4 mt-2" />
                </div>
            );
        }

        return (
            <div key={author.discord_snowflake} className="p-4 rounded-2xl border bg-card/50 border-border/40 hover:border-primary/40 transition-all duration-200">
                <div className="flex flex-col gap-3">
                    <div>
                        <p className="font-semibold text-sm">{author.discord_name}</p>
                        <p className="text-xs text-muted-foreground">ID: {author.discord_snowflake}</p>
                    </div>
                    <div className={`grid gap-2 ${author.github_name ? "grid-cols-1" : ""}`}>
                        <Button variant="outline" size="sm" onClick={() => handleAuthorClick(author)} className="text-xs h-9">
                            <ExternalLinkIcon className="mr-2 h-3.5 w-3.5" />
                            View Profile
                        </Button>
                        {author.github_name && (
                            <Button variant="outline" size="sm" onClick={() => handleGithubClick(author.github_name)} className="text-xs h-9">
                                <GithubIcon className="mr-2 h-3.5 w-3.5" />
                                GitHub
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const handleDownload = async (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDownloaded(true);

        window.location.href = `/api/download/${theme.id}`;

        if (downloadTimeoutRef.current) clearTimeout(downloadTimeoutRef.current);
        downloadTimeoutRef.current = setTimeout(() => {
            setIsDownloaded(false);
        }, 5000);
    };

    const handleLike = (themeId) => async () => {
        if (!isAuthenticated || isLikeDisabled) return;
        if (!themeId || !likedThemes) return;

        setIsLikeDisabled(true);

        const token = getCookie("_dtoken");
        let response: Response;
        const isCurrentlyLiked = likedThemes?.likes?.find((t) => t.themeId === themeId)?.hasLiked;

        setLikedThemes((prev) => {
            if (!prev) return prev;

            const likes = prev.likes ?? [];
            const hasEntry = likes.some((like) => like.themeId === themeId);

            return {
                ...prev,
                likes: hasEntry ? likes.map((like) => (like.themeId === themeId ? { ...like, hasLiked: !isCurrentlyLiked } : like)) : [...likes, { themeId, hasLiked: true }]
            };
        });

        try {
            if (isCurrentlyLiked) {
                response = await fetch("/api/likes/remove", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ themeId })
                });
            } else {
                response = await fetch("/api/likes/add", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ themeId })
                });
            }

            if (!response.ok) {
                setLikedThemes((prev) => (prev ? {
                    ...prev,
                    likes: prev.likes.map((like) => (like.themeId === themeId ? { ...like, hasLiked: isCurrentlyLiked } : like))
                } : prev));

                toast({
                    description: "Failed to like theme, try again later."
                });
            } else {
                try {
                    localStorage.removeItem("likedThemes");
                    localStorage.removeItem("ct");
                } catch {
                    // ignore storage errors
                }
            }
        } catch {
            setLikedThemes((prev) => (prev ? {
                ...prev,
                likes: prev.likes.map((like) => (like.themeId === themeId ? { ...like, hasLiked: isCurrentlyLiked } : like))
            } : prev));

            toast({
                description: "Failed to like theme, try again later."
            });
        }

        likeTimeoutRef.current = setTimeout(() => {
            setIsLikeDisabled(false);
        }, 1500);
    };

    async function getLikedThemes() {
        const token = getCookie("_dtoken");

        try {
            const response = await fetch("/api/likes/get", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) return;

            const data = await response.json();
            setLikedThemes(data);
        } catch {
            // ignore network errors, keep existing state
        }
    }

    const themeAuthors = Array.isArray(theme?.author) ? theme.author : [theme?.author];
    const isThemeAuthor = themeAuthors.some((a) => a?.discord_snowflake?.toString() === authorizedUser?.id?.toString());

    const handleCopyCode = (content: string) => {
        navigator.clipboard.writeText(content);
        setIsCopied(true);
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <>
            <Head>
                <title>{`${theme.name} - Discord Theme`}</title>
                <meta name="description" content={theme.description} />
                <meta name="keywords" content={theme.tags.join(", ")} />
                <meta name="author" content="themes.equicord.org" />

                <meta property="og:type" content="website" />
                <meta property="og:title" content={theme.name} />
                <meta property="og:description" content={theme.description} />
                <meta property="og:image" content={theme.thumbnail_url} />
                <meta property="og:url" content={`${SERVER}/theme/${id}`} />
                <meta
                    property="og:site_name"
                    content={`${
                        // @ts-ignore
                        theme.author?.discord_name ? `@${theme.author.discord_name}` : theme.author.map((x) => `@${x.discord_name}`).join(", ")
                        } - https://themes.equicord.org`}
                />

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={theme.name} />
                <meta name="twitter:description" content={theme.description} />
                <meta name="twitter:image" content={theme.thumbnail_url} />
                <meta name="twitter:site" content="themes.equicord.org" />
            </Head>

            <div className="">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
                        <div className="space-y-8 min-w-0">
                            {isLoading ? (
                                <>
                                    <Skeleton className="h-8 w-3/4" />
                                    <Skeleton className="h-32 w-full" />
                                    <Skeleton className="h-64 w-full" />
                                </>
                            ) : (
                                <div>
                                    <div className="mb-8">
                                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-primary">{theme.name}</h1>
                                        <div className="description text-lg text-foreground leading-relaxed">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{theme.description}</ReactMarkdown>
                                        </div>
                                        {theme.tags && theme.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-6">
                                                {theme.tags.map((tag) => (
                                                    <span key={tag} className="px-3 py-1.5 bg-muted/50 text-sm font-medium rounded-full border border-border/30">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Card className="overflow-hidden border-border/40 mb-4">
                                        <CardContent className="p-0">
                                            <div className="bg-muted/20 rounded-2xl flex justify-center items-center overflow-hidden aspect-video">
                                                {theme.thumbnail_url ? (
                                                    <Image draggable={false} src={theme.thumbnail_url} alt={theme.name} width={1920} height={1080} className="object-cover w-full h-full" priority />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full w-full bg-muted/30">
                                                        <span className="text-muted-foreground/60 font-medium">No Preview Available</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/40">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h2 className="text-xl font-semibold text-primary">Source Code</h2>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleCopyCode(decodedContent)}
                                                    className="flex items-center gap-2 hover:text-foreground hover:border-foreground"
                                                >
                                                    {isCopied ? (
                                                        <>
                                                            <CheckIcon className="h-4 w-4" />
                                                            Copied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CopyIcon className="h-4 w-4" />
                                                            Copy Code
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            <div className="codeblock rounded-2xl border border-border/30 bg-muted/10 p-4 relative overflow-hidden">
                                                <ThemeCodeBlock content={decodedContent} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                            <Card className="border-border/40">
                                <CardContent className="p-6">
                                    <div className="space-y-3">
                                        <Button size="lg" disabled={isLoading || isDownloaded} onClick={handleDownload} className="w-full h-12 text-base font-medium">
                                            {isDownloaded ? (
                                                <>
                                                    <CheckIcon className="h-5 w-5 mr-2" />
                                                    Downloaded
                                                </>
                                            ) : (
                                                <>
                                                    <DownloadIcon className="h-5 w-5 mr-2" />
                                                    Download Theme
                                                </>
                                            )}
                                        </Button>

                                        {theme.source && (
                                            <Button disabled={isLoading} variant="outline" className="w-full h-11" onClick={() => window.open(theme.source, "_blank", "noopener,noreferrer")}>
                                                <GithubIcon className="mr-2 h-4 w-4" />
                                                View on GitHub
                                            </Button>
                                        )}

                                        <Button disabled={isLoading || isMobile} variant="outline" className="w-full h-11" onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}>
                                            <EyeIcon className="mr-2 h-4 w-4" />
                                            {isMobile ? "Preview (Desktop Only)" : "Live Preview"}
                                        </Button>

                                        {!isLoading &&
                                            (isAuthenticated ? (
                                                <Button
                                                    variant="outline"
                                                    disabled={!isAuthenticated || isLoading || isLikeDisabled}
                                                    className={`w-full h-11 ${
                                                        // @ts-ignore
                                                        likedThemes?.likes?.find((t) => t.themeId === theme.id)?.hasLiked ? "text-red-500 border-red-200 hover:bg-red-50" : "hover:text-red-500 hover:border-red-200"
                                                        }`}
                                                    onClick={handleLike(theme.id)}
                                                >
                                                    {
                                                        // @ts-ignore
                                                        likedThemes?.likes?.find((t) => t.themeId === theme.id)?.hasLiked ? <HeartIcon className="mr-2 h-4 w-4" /> : <HeartOutlineIcon className="mr-2 h-4 w-4" />
                                                    }
                                                    {
                                                        // @ts-ignore
                                                        likedThemes?.likes?.find((t) => t.themeId === theme.id)?.hasLiked ? "Liked" : "Like Theme"
                                                    }
                                                </Button>
                                            ) : (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger className="w-full">
                                                            <Button variant="outline" disabled={!isAuthenticated} className="w-full h-11">
                                                                <HeartOutlineIcon className="mr-2 h-4 w-4" /> Like Theme
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Log in to like themes</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {!isLoading &&
                                isAuthenticated &&
                                (isThemeAuthor ||
                                    authorizedUser?.is_admin) && (
                                    <Card className="border-destructive/20">
                                        <CardContent className="p-6">
                                            <h3 className="font-semibold mb-4">Author Options</h3>
                                            <div className="space-y-2">
                                                <Button
                                                    variant="outline"
                                                    className="w-full hover:text-foreground hover:border-foreground"
                                                    onClick={() => setEditModalOpen(true)}
                                                >
                                                    <EditIcon className="mr-2 h-4 w-4" />
                                                    Edit Theme
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                                                    onClick={() => setDeleteDialogOpen(true)}
                                                >
                                                    <DeleteIcon className="mr-2 h-4 w-4" />
                                                    Delete Theme
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                            {!isLoading && (
                                <Card className="border-border/40">
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold mb-4">Statistics</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {statsItems.map(({ icon: Icon, label, value }) => (
                                                <div key={label} className="text-center">
                                                    <Icon className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                                                    <div className="text-lg font-semibold">{value}</div>
                                                    <div className="text-xs text-muted-foreground">{label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {!isLoading && (
                                <Card className="border-border/40">
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold mb-4">Contributors</h3>
                                        <div className="space-y-3">{Array.isArray(theme.author) ? theme.author.map(renderAuthor) : renderAuthor(theme.author)}</div>
                                    </CardContent>
                                </Card>
                            )}

                            {!isLoading && theme.guild && (
                                <Card className="border-border/40">
                                    <CardContent className="p-6">
                                        <h3 className="font-semibold mb-4">Support Server</h3>
                                        <Button variant="outline" onClick={() => window.open(theme?.guild?.invite_link, "_blank")} className="w-full h-11">
                                            <ExternalLinkIcon className="mr-2 h-4 w-4" />
                                            Join {theme.guild.name}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
                {!isLoading && (
                    <>
                        <EditThemeModal open={editModalOpen} onOpenChange={setEditModalOpen} theme={theme} onSave={handleEdit} />

                        <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDelete} title="Delete Theme" description="Are you sure you want to delete this theme? This action cannot be undone." />
                    </>
                )}
            </div>
        </>
    );
}
