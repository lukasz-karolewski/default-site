"use client";

import { useState } from "react";

interface CopyCommandProps {
  command: string;
}

export default function CopyCommand({ command }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center border border-border bg-background px-2 py-0.5 font-mono text-[11px] text-foreground transition-colors hover:bg-muted"
      title="Copy command"
      aria-label={`Copy command: ${command}`}
    >
      {command}
      <span className="ml-2 text-[10px] text-muted-foreground">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
