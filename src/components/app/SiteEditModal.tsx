"use client";

import { useActionState, useEffect } from "react";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  deleteSiteAction,
  type SiteActionState,
  saveSiteAction,
} from "~/lib/actions/siteActions";
import { useNotice } from "~/lib/ui/noticeContext";

interface SiteRecord {
  id: string;
  subdomain: string;
  upstream: string;
}

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

  const title = mode === "add" ? "Add site" : "Edit site";
  const description =
    mode === "add"
      ? "Create a new subdomain route."
      : "Update subdomain and redirect target.";

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
            <Input
              id="upstream"
              name="upstream"
              placeholder="localhost:3000"
              defaultValue={site?.upstream ?? ""}
              required
            />
          </div>
        </form>

        {mode === "edit" && site ? (
          <form id="site-delete-form" action={deleteFormAction}>
            <input type="hidden" name="id" value={site.id} />
          </form>
        ) : null}

        <AlertDialogFooter className="mt-2 flex-row justify-between gap-2">
          {mode === "edit" && site ? (
            <AlertDialogAction
              variant="destructive"
              type="submit"
              form="site-delete-form"
              className="h-8 px-3"
              disabled={deletePending || savePending}
            >
              {deletePending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <AlertDialogCancel type="button" className="h-8 px-3">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              form="site-save-form"
              className="h-8 px-3"
              disabled={savePending || deletePending}
            >
              {savePending ? "Saving..." : mode === "add" ? "Add" : "Save"}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
