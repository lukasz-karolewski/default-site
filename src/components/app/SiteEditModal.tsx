"use client";

import { CheckIcon, GlobeIcon, Loader2Icon, XIcon } from "lucide-react";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { Label } from "~/components/ui/label";
import {
  deleteSiteAction,
  type SiteActionState,
  saveSiteAction,
} from "~/lib/actions/siteActions";
import type { SiteRecord } from "~/lib/data/schema";
import { generateAvatarSvg } from "~/lib/ui/avatarGradient";
import { useNotice } from "~/lib/ui/noticeContext";

interface SiteEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  site?: SiteRecord;
}

export default function SiteEditModal({
  open,
  onOpenChange,
  mode,
  site,
}: SiteEditModalProps) {
  const { notify } = useNotice();
  const initialState: SiteActionState = { ok: false, message: null };
  const formKey = `${mode}:${site?.id ?? "new"}`;
  const [saveState, saveFormAction, savePending] = useActionState(
    saveSiteAction,
    initialState,
  );
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteSiteAction,
    initialState,
  );

  const [detectedFavicons, setDetectedFavicons] = useState<string[]>([]);
  const [selectedFavicon, setSelectedFavicon] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const subdomainRef = useRef<HTMLInputElement>(null);
  const upstreamRef = useRef<HTMLInputElement>(null);

  const title = mode === "add" ? "Add site" : "Edit site";
  const description =
    mode === "add"
      ? "Create a new subdomain route."
      : "Update subdomain and redirect target.";

  // Reset favicon state when site prop changes (e.g. opening a different site)
  useEffect(() => {
    setSelectedFavicon(site?.favicon ?? null);
    setDetectedFavicons(site?.favicon ? [site.favicon] : []);
    setDetectError(null);
    setDetecting(false);
  }, [site?.favicon]);

  useEffect(() => {
    if (!saveState.message) return;
    notify(saveState.message);
    if (saveState.ok) onOpenChange(false);
  }, [notify, onOpenChange, saveState]);

  useEffect(() => {
    if (!deleteState.message) return;
    notify(deleteState.message);
    if (deleteState.ok) onOpenChange(false);
  }, [deleteState, notify, onOpenChange]);

  const handleDetectFavicon = useCallback(async () => {
    const subdomain = subdomainRef.current?.value?.trim() ?? "";
    if (!subdomain) {
      setDetectError("Enter a subdomain first.");
      return;
    }

    setDetecting(true);
    setDetectError(null);

    try {
      const query = new URLSearchParams({ subdomain });
      const res = await fetch(`/api/sites/detect-favicon?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setDetectedFavicons([]);
        setSelectedFavicon(null);
        setDetectError(data.error ?? "Failed to detect favicon.");
        return;
      }

      if (Array.isArray(data.favicons) && data.favicons.length > 0) {
        setDetectedFavicons(data.favicons);
        setSelectedFavicon(data.favicons[0] ?? null);
        setDetectError(null);
      } else {
        setDetectedFavicons([]);
        setSelectedFavicon(null);
        setDetectError("No favicon found at this address.");
      }
    } catch {
      setDetectError("Failed to connect.");
      setDetectedFavicons([]);
      setSelectedFavicon(null);
    } finally {
      setDetecting(false);
    }
  }, []);

  // Preview src: detected favicon, existing site favicon, or generated avatar
  const subdomainForAvatar =
    subdomainRef.current?.value || site?.subdomain || "?";
  const previewSrc = selectedFavicon || generateAvatarSvg(subdomainForAvatar);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[88vh] sm:max-w-md overflow-x-hidden overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          key={formKey}
          id="site-save-form"
          action={saveFormAction}
          className="grid gap-3"
        >
          <input type="hidden" name="id" value={site?.id ?? ""} />
          <input type="hidden" name="favicon" value={selectedFavicon ?? ""} />

          <div className="grid gap-1.5">
            <Label htmlFor="subdomain">Subdomain</Label>
            <Input
              ref={subdomainRef}
              id="subdomain"
              name="subdomain"
              placeholder="app"
              defaultValue={site?.subdomain ?? ""}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="upstream">Redirect address</Label>
            <InputGroup>
              <InputGroupInput
                ref={upstreamRef}
                id="upstream"
                name="upstream"
                placeholder="localhost:3000"
                defaultValue={site?.upstream ?? ""}
                required
              />
              <InputGroupAddon align="inline-end" className="pr-0">
                <InputGroupButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDetectFavicon}
                  disabled={detecting}
                  className="h-8 rounded-none border-0 border-l border-input px-2.5"
                  title="Detect favicon"
                >
                  {detecting ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <GlobeIcon className="size-3.5" />
                  )}
                  Test
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="grid gap-1.5">
            <Label>Favicon</Label>
            {detectedFavicons.length > 0 ? (
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {detectedFavicons.map((favicon) => {
                    const isSelected = selectedFavicon === favicon;
                    return (
                      <button
                        key={favicon}
                        type="button"
                        onClick={() => setSelectedFavicon(favicon)}
                        title={favicon}
                        className={`relative flex size-10 items-center justify-center rounded border bg-white p-1 transition-colors ${
                          isSelected
                            ? "border-foreground ring-1 ring-foreground"
                            : "border-input hover:border-foreground/40"
                        }`}
                      >
                        <img
                          src={favicon}
                          alt=""
                          className="size-6 object-contain"
                        />
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-foreground text-background">
                            <CheckIcon className="size-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">
                    {selectedFavicon
                      ? selectedFavicon.split("/").pop()
                      : "Select a favicon"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDetectedFavicons([]);
                      setSelectedFavicon(null);
                    }}
                    aria-label="Clear favicon"
                    className="h-auto shrink-0 px-1.5 py-0.5 text-xs"
                  >
                    <XIcon className="size-3" />
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <img
                  src={previewSrc}
                  alt=""
                  aria-hidden="true"
                  className="size-8 rounded object-contain"
                />
                <span className="text-xs text-muted-foreground">
                  {detectError ?? "Auto-generated avatar. Hit Test to detect."}
                </span>
              </div>
            )}
          </div>
        </form>

        {mode === "edit" && site ? (
          <form id="site-delete-form" action={deleteFormAction}>
            <input type="hidden" name="id" value={site.id} />
          </form>
        ) : null}

        <DialogFooter className="mt-2 flex flex-row items-center justify-end gap-2">
          {mode === "edit" && site ? (
            <Button
              variant="destructive"
              type="submit"
              form="site-delete-form"
              disabled={deletePending || savePending}
              className="mr-auto"
            >
              {deletePending ? "Deleting..." : "Delete"}
            </Button>
          ) : null}

          <Button
            type="submit"
            form="site-save-form"
            disabled={savePending || deletePending}
          >
            {savePending ? "Saving..." : mode === "add" ? "Add" : "Save"}
          </Button>
          <DialogClose render={<Button variant="outline" type="button" />}>
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
