import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import TopBar from './TopBar';

export default function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--momento-bg)]">
      <main className="flex-1 p-4 pb-20 max-w-md mx-auto w-full">
        <TopBar />
        <Outlet />
      </main>
      <NavBar />
    </div>
  );
}
