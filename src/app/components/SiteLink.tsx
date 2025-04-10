interface SiteLinkProps {
  href: string;
  label: string;
}

export default function SiteLink({ href, label }: SiteLinkProps) {
  return (
    <a
      href={href}
      className="px-6 py-3 text-lg rounded-lg transition-all hover:bg-foreground hover:text-background border border-foreground/10 hover:border-transparent"
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
    </a>
  );
}
