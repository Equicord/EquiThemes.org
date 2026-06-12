"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useWebContext } from "@context/auth";
import { Button } from "@components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@components/ui/card";
import {
	Loader2,
	Search,
	Bell,
	ClipboardClock as PendingIcon,
	Users as UsersIcon,
	Code as FileCodeIcon,
	Download as DownloadIcon,
	Clock as ClockIcon,
	Database as DatabaseIcon
} from "lucide-react";
import { getCookie } from "@utils/cookies";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@components/ui/dialog";
import { Input } from "@components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { toast } from "@hooks/use-toast";
import type { InternalStats } from "@types";

export default function AdminDashboard() {
	const router = useRouter();
	const { isAuthenticated, authorizedUser, isLoading } = useWebContext();
	const [stats, setStats] = useState<InternalStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState(null);
	const [isSearching, setIsSearching] = useState(false);
	const [searchError, setSearchError] = useState(null);
	const [suggestions, setSuggestions] = useState<{ id: string; username: string | null; global_name: string | null; avatar: string | null }[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
	const [announcementTitle, setAnnouncementTitle] = useState("");
	const [announcementMessage, setAnnouncementMessage] = useState("");
	const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);
	const searchContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
				setShowSuggestions(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	useEffect(() => {
		if (isLoading) return;

		if (!isAuthenticated || !authorizedUser?.admin) {
			router.push("/");
			return;
		}

		const controller = new AbortController();
		const fetchStats = async () => {
			try {
				const token = getCookie("_dtoken");
				if (!isAuthenticated) {
					router.push("/");
					return;
				}

				const response = await fetch("/api/internal", {
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`
					},
					signal: controller.signal
				});

				if (controller.signal.aborted) return;
				if (response.ok) {
					const data = await response.json();
					if (controller.signal.aborted) return;
					setStats(data);
				} else {
					router.push("/");
				}
			} catch (error) {
				if (controller.signal.aborted) return;
				console.error("Error fetching admin data:", error);
				router.push("/");
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		};

		fetchStats();
		return () => controller.abort();
	}, [isAuthenticated, authorizedUser?.id, authorizedUser?.admin, isLoading, router]);

	useEffect(() => {
		const term = searchQuery.trim();
		if (term.length < 2) {
			setSuggestions([]);
			return;
		}

		const controller = new AbortController();
		const timeout = setTimeout(async () => {
			try {
				const token = getCookie("_dtoken");
				const response = await fetch(`/api/users/search?q=${encodeURIComponent(term)}`, {
					headers: { Authorization: `Bearer ${token}` },
					signal: controller.signal
				});
				if (!response.ok) return;
				const data = await response.json();
				setSuggestions(Array.isArray(data.users) ? data.users : []);
			} catch { }
		}, 250);

		return () => {
			clearTimeout(timeout);
			controller.abort();
		};
	}, [searchQuery]);

	if (isLoading || loading || !stats) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin" />
			</div>
		);
	}

	if (!isAuthenticated || !authorizedUser?.admin) {
		return null;
	}

	const handleUserSearch = async (value?: string) => {
		const term = (value ?? searchQuery).trim();
		if (!term) return;

		setShowSuggestions(false);
		setIsSearching(true);
		setSearchError(null);

		try {
			const token = getCookie("_dtoken");
			const response = await fetch(
				`/api/users?userString=${encodeURIComponent(term)}`,
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);

			if (!response.ok) {
				throw new Error(response.statusText);
			}

			const data = await response.json();
			setSearchResults(data);
		} catch (error) {
			setSearchError(error.message);
			setSearchResults(null);
		} finally {
			setIsSearching(false);
		}
	};

	const handleSendAnnouncement = async () => {
		if (!announcementTitle.trim() || !announcementMessage.trim()) {
			toast({
				title: "Error",
				description: "Please fill in both title and message",
				variant: "destructive"
			});
			return;
		}

		setIsSubmittingAnnouncement(true);
		try {
			const token = getCookie("_dtoken");
			const response = await fetch("/api/admin/announcement", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					title: announcementTitle,
					message: announcementMessage
				})
			});

			if (!response.ok) {
				throw new Error(response.statusText);
			}

			toast({
				title: "Success",
				description: "Announcement sent to all users",
				variant: "default"
			});

			setAnnouncementTitle("");
			setAnnouncementMessage("");
			setAnnouncementDialogOpen(false);
		} catch (error) {
			toast({
				title: "Error",
				description: error.message || "Failed to send announcement",
				variant: "destructive"
			});
		} finally {
			setIsSubmittingAnnouncement(false);
		}
	};

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
	};

	return (
		<div className="container mx-auto p-4 md:p-8 max-w-7xl">
			<div className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-4xl font-bold text-primary mb-2">
						Admin Dashboard
					</h1>
					<p className="text-muted-foreground">Site statistics and management</p>
				</div>
			</div>


			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

				<Card className="border-border/40">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Pending Submissions
						</CardTitle>
						<PendingIcon className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="text-3xl font-bold">
							{stats?.themes.pendingSubmissions ?? "0"}
						</div>
						<Button
							size="sm"
							variant="outline"
							className="w-full mt-4 text-xs h-9"
							onClick={() => router.push("/theme/submitted")}
						>
							View All
						</Button>
					</CardContent>
				</Card>


				<Card className="border-border/40">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Users
						</CardTitle>
						<UsersIcon className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							{stats?.users.total.toLocaleString()}
						</div>
						<p className="text-xs text-muted-foreground mt-2">
							<span className="text-green-500 font-medium">
								+{stats?.users.monthly.count.toLocaleString()}
							</span>{" "}
							this month
						</p>
					</CardContent>
				</Card>


				<Card className="border-border/40">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Themes
						</CardTitle>
						<FileCodeIcon className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							{stats?.themes.total}
						</div>
						<p className="text-xs text-muted-foreground mt-2">
							Top author: <span className="font-medium">{stats?.themes.topAuthor.themeCount}</span> themes
						</p>
					</CardContent>
				</Card>


				<Card className="border-border/40">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Downloads
						</CardTitle>
						<DownloadIcon className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							{stats?.themes.totalDownloads.toLocaleString()}
						</div>
					</CardContent>
				</Card>
			</div>


			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

				<Card className="border-border/40">
					<CardHeader className="flex flex-row items-center justify-between space-y-0">
						<CardTitle className="text-sm font-medium">
							Server Uptime
						</CardTitle>
						<ClockIcon className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							{Math.floor(stats?.sst.up / 86400)} days
						</div>
					</CardContent>
				</Card>


				<Card className="border-border/40">
					<CardHeader className="flex flex-row items-center justify-between space-y-0">
						<CardTitle className="text-sm font-medium">
							User Management
						</CardTitle>
						<UsersIcon className="h-5 w-5 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<Dialog>
							<DialogTrigger asChild>
								<Button variant="outline" className="w-full">
									<Search className="h-4 w-4 mr-2" />
									Search Users
								</Button>
							</DialogTrigger>

							<DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
								<DialogHeader>
									<DialogTitle>Search Users</DialogTitle>
								</DialogHeader>

								<div className="flex flex-col sm:flex-row gap-2">
									<div className="relative flex-1" ref={searchContainerRef}>
										<Input
											placeholder="Search by ID or username..."
											value={searchQuery}
											onChange={e => {
												setSearchQuery(e.target.value);
												setShowSuggestions(true);
											}}
											onFocus={() => setShowSuggestions(true)}
											onKeyDown={e =>
												e.key === "Enter" &&
												handleUserSearch()
											}
											className="w-full"
										/>
										{showSuggestions && suggestions.length > 0 && (
											<div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-y-auto max-h-60">
												{suggestions.map(s => (
													<button
														key={s.id}
														type="button"
														onMouseDown={e => e.preventDefault()}
														onClick={() => {
															setSearchQuery(s.id);
															handleUserSearch(s.id);
														}}
														className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors"
													>
														<Avatar className="h-8 w-8">
															<AvatarImage
																src={
																	s.avatar
																		? `https://cdn.discordapp.com/avatars/${s.id}/${s.avatar}.png`
																		: undefined
																}
																alt={s.global_name ?? s.id}
															/>
															<AvatarFallback>
																{(s.global_name ?? s.username ?? s.id).charAt(0).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div className="min-w-0">
															<div className="truncate text-sm font-medium">
																{s.global_name ?? s.username ?? "Unknown"}
															</div>
															<div className="truncate text-xs text-muted-foreground">
																{s.id}
															</div>
														</div>
													</button>
												))}
											</div>
										)}
									</div>
									<Button
										onClick={() => handleUserSearch()}
										disabled={isSearching}
										size="sm"
									>
										{isSearching ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Search className="h-4 w-4" />
										)}
									</Button>
								</div>

								{isSearching && (
									<div className="flex justify-center py-8">
										<Loader2 className="h-8 w-8 animate-spin" />
									</div>
								)}

								{searchError && (
									<div className="text-destructive p-4 rounded-lg bg-destructive/10 border border-destructive/20">
										Error: {searchError}
									</div>
								)}

								{searchResults && (
									<div className="mt-6 space-y-6 overflow-y-auto pr-2 pb-2">

										<div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border/40">
											<Avatar className="h-16 w-16">
												<AvatarImage
													src={
														searchResults.discord
															?.avatar
															? `https://cdn.discordapp.com/avatars/${searchResults.discord.id}/${searchResults.discord.avatar}.png`
															: undefined
													}
												/>
												<AvatarFallback>
													{searchResults.discord?.username?.charAt(
														0
													) || "U"}
												</AvatarFallback>
											</Avatar>
											<div className="space-y-1">
												<h3 className="text-lg font-semibold">
													{searchResults.discord
														?.global_name ||
														searchResults.discord
															?.username}
													{searchResults.discord
														?.discriminator &&
														searchResults.discord
															.discriminator !==
														"0" && (
															<span className="text-muted-foreground text-sm">
																#{
																	searchResults
																		.discord
																		.discriminator
																}
															</span>
														)}
												</h3>
												<p className="text-sm text-muted-foreground">
													{searchResults.discord?.id}
												</p>
											</div>
										</div>


										<div className="space-y-3 grid grid-cols-2 gap-3">
											<div>
												<Label htmlFor="userId">
													User ID
												</Label>
												<Input
													id="userId"
													value={
														searchResults.discord
															?.id || ""
													}
													disabled
													className="mt-1"
												/>
											</div>

											<div>
												<Label htmlFor="username">
													Username
												</Label>
												<Input
													id="username"
													value={
														searchResults.discord
															?.username || ""
													}
													disabled
													className="mt-1"
												/>
											</div>

											<div>
												<Label htmlFor="displayName">
													Display Name
												</Label>
												<Input
													id="displayName"
													value={
														searchResults.discord
															?.global_name ||
														"None"
													}
													disabled
													className="mt-1"
												/>
											</div>

											{searchResults.user && (
												<>
													<div>
														<Label htmlFor="createdAt">
															Account Created
														</Label>
														<Input
															id="createdAt"
															value={
																searchResults.discord
																	? new Date(
																		searchResults
																			.discord
																			.id /
																		4194304 +
																		1420070400000
																	).toLocaleDateString()
																	: "Unknown"
															}
															disabled
															className="mt-1"
														/>
													</div>

													<div>
														<Label htmlFor="registeredAt">
															Registered On Site
														</Label>
														<Input
															id="registeredAt"
															value={new Date(
																searchResults.user.createdAt
															).toLocaleDateString()}
															disabled
															className="mt-1"
														/>
													</div>

													<div>
														<Label htmlFor="adminStatus">
															Admin
														</Label>
														<Input
															id="adminStatus"
															value={
																searchResults
																	.user
																	.user
																	.admin
																	? "Yes"
																	: "No"
															}
															disabled
															className="mt-1"
														/>
													</div>

													<div>
														<Label htmlFor="themeCount">
															Themes
														</Label>
														<Input
															id="themeCount"
															value={
																searchResults
																	.user
																	.user
																	.themes
																	?.length ||
																0
															}
															disabled
															className="mt-1"
														/>
													</div>

													{searchResults.user.user
														.githubAccount && (
															<div className="col-span-2">
																<Label htmlFor="githubAccount">
																	GitHub Account
																</Label>
																<Input
																	id="githubAccount"
																	value={
																		searchResults
																			.user
																			.user
																			.githubAccount
																	}
																	disabled
																	className="mt-1"
																/>
															</div>
														)}
												</>
											)}
										</div>
									</div>
								)}
							</DialogContent>
						</Dialog>
					</CardContent>
				</Card>
			</div>


			<div className="mt-8">
				<Card className="border-border/40">
					<CardHeader>
						<div className="flex items-center gap-2">
							<Bell className="h-5 w-5 text-muted-foreground" />
							<div>
								<CardTitle>Send Announcement</CardTitle>
								<CardDescription>
									Send a notification to all users
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
							<DialogTrigger asChild>
								<Button className="w-full">
									<Bell className="h-4 w-4 mr-2" />
									New Announcement
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-md">
								<DialogHeader>
									<DialogTitle>Send Announcement</DialogTitle>
								</DialogHeader>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="announcementTitle">
											Title
										</Label>
										<Input
											id="announcementTitle"
											placeholder="Announcement title..."
											value={announcementTitle}
											onChange={(e) =>
												setAnnouncementTitle(
													e.target.value
												)
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="announcementMessage">
											Message
										</Label>
										<Textarea
											id="announcementMessage"
											placeholder="Announcement message..."
											value={announcementMessage}
											onChange={(e) =>
												setAnnouncementMessage(
													e.target.value
												)
											}
											rows={5}
										/>
									</div>
									<Button
										onClick={handleSendAnnouncement}
										disabled={isSubmittingAnnouncement}
										className="w-full"
									>
										{isSubmittingAnnouncement ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Sending...
											</>
										) : (
											<>
												<Bell className="h-4 w-4 mr-2" />
												Send Announcement
											</>
										)}
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					</CardContent>
				</Card>
			</div>

			<div className="mt-8">
				<Card className="border-border/40">
					<CardHeader>
						<div className="flex items-center gap-2">
							<DatabaseIcon className="h-5 w-5 text-muted-foreground" />
							<div>
								<CardTitle>Database Statistics</CardTitle>
								<CardDescription>
									Current database metrics and usage
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{[
								{
									title: "Collections",
									value: stats?.dbst.collections
								},
								{
									title: "Objects",
									value: stats?.dbst.objects.toLocaleString()
								},
								{
									title: "Data Size",
									value: formatBytes(stats?.dbst.dataSize)
								},
								{
									title: "Storage Size",
									value: formatBytes(stats?.dbst.storageSize)
								}
							].map((item, index) => (
								<div key={index} className="p-4 rounded-lg border border-border/40 bg-muted/20">
									<h3 className="text-sm font-medium text-muted-foreground">
										{item.title}
									</h3>
									<p className="text-2xl font-bold mt-2">
										{item.value}
									</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
