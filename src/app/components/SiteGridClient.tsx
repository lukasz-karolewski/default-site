"use client";

import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { buildSiteUrl } from "../utils/siteLink";
import SiteEditModal from "./SiteEditModal";
import { PencilIcon, CheckIcon, PlusIcon } from "lucide-react";
import { NoticeProvider, NoticeViewport } from "~/lib/noticeContext";

interface SiteRecord {
  id: string;
  host: string;
  upstream: string;
}

interface SiteGridClientProps {
  sites: SiteRecord[];
  baseDomain: string;
}

export default function SiteGridClient({ sites, baseDomain }: SiteGridClientProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const selectedSite = useMemo(
    () => sites.find(site => site.id === selectedSiteId),
    [sites, selectedSiteId],
  );
  const sortedSites = useMemo(
    () =>
      [...sites].sort((a, b) =>
        a.host.localeCompare(b.host, undefined, { sensitivity: "base" }),
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
        <h1 className="text-sm font-medium uppercase tracking-[0.18em] text-foreground/90">Sites</h1>
        <Button
          type="button"
          variant={isEditMode ? "secondary" : "outline"}
          size="icon-sm"
          onClick={() => setIsEditMode(value => !value)}
          aria-label={isEditMode ? "Finish editing" : "Edit sites"}
          title={isEditMode ? "Done" : "Edit"}
        >
          {isEditMode ? <CheckIcon /> : <PencilIcon />}
        </Button>
      </section>

      <NoticeViewport />

      <section className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
        {isEditMode ? (
          <button
            type="button"
            onClick={openAddModal}
            className="group relative flex aspect-square w-full flex-col items-center justify-center border border-dashed border-border bg-background px-2 py-3 text-foreground transition-colors hover:bg-muted/25 sm:px-4 sm:py-5"
          >
            <PlusIcon className="size-4" />
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em]">Add site</p>
          </button>
        ) : null}

        {sortedSites.map(site => {
          const siteUrl = buildSiteUrl(site.host, baseDomain);
          const tileClasses =
            "group relative aspect-square overflow-hidden border border-border bg-background px-2 py-3 transition-colors hover:bg-muted/25 sm:px-4 sm:py-5";

          if (!isEditMode) {
            return (
              <a
                key={site.id}
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={tileClasses}
                aria-label={`Open ${site.host}`}
              >
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-bold text-foreground transition-transform duration-200 group-hover:-translate-y-1.5 sm:text-xl">
                    {site.host}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 translate-y-1">
                    {site.upstream}
                  </p>
                </div>
              </a>
            );
          }

          return (
            <article key={site.id} className={tileClasses}>
              <div className="relative flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground sm:text-xl">{site.host}</p>
                  <p className="mt-1 text-xs text-muted-foreground opacity-80">{site.upstream}</p>
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

      <SiteEditModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        site={selectedSite}
      />
    </NoticeProvider>
  );
}
