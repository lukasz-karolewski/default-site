"use client";

import { CheckIcon, PencilIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import type { SiteRecord } from "~/lib/data/schema";
import { cn } from "~/lib/shared/utils";
import { generateAvatarSvg } from "~/lib/ui/avatarGradient";
import { NoticeProvider, NoticeViewport } from "~/lib/ui/noticeContext";
import { buildSiteUrl } from "~/lib/ui/siteLink";
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
  const sortedSites = useMemo(
    () =>
      [...sites].sort((a, b) =>
        a.subdomain.localeCompare(b.subdomain, undefined, {
          sensitivity: "base",
        }),
      ),
    [sites],
  );

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
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={openAddModal}
            aria-label="Add site"
            title="Add site"
          >
            <PlusIcon />
          </Button>
          <Button
            type="button"
            variant={isEditMode ? "secondary" : "outline"}
            size="icon-sm"
            onClick={() => setIsEditMode((value) => !value)}
            aria-label={isEditMode ? "Finish editing" : "Edit sites"}
            title={isEditMode ? "Done" : "Edit"}
          >
            {isEditMode ? <CheckIcon /> : <PencilIcon />}
          </Button>
        </div>
      </section>

      <NoticeViewport />

      <SiteReachabilityClient sites={sortedSites}>
        {(onlineBySiteId) => (
          <section className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
            {sortedSites.map((site) => {
              const siteUrl = buildSiteUrl(site.subdomain, baseDomain);
              const faviconSrc = site.favicon || generateAvatarSvg(site.subdomain);
              const tileClasses =
                "group relative aspect-square overflow-hidden border border-border bg-background px-2 py-3 transition-colors hover:bg-muted/25 sm:px-4 sm:py-5";
              const isOffline = onlineBySiteId[site.id] === false;

              if (!isEditMode) {
                return (
                  <a
                    key={site.id}
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      tileClasses,
                      isOffline && "opacity-45 saturate-0 hover:bg-background",
                    )}
                    aria-label={isOffline ? `${site.subdomain} is offline` : `Open ${site.subdomain}`}
                  >
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <img
                        src={faviconSrc}
                        alt=""
                        aria-hidden="true"
                        className={cn(
                          "mb-2 h-6 w-6 object-contain sm:h-7 sm:w-7",
                          isOffline
                            ? "opacity-85"
                            : "transition-transform duration-200 group-hover:-translate-y-1.5",
                        )}
                        loading="lazy"
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
                        {isOffline ? "Offline" : site.upstream}
                      </p>
                    </div>
                  </a>
                );
              }

              return (
                <article key={site.id} className={tileClasses}>
                  <div className="relative flex h-full items-center justify-center">
                    <div className="text-center">
                      <img
                        src={faviconSrc}
                        alt=""
                        aria-hidden="true"
                        className="mx-auto mb-2 h-6 w-6 object-contain sm:h-7 sm:w-7"
                        loading="lazy"
                      />
                      <p className="text-lg font-bold text-foreground sm:text-xl">
                        {site.subdomain}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground opacity-80">
                        {site.upstream}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => openEditModal(site.id)}
                      className="absolute right-0 top-0"
                    >
                      Edit
                    </Button>
                  </div>
                </article>
              );
            })}

            {sortedSites.length === 0 ? (
              <div className="border border-dashed border-border bg-background px-4 py-8 text-xs text-muted-foreground">
                No sites configured.
              </div>
            ) : null}
          </section>
        )}
      </SiteReachabilityClient>

      <SiteEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        site={selectedSite}
      />
    </NoticeProvider>
  );
}
