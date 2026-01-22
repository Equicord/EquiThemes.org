import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { useMemo, useState, useCallback } from "react";
import { Code as CodeIcon, Label as LabelIcon, CheckCircle as CheckIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { cn } from "@lib/utils";
import { ThemeCard } from "./card";
import { Theme } from "@types";
import { useToast } from "@hooks/use-toast";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Switch } from "@components/ui/switch";

interface EditThemeModalProps {
    open: boolean;
    // eslint-disable-next-line no-unused-vars
    onOpenChange: (open: boolean) => void;
    theme?: Theme;
    // eslint-disable-next-line no-unused-vars
    onSave: (data: any) => Promise<void>;
}

interface FieldValidation {
    [key: string]: boolean;
}

export function EditThemeModal({ open, onOpenChange, theme, onSave }: EditThemeModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingContent, setIsFetchingContent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [useAsImport, setUseAsImport] = useState(false);

    const [formData, setFormData] = useState({
        name: theme?.name || "",
        description: theme?.description || "",
        version: theme?.version || "",
        sourceLink: theme?.source || "",
        content: ""
    });

    const decodedThemeContent = useMemo(() => {
        return theme?.content ? Buffer.from(theme.content, "base64").toString() : "";
    }, [theme?.content]);

    const fieldValidation: FieldValidation = useMemo(
        () => ({
            name: formData.name.trim() !== "",
            description: formData.description.trim() !== "",
            sourceLink: formData.sourceLink.trim() !== ""
        }),
        [formData]
    );

    const hasChanges = useMemo(() => {
        return formData.name.trim() !== theme?.name?.trim() || formData.description.trim() !== theme?.description?.trim() || formData.version.trim() !== (theme?.version || "").trim() || formData.sourceLink.trim() !== (theme?.source || "").trim();
    }, [formData, theme]);

    const isValid = useMemo(() => {
        return Object.values(fieldValidation).every((v) => v === true);
    }, [fieldValidation]);

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setError(null);
        setFormData((prev) => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const fetchContentFromGitHub = useCallback(
        async (sourceUrl: string) => {
            try {
                setIsFetchingContent(true);
                setError(null);

                const response = await fetch("/api/parse-source", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ url: sourceUrl })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to fetch CSS content");
                }

                const { content: base64Content } = await response.json();
                let content = Buffer.from(base64Content, "base64").toString("utf-8");

                const headerMatch = content.match(/^((?:\/\*[\s\S]*?\*\/\s*)*)/);
                const header = headerMatch ? headerMatch[1].trim() : "";

                const versionMatch = content.match(/@version\s+([\d.]+)/i);
                const existingVersion = versionMatch ? versionMatch[1] : null;

                if (useAsImport) {
                    const importStatement = `@import url("${sourceUrl}");`;
                    content = header ? `${header}\n\n${importStatement}` : importStatement;
                }

                setFormData((prev) => ({
                    ...prev,
                    content,
                    version: existingVersion || prev.version
                }));

                toast({
                    title: "Success",
                    description: "CSS content fetched successfully"
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch CSS content");
                toast({
                    title: "Error",
                    description: err instanceof Error ? err.message : "Failed to fetch CSS content",
                    variant: "destructive"
                });
            } finally {
                setIsFetchingContent(false);
            }
        },
        [useAsImport, toast]
    );

    const handleSave = async () => {
        if (!hasChanges || !isValid) return;

        try {
            setIsLoading(true);
            setError(null);
            const saveData: any = {
                name: formData.name,
                description: formData.description,
                version: formData.version,
                sourceLink: formData.sourceLink,
                last_updated: new Date().toISOString()
            };

            if (formData.content) {
                saveData.content = formData.content;
            }

            await onSave(saveData);
            toast({
                title: "Success",
                description: "Your theme has been updated successfully"
            });
            onOpenChange(false);
        } catch {
            setError("Failed to save changes. Please try again.");
            toast({
                title: "Error",
                description: "Failed to save changes. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const FormField = ({ label, field, required = false, placeholder, isTextarea = false }: { label: string; field: keyof typeof formData; required?: boolean; placeholder: string; isTextarea?: boolean }) => {
        const isValid = fieldValidation[field];
        const hasChanged = field === "sourceLink" ? formData.sourceLink.trim() !== (theme?.source || "").trim() : (formData[field] as string).trim() !== ((theme?.[field as keyof typeof theme] as string) || "").trim();

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {hasChanged && <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">Modified</span>}
                </div>
                {isTextarea ? (
                    <Textarea value={formData[field] as string} onChange={handleChange(field)} placeholder={placeholder} className={cn("min-h-[120px] font-mono text-sm", "border-muted focus:border-primary transition-colors", !isValid && required && "border-red-500")} required={required} />
                ) : (
                    <Input value={formData[field] as string} onChange={handleChange(field)} placeholder={placeholder} className={cn("border-muted focus:border-primary transition-colors", !isValid && required && "border-red-500")} required={required} />
                )}
                {!isValid && required && <p className="text-xs text-red-500 font-medium">{label} is required</p>}
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className="sm:max-w-5xl max-h-[95vh] overflow-y-auto p-0 flex flex-col w-full" 
                tabIndex={-1}
            >
                <DialogHeader className="px-6 pt-6 pb-4 mb-6 border-b border-muted">
                    <DialogTitle className="text-2xl font-bold">Edit Theme</DialogTitle>
                </DialogHeader>

                <div className={cn("grid gap-0 flex-1 overflow-y-auto", showPreview ? "lg:grid-cols-2" : "grid-cols-1")}>
                    <div className="space-y-6 px-6 pb-6" onClick={(e) => e.stopPropagation()}>
                        <FormField label="Theme Name" field="name" required placeholder="My Awesome Theme" />

                        <FormField label="Description" field="description" required placeholder="A brief description of your theme..." isTextarea />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Version" field="version" placeholder="1.0.0" />

                            <FormField label="Source Link" field="sourceLink" required placeholder="https://github.com/..." />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-foreground">
                                    CSS Content
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Use as import?</span>
                                        <Switch checked={useAsImport} onCheckedChange={setUseAsImport} disabled={!formData.content} />
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => fetchContentFromGitHub(formData.sourceLink)} disabled={!formData.sourceLink.trim() || isFetchingContent} className="text-xs">
                                        <RefreshIcon className="h-3 w-3 mr-1" />
                                        {isFetchingContent ? "Fetching..." : "Fetch Content"}
                                    </Button>
                                </div>
                            </div>

                            {formData.content || decodedThemeContent ? (
                                <div className="codeblock rounded-xl border border-border/30 bg-muted/10 p-4 relative overflow-hidden">
                                    <SyntaxHighlighter
                                        language="css"
                                        style={vscDarkPlus}
                                        customStyle={{
                                            maxHeight: 400,
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
                                        {formData.content || decodedThemeContent}
                                    </SyntaxHighlighter>
                                </div>
                            ) : (
                                <div className={cn("min-h-[120px] w-full bg-muted/50 border border-muted rounded p-4 font-mono text-sm", "flex items-center justify-center text-muted-foreground")}>CSS content will appear here once fetched from GitHub</div>
                            )}

                            {!formData.content && !decodedThemeContent && <p className="text-xs text-amber-600 font-medium">Supports GitHub, GitLab, and any raw CSS file URL. Use the "Fetch Content" button to load CSS.</p>}
                        </div>

                        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded-lg text-sm font-medium">{error}</div>}

                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={() => setShowPreview(!showPreview)} variant={showPreview ? "default" : "secondary"} disabled={!isValid} className="flex-1">
                                Preview
                            </Button>
                            <Button onClick={handleSave} disabled={isLoading || !hasChanges || !isValid} className="flex-1">
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted border-t-current mr-2" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Theme"
                                )}
                            </Button>
                        </div>
                    </div>

                    {showPreview && (
                        <div className="hidden lg:flex flex-col space-y-4 pt-0 lg:border-l lg:border-muted lg:pl-8 px-6 pb-6 overflow-hidden max-h-[calc(95vh-120px)]">
                            <h4 className="text-sm font-semibold">Preview</h4>
                            <div className="overflow-auto">
                                {/* @ts-ignore */}
                                <ThemeCard
                                    theme={{
                                        ...theme,
                                        name: formData.name,
                                        description: formData.description,
                                        version: formData.version,
                                        source: formData.sourceLink,
                                        content: formData.content || decodedThemeContent,
                                        last_updated: new Date().toISOString(),
                                        id: "preview",
                                        type: "preview"
                                    }}
                                    disableDownloads
                                />
                            </div>
                        </div>
                    )}

                    {showPreview && (
                        <div className="lg:hidden col-span-1 space-y-4 pt-4 border-t border-muted mt-4 px-6 pb-6">
                            <h4 className="text-sm font-semibold">Preview</h4>
                            {/* @ts-ignore */}
                            <ThemeCard
                                theme={{
                                    ...theme,
                                    name: formData.name,
                                    description: formData.description,
                                    version: formData.version,
                                    source: formData.sourceLink,
                                    content: formData.content || decodedThemeContent,
                                    last_updated: new Date().toISOString(),
                                    id: "preview",
                                    type: "preview"
                                }}
                                disableDownloads
                            />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
