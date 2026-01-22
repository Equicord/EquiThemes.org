import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { Badge } from "@components/ui/badge";
import { getCookie } from "@utils/cookies";
import { cn } from "@lib/utils";
import type { Notification } from "@types";

let notificationCache: Notification[] = [];
let lastFetchTime: number = 0;
const CACHE_DURATION = 30000; 

export function NotificationsBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [isMarkingRead, setIsMarkingRead] = useState(false);

    
    useEffect(() => {
        const preloadNotifications = async () => {
            try {
                const response = await fetch("/api/user/notifications", {
                    headers: {
                        Authorization: `Bearer ${getCookie("_dtoken")}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    notificationCache = data;
                    lastFetchTime = Date.now();
                    setNotifications(data);
                }
            } catch (error) {
                console.error("Failed to preload notifications:", error);
            }
        };

        preloadNotifications();

        
        const interval = setInterval(preloadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        const now = Date.now();
        
        
        if (now - lastFetchTime < CACHE_DURATION && notificationCache.length > 0) {
            setNotifications(notificationCache);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/user/notifications", {
                headers: {
                    Authorization: `Bearer ${getCookie("_dtoken")}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                notificationCache = data;
                lastFetchTime = now;
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open]);

    const handleMarkAllAsRead = async () => {
        setIsMarkingRead(true);
        try {
            
            const updatedNotifications = notifications.map((n) => ({ ...n, read: true }));
            setNotifications(updatedNotifications);
            notificationCache = updatedNotifications;

            
            await fetch("/api/user/notifications/mark-read", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getCookie("_dtoken")}`
                },
                body: JSON.stringify({ markAllAsRead: true })
            });
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
            
            setNotifications(notificationCache);
        } finally {
            setIsMarkingRead(false);
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge className="absolute top-0 right-0 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-600 text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto p-0">
                <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={handleMarkAllAsRead}
                            disabled={isMarkingRead}
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">No notifications</p>
                    </div>
                ) : (
                    <div className="space-y-0">
                        {notifications.map((notification, index) => {
                            const getNotificationColor = () => {
                                switch (notification.type) {
                                    case "theme_approved":
                                        return "bg-green-500";
                                    case "theme_rejected":
                                    case "user_banned":
                                        return "bg-red-500";
                                    case "user_unbanned":
                                        return "bg-blue-500";
                                    case "announcement":
                                        return "bg-purple-500";
                                    default:
                                        return "bg-gray-500";
                                }
                            };

                            return (
                                <div key={notification.id || index}>
                                    <div
                                        className={cn(
                                            "p-4 border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors cursor-pointer",
                                            !notification.read && "bg-accent/20"
                                        )}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${getNotificationColor()}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm">{notification.message}</p>
                                                {notification.reason && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {(notification.type === "theme_rejected" || notification.type === "user_banned") && "Reason: "}
                                                        {notification.reason}
                                                    </p>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {new Date(notification.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
