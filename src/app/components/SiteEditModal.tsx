"use client";

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
import { deleteSiteAction, saveSiteAction } from "../actions/siteActions";

interface SiteRecord {
  id: string;
  host: string;
  upstream: string;
}

interface SiteEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  site?: SiteRecord;
}

export default function SiteEditModal({ open, onOpenChange, mode, site }: SiteEditModalProps) {
  const title = mode === "add" ? "Add site" : "Edit site";
  const description =
    mode === "add"
      ? "Create a new subdomain route."
      : "Update subdomain and redirect target.";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm" className="max-w-md">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <form id="site-save-form" action={saveSiteAction} className="grid gap-3">
          <input type="hidden" name="id" value={site?.id ?? ""} />

          <div className="grid gap-1.5">
            <Label htmlFor="host">Subdomain</Label>
            <Input
              id="host"
              name="host"
              placeholder="app"
              defaultValue={site?.host ?? ""}
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
          <form id="site-delete-form" action={deleteSiteAction}>
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
            >
              Delete
            </AlertDialogAction>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <AlertDialogCancel type="button" className="h-8 px-3">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction type="submit" form="site-save-form" className="h-8 px-3">
              {mode === "add" ? "Add" : "Save"}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
