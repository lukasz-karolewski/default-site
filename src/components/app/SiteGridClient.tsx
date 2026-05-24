"use client";

import { CheckIcon, PencilIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import type { SiteRecord } from "~/lib/data/schema";
import { cn } from "~/lib/shared/utils";
import { generateAvatarSvg } from "~/lib/ui/avatarGradient";
import { NoticeProvider, NoticeViewport } from "~/lib/ui/noticeContext";
import { buildSiteUrl } from "~/lib/ui/siteLink";
import { getUpstreamRedirectHost } from "~/lib/ui/upstreamHost";
import SiteEditModal from "./SiteEditModal";
import SiteReachabilityClient from "./SiteReachabilityClient";

interface SiteGridClientProps {
  sites: SiteRecord[];
  baseDomain: string;
}

export default function SiteGridClient({
  sites,
  baseDomain,
}: SiteGridClientProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const selectedSite = useMemo(
    () => sites.find((site) => site.id === selectedSiteId),
    [sites, selectedSiteId],
  );
  const modalInstanceKey = `${modalMode}:${selectedSiteId ?? "new"}:${modalOpen ? "open" : "closed"}`;
  const groupedSites = useMemo(() => {
    const groups = new Map<string, SiteRecord[]>();
    const sorted = [...sites].sort((a, b) => {
      const hostComparison = getUpstreamRedirectHost(a.upstream).localeCompare(
        getUpstreamRedirectHost(b.upstream),
        undefined,
        { sensitivity: "base" },
      );

      if (hostComparison !== 0) return hostComparison;

      return a.subdomain.localeCompare(b.subdomain, undefined, {
        sensitivity: "base",
      });
    });

    for (const site of sorted) {
      const redirectHost =
        getUpstreamRedirectHost(site.upstream) || "(unknown)";
      const existingGroup = groups.get(redirectHost);
      if (existingGroup) {
        existingGroup.push(site);
      } else {
        groups.set(redirectHost, [site]);
      }
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        if (a.toLowerCase().includes("localhost")) return -1;
        if (b.toLowerCase().includes("localhost")) return 1;
        return 0;
      })
      .map(([redirectHost, group]) => ({
        redirectHost,
        sites: group,
      }));
  }, [sites]);

  function openAddModal() {
    setModalMode("add");
    setSelectedSiteId(null);
    setModalOpen(true);
  }

  function openEditModal(siteId: string) {
    setModalMode("edit");
    setSelectedSiteId(siteId);
    setModalOpen(true);
  }

  return (
    <NoticeProvider>
      <section className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <h1 className="text-sm font-semibold uppercase tracking-[0.13em] text-foreground">
          {baseDomain} sites
        </h1>
        <div className="flex items-center gap-2">
          <Button
            aria-label="Add site"
            onClick={openAddModal}
            size="icon-sm"
            title="Add site"
            type="button"
            variant="outline"
          >
            <PlusIcon />
          </Button>
          <Button
            aria-label={isEditMode ? "Finish editing" : "Edit sites"}
            onClick={() => setIsEditMode((value) => !value)}
            size="icon-sm"
            title={isEditMode ? "Done" : "Edit"}
            type="button"
            variant={isEditMode ? "secondary" : "outline"}
          >
            {isEditMode ? <CheckIcon /> : <PencilIcon />}
          </Button>
        </div>
      </section>

      <NoticeViewport />
      <section className="mt-6 space-y-6">
        {groupedSites.length === 0 ? (
          <div className="border border-dashed border-border bg-background px-4 py-8 text-xs text-muted-foreground">
            No sites configured.
          </div>
        ) : null}

        {groupedSites.map((group) => (
          <section className="space-y-2" key={group.redirectHost}>
            <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {group.redirectHost}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
              {group.sites.map((site) => {
                const siteUrl = buildSiteUrl(site.subdomain, baseDomain);
                const faviconSrc =
                  site.favicon || generateAvatarSvg(site.subdomain);
                const tileClasses =
                  "group relative aspect-square overflow-hidden border border-border bg-background px-2 py-3 transition-colors hover:bg-muted/25 sm:px-4 sm:py-5";

                if (!isEditMode) {
                  return (
                    <SiteReachabilityClient key={site.id} site={site}>
                      {(isOnline) => {
                        const isOffline = isOnline === false;

                        return (
                          <a
                            aria-label={
                              isOffline
                                ? `${site.subdomain} is offline`
                                : `Open ${site.subdomain}`
                            }
                            className={cn(
                              tileClasses,
                              isOffline &&
                                "opacity-45 saturate-0 hover:bg-background",
                            )}
                            href={siteUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                              {/* biome-ignore lint/performance/noImgElement: Site favicons are dynamic upstream URLs or generated data URIs, which do not fit next/image without broad remote host configuration. */}
                              <img
                                alt=""
                                aria-hidden="true"
                                className={cn(
                                  "mb-2 h-6 w-6 object-contain sm:h-7 sm:w-7",
                                  isOffline
                                    ? "opacity-85"
                                    : "transition-transform duration-200 group-hover:-translate-y-1.5",
                                )}
                                loading="lazy"
                                src={faviconSrc}
                              />
                              <p
                                className={cn(
                                  "text-lg font-bold sm:text-xl",
                                  isOffline
                                    ? "text-muted-foreground"
                                    : "text-foreground transition-transform duration-200 group-hover:-translate-y-1.5",
                                )}
                              >
                                {site.subdomain}
                              </p>
                              <p
                                className={cn(
                                  "mt-1 text-xs text-muted-foreground",
                                  isOffline
                                    ? "opacity-100"
                                    : "opacity-0 translate-y-1 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100",
                                )}
                              >
                                {isOffline ? `${site.upstream}` : site.upstream}
                              </p>
                            </div>
                          </a>
                        );
                      }}
                    </SiteReachabilityClient>
                  );
                }

                return (
                  <article className={tileClasses} key={site.id}>
                    <div className="relative flex h-full items-center justify-center">
                      <div className="text-center">
                        {/* biome-ignore lint/performance/noImgElement: Site favicons are stored as dynamic upstream URLs or generated data URIs. */}
                        <img
                          alt=""
                          aria-hidden="true"
                          className="mx-auto mb-2 h-6 w-6 object-contain sm:h-7 sm:w-7"
                          loading="lazy"
                          src={faviconSrc}
                        />
                        <p className="text-lg font-bold text-foreground sm:text-xl">
                          {site.subdomain}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground opacity-80">
                          {site.upstream}
                        </p>
                      </div>
                      <Button
                        className="absolute right-0 top-0"
                        onClick={() => openEditModal(site.id)}
                        size="xs"
                        type="button"
                        variant="outline"
                      >
                        Edit
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </section>

      <SiteEditModal
        key={modalInstanceKey}
        mode={modalMode}
        onOpenChange={setModalOpen}
        open={modalOpen}
        site={selectedSite}
      />
    </NoticeProvider>
  );
}
