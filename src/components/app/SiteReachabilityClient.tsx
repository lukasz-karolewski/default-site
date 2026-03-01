"use client";

import { useEffect, useState } from "react";
import type { SiteRecord } from "~/lib/data/schema";

interface SiteReachabilityClientProps {
  sites: SiteRecord[];
  children: (onlineBySiteId: Record<string, boolean>) => React.ReactNode;
}

interface ReachabilityResponse {
  online?: boolean;
}

export default function SiteReachabilityClient({
  sites,
  children,
}: SiteReachabilityClientProps) {
  const [onlineBySiteId, setOnlineBySiteId] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    let active = true;

    if (!sites.length) {
      setOnlineBySiteId({});
      return;
    }

    async function fetchReachability() {
      const entries = await Promise.all(
        sites.map(async (site) => {
          try {
            const query = new URLSearchParams({
              upstream: site.upstream,
              subdomain: site.subdomain,
            });
            const response = await fetch(`/api/sites/reachability?${query}`, {
              cache: "no-store",
            });

            if (!response.ok) return [site.id, false] as const;

            const payload = (await response.json()) as ReachabilityResponse;
            return [site.id, payload.online === true] as const;
          } catch {
            return [site.id, false] as const;
          }
        }),
      );

      if (!active) return;

      setOnlineBySiteId(Object.fromEntries(entries));
    }

    void fetchReachability();

    return () => {
      active = false;
    };
  }, [sites]);

  return <>{children(onlineBySiteId)}</>;
}
