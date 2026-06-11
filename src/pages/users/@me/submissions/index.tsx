import React, { useEffect, useState } from "react";
import { useWebContext } from "@context/auth";
import { useRouter } from "next/router";
import { getCookie } from "@utils/cookies";
import { AlertTriangle as AlertTriangleIcon, CheckCircle2 as CheckCircleIcon, Clock as HourglassIcon, XCircle as XCircleIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@components/ui/badge";
import { Card } from "@components/ui/card";
import { type ThemeSubmission as Submission } from "@types";

const SubmissionsPage: React.FC = () => {
    const { authorizedUser, isAuthenticated, isLoading } = useWebContext();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        const controller = new AbortController();
        const fetchSubmissions = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = getCookie("_dtoken");
                if (!isAuthenticated || !authorizedUser) {
                    router.push("/");
                    setLoading(false);
                    return;
                }
                setIsAdmin(!!authorizedUser?.admin);
                const submissionsResponse = await fetch("/api/get/submissions", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    signal: controller.signal
                });
                if (!submissionsResponse.ok) {
                    throw new Error("Failed to fetch submissions");
                }
                const data = await submissionsResponse.json();
                if (controller.signal.aborted) return;
                setSubmissions(data);
            } catch (err) {
                if (controller.signal.aborted) return;
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };
        fetchSubmissions();
        return () => controller.abort();
    }, [authorizedUser?.id, authorizedUser?.admin, isAuthenticated, isLoading]);

    const getStateIcon = (state: string) => {
        switch (state) {
            case "approved":
                return <CheckCircleIcon className="flex w-4 h-4 !text-green-500" aria-label="Approved" />;
            case "pending":
                return <HourglassIcon className="flex w-4 h-4 !text-yellow-500" aria-label="Pending" />;
            default:
                return <XCircleIcon className="flex w-4 h-4 !text-red-500" aria-label="Rejected" />;
        }
    };

    return (
        <div className="min-h-screen py-10 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="space-y-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-primary mb-2">My Theme Submissions</h1>
                        <p className="text-muted-foreground">Track and manage all your theme submissions</p>
                    </div>

                    {isAdmin && (
                        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
                            <AlertTriangleIcon className="w-5 h-5 !text-yellow-600 shrink-0" />
                            <div>
                                <span className="font-semibold text-yellow-600">Admin Warning:</span>
                                <span className="text-yellow-600 ml-2">This page displays <b>all</b> theme submissions from all users</span>
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading submissions...</p>
                    </div>
                ) : error ? (
                    <Card className="p-12 text-center border-destructive/20 bg-destructive/5">
                        <XCircleIcon className="w-12 h-12 text-destructive mx-auto mb-4 opacity-70" />
                        <p className="text-destructive font-medium text-lg">{error}</p>
                    </Card>
                ) : submissions.length === 0 ? (
                    <Card className="p-12 text-center border-border/40">
                        <p className="text-muted-foreground text-2xl mb-2">¯{"\\"}_(ツ)_/¯</p>
                        <p className="text-muted-foreground">No submissions found</p>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {submissions.map((submission) => (
                            <Card key={submission._id} className="p-0 flex flex-col border-border/40 hover:border-border/80 transition-all duration-200 overflow-hidden h-full">
                                <div className="p-6 flex flex-col flex-1 space-y-4">

                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-semibold text-lg text-foreground break-words flex-grow leading-tight min-w-0">
                                            {submission.title}
                                        </h3>
                                        <Badge
                                            variant={
                                                submission.state === "approved"
                                                    ? "default"
                                                    : submission.state === "pending"
                                                        ? "secondary"
                                                        : "destructive"
                                            }
                                            className="flex-shrink-0 whitespace-nowrap"
                                        >
                                            <span className="flex items-center gap-1">
                                                {getStateIcon(submission.state)}
                                                {submission.state.charAt(0).toUpperCase() + submission.state.slice(1)}
                                            </span>
                                        </Badge>
                                    </div>


                                    <div className="text-sm text-muted-foreground line-clamp-3">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({ node, ...props }) => <span {...props} />,
                                            }}
                                        >
                                            {submission.description}
                                        </ReactMarkdown>
                                    </div>


                                    {submission.reason && (
                                        <div className="flex items-start gap-2 text-sm bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
                                            <AlertTriangleIcon className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-destructive">Reason:</p>
                                                <p className="text-destructive/80 text-xs">{submission.reason}</p>
                                            </div>
                                        </div>
                                    )}


                                    <div className="pt-4 border-t border-border/30 space-y-2">
                                        <p className="text-xs text-muted-foreground">
                                            Submitted {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString()}
                                        </p>
                                        {submission.sourceLink && (
                                            <a
                                                href={submission.sourceLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block text-primary hover:underline text-xs font-medium transition-colors"
                                            >
                                                View Source →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubmissionsPage;
