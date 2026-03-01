"use client";

import { useEffect, useState } from "react";
import type { SiteRecord } from "~/lib/data/schema";

interface SiteReachabilityClientProps {
  site: SiteRecord;
  children: (isOnline: boolean | undefined) => React.ReactNode;
}

interface ReachabilityResponse {
  online?: boolean;
}

export default function SiteReachabilityClient({
  site,
  children,
}: SiteReachabilityClientProps) {
  const [isOnline, setIsOnline] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let active = true;

    setIsOnline(undefined);

    void (async () => {
      let nextOnline = false;

      try {
        const query = new URLSearchParams({ subdomain: site.subdomain });
        const response = await fetch(`/api/sites/reachability?${query}`, {
          cache: "no-store",
        });

        if (response.ok) {
          const payload = (await response.json()) as ReachabilityResponse;
          nextOnline = payload.online === true;
        }
      } catch {}

      if (!active) return;
      setIsOnline(nextOnline);
    })();

    return () => {
      active = false;
    };
  }, [site.subdomain]);

  return <>{children(isOnline)}</>;
}
