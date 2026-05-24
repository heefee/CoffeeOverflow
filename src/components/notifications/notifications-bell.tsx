"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NotificationItem {
  id: string;
  property_ref: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  async function loadNotifications() {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as {
      authenticated?: boolean;
      notifications?: NotificationItem[];
    };
    setNotifications(data.notifications ?? []);
  }

  useEffect(() => {
    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 30_000);
    window.addEventListener("eavizat:notifications-refresh", loadNotifications);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("eavizat:notifications-refresh", loadNotifications);
    };
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "POST" });
    await loadNotifications();
  }

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-secondary/70 text-muted-foreground transition-colors hover:text-primary"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notificări"
      >
        <Bell className="size-4" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed right-4 top-20 z-[3000] w-80 rounded-xl border border-border bg-card p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">Notificări</p>
            <Badge variant="outline" className="text-[10px]">
              {unreadCount} noi
            </Badge>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nu ai notificări încă.</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-lg border border-border bg-secondary/50 p-3 text-sm"
                >
                  <p className="font-medium text-foreground">{notification.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Link
                      href={`/harta?cf=${encodeURIComponent(notification.property_ref)}`}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Vezi imobilul
                    </Link>
                    {!notification.read_at ? (
                      <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => markRead(notification.id)}
                      >
                        <CheckCircle2 className="size-3" />
                        Citit
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
