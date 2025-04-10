import SiteLink from './SiteLink';

async function getHosts() {
  try {
    // In Next.js App Router server components, we can directly use the API 
    // route handler function - this is the most reliable approach
    const { GET } = await import('../api/hosts/route');
    const response = await GET();
    const data = await response.json();
    return data.hosts || [];
  } catch (error) {
    console.error('Error fetching hosts:', error);
    return [];
  }
}

export default async function SiteList() {
  const sites = await getHosts();

  if (sites.length === 0) {
    return <div className="text-center">No sites found</div>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {sites.map((site: string) => (
        <SiteLink key={site} href={`https://${site}`} label={site} />
      ))}
    </div>
  );
}