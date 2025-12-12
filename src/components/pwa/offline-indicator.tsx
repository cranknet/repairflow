"use client";

import { useEffect, useState } from "react";
import { SignalSlashIcon } from "@heroicons/react/24/outline";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }

    function handleOffline() {
      setIsOffline(true);
    }

    // Set initial state
    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg animate-in slide-in-from-bottom-2">
      <SignalSlashIcon className="h-4 w-4" />
      <span>You are currently offline</span>
    </div>
  );
}
