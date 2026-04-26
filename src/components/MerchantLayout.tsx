import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

export default function MerchantLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--momento-bg)]">
      <div className="bg-[var(--momento-surface)] border-b border-[var(--momento-border)] px-4 py-2">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-xs text-[var(--momento-text-muted)]">PAYONE × Sparkassen</span>
          <span className="text-xs font-medium text-[var(--momento-accent)]">MOMENTO Merchant</span>
        </div>
      </div>
      <main className="flex-1 p-4 pb-20 max-w-lg mx-auto w-full">
        <Outlet />
      </main>
      <NavBar />
    </div>
  );
}
