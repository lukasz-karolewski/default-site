import SiteCrud from './components/SiteCrud';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Available Sites</h1>
      <SiteCrud />
    </div>
  );
}
