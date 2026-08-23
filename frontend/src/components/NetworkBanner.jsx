import { useEffect, useState } from "react";

export default function NetworkBanner() {
  const [online, setOnline] = useState(
    navigator.onLine
  );
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let timer;

    const onOffline = () => {
      setOnline(false);
      setRestored(false);
    };

    const onOnline = () => {
      setOnline(true);
      setRestored(true);
      timer = setTimeout(
        () => setRestored(false),
        2500
      );
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener(
        "offline",
        onOffline
      );
      window.removeEventListener(
        "online",
        onOnline
      );
    };
  }, []);

  if (!online) {
    return (
      <div className="fixed inset-x-0 top-0 z-[100] bg-amber-200 px-4 py-2 text-center text-sm font-semibold text-black">
        Connection lost. Safe form data is preserved
        where possible.
      </div>
    );
  }

  if (restored) {
    return (
      <div className="fixed inset-x-0 top-0 z-[100] bg-emerald-200 px-4 py-2 text-center text-sm font-semibold text-black">
        Connection restored.
      </div>
    );
  }

  return null;
}
