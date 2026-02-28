import FooterStatus from "./FooterStatus";
import SiteGridClient from "./SiteGridClient";

export interface SiteRecord {
  id: string;
  host: string;
  upstream: string;
}

interface SiteGridPageProps {
  sites: SiteRecord[];
  baseDomain: string;
}

export default function SiteGridPage({ sites, baseDomain }: SiteGridPageProps) {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <SiteGridClient sites={sites} baseDomain={baseDomain} />
        <FooterStatus />
      </div>
    </main>
  );
}
