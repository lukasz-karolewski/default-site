"use client";

import { GlobeIcon, Loader2Icon, XIcon } from "lucide-react";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
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

  const [detectedFavicon, setDetectedFavicon] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const upstreamRef = useRef<HTMLInputElement>(null);

  const title = mode === "add" ? "Add site" : "Edit site";
  const description =
    mode === "add"
      ? "Create a new subdomain route."
      : "Update subdomain and redirect target.";

  // Reset favicon state when site prop changes (e.g. opening a different site)
  useEffect(() => {
    setDetectedFavicon(site?.favicon ?? null);
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
    const upstream = upstreamRef.current?.value?.trim();
    if (!upstream) {
      setDetectError("Enter a redirect address first.");
      return;
    }

    setDetecting(true);
    setDetectError(null);

    try {
      const res = await fetch(
        `/api/sites/detect-favicon?upstream=${encodeURIComponent(upstream)}`,
      );
      const data = await res.json();

      if (data.favicon) {
        setDetectedFavicon(data.favicon);
        setDetectError(null);
      } else {
        setDetectedFavicon(null);
        setDetectError("No favicon found at this address.");
      }
    } catch {
      setDetectError("Failed to connect.");
      setDetectedFavicon(null);
    } finally {
      setDetecting(false);
    }
  }, []);

  // Preview src: detected favicon, existing site favicon, or generated avatar
  const subdomainForAvatar =
    site?.subdomain || upstreamRef.current?.value || "?";
  const previewSrc = detectedFavicon || generateAvatarSvg(subdomainForAvatar);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm" className="max-w-md">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <form
          key={formKey}
          id="site-save-form"
          action={saveFormAction}
          className="grid gap-3"
        >
          <input type="hidden" name="id" value={site?.id ?? ""} />
          <input type="hidden" name="favicon" value={detectedFavicon ?? ""} />

          <div className="grid gap-1.5">
            <Label htmlFor="subdomain">Subdomain</Label>
            <Input
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
            <div className="flex items-center gap-3">
              <img
                src={previewSrc}
                alt=""
                aria-hidden="true"
                className="h-8 w-8 rounded object-contain"
              />
              {detectedFavicon ? (
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="truncate text-xs text-muted-foreground">
                    {detectedFavicon}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setDetectedFavicon(null)}
                    aria-label="Clear favicon"
                  >
                    <XIcon className="size-3" />
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {detectError ?? "Auto-generated avatar. Hit Test to detect."}
                </span>
              )}
            </div>
          </div>
        </form>

        {mode === "edit" && site ? (
          <form id="site-delete-form" action={deleteFormAction}>
            <input type="hidden" name="id" value={site.id} />
          </form>
        ) : null}

        <AlertDialogFooter className="mt-2 !flex !flex-row items-center justify-end gap-2 group-data-[size=sm]/alert-dialog-content:!flex group-data-[size=sm]/alert-dialog-content:!grid-cols-none">
          {mode === "edit" && site ? (
            <AlertDialogAction
              variant="destructive"
              type="submit"
              form="site-delete-form"
              disabled={deletePending || savePending}
              className="mr-auto"
            >
              {deletePending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          ) : null}

          <AlertDialogAction
            type="submit"
            form="site-save-form"
            disabled={savePending || deletePending}
          >
            {savePending ? "Saving..." : mode === "add" ? "Add" : "Save"}
          </AlertDialogAction>
          <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
