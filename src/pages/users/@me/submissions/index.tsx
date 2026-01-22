import React, { useEffect, useState } from "react";
import { useWebContext } from "@context/auth";
import { useRouter } from "next/router";
import { getCookie } from "@utils/cookies";
import { Warning as AlertTriangleIcon, CheckCircle as CheckCircleIcon, Schedule as HourglassIcon, Cancel as XCircleIcon } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@components/ui/badge";
import { Card } from "@components/ui/card";
import { Alert } from "@components/ui/alert";

interface Submission {
    title: string;
    description: string;
    sourceLink: string;
    validatedUsers: { [key: string]: { id: string; username: string; avatar: string } };
    themeContent: string;
    submittedAt: { $date: string };
    fileUrl?: string;
    file?: string;
    reason?: string;
    state: string;
}

const SubmissionsPage: React.FC = () => {
    const { authorizedUser, isLoading } = useWebContext();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
      if (isLoading) return;
        const fetchSubmissions = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = getCookie("_dtoken");
                if (!token) {
                    router.push("/");
                    setLoading(false);
                    return;
                }
                setIsAdmin(authorizedUser.admin);
                const submissionsResponse = await fetch("/api/get/submissions", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (!submissionsResponse.ok) {
                    throw new Error("Failed to fetch submissions");
                }
                const data = await submissionsResponse.json();
                setSubmissions(data);
            } catch (err: any) {
                setError(err.message || "Unknown error");
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, [authorizedUser, isLoading]);

    const getStateIcon = (state: string) => {
        switch (state) {
            case "approved":
                return <CheckCircleIcon className="text-green-500 mr-1 w-4 h-4" aria-label="Approved" />;
            case "pending":
                return <HourglassIcon className="text-yellow-500 mr-1 w-4 h-4" aria-label="Pending" />;
            default:
                return <XCircleIcon className="text-red-500 mr-1 w-4 h-4" aria-label="Rejected" />;
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
                        <Alert className="border-yellow-500/20 bg-yellow-500/5">
                            <AlertTriangleIcon sx={{ width: 20, height: 20 }} className="text-yellow-600 mr-3 inline" />
                            <div className="inline-block">
                                <span className="font-semibold text-yellow-600">Admin Warning:</span>
                                <span className="text-yellow-600 ml-2">This page displays <b>all</b> theme submissions from all users</span>
                            </div>
                        </Alert>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-primary mb-4"></div>
                        <p className="text-muted-foreground">Loading submissions...</p>
                    </div>
                ) : error ? (
                    <Card className="p-12 text-center border-destructive/20 bg-destructive/5">
                        <XCircleIcon sx={{ width: 48, height: 48 }} className="text-destructive mx-auto mb-4 opacity-70" />
                        <p className="text-destructive font-medium text-lg">{error}</p>
                    </Card>
                ) : submissions.length === 0 ? (
                    <Card className="p-12 text-center border-border/40">
                        <p className="text-muted-foreground text-2xl mb-2">¯{"\\"}_(ツ)_/¯</p>
                        <p className="text-muted-foreground">No submissions found</p>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {submissions.map((submission, idx) => (
                            <Card key={idx} className="p-0 flex flex-col border-border/40 hover:border-border/80 transition-all duration-200 overflow-hidden h-full">
                                {submission.fileUrl && (
                                    <img 
                                        src={submission.fileUrl} 
                                        alt={submission.title} 
                                        className="w-full h-40 object-cover object-center border-b border-border/30" 
                                    />
                                )}
                                <div className="p-6 flex flex-col flex-1 space-y-4">
                                    
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-semibold text-lg text-foreground break-words flex-grow leading-tight">
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

                                    
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({node, ...props}) => <span {...props} />,
                                            }}
                                        >
                                            {submission.description}
                                        </ReactMarkdown>
                                    </p>

                                    
                                    {submission.reason && (
                                        <div className="flex items-start gap-2 text-sm bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
                                            <AlertTriangleIcon sx={{ width: 16, height: 16 }} className="text-destructive flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-destructive">Reason:</p>
                                                <p className="text-destructive/80 text-xs">{submission.reason}</p>
                                            </div>
                                        </div>
                                    )}

                                    
                                    <div className="pt-4 border-t border-border/30 space-y-2">
                                        <p className="text-xs text-muted-foreground">
                                            Submitted {new Date(submission.submittedAt as any as string).toLocaleDateString()} at {new Date(submission.submittedAt as any as string).toLocaleTimeString()}
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
