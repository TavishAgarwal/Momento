import { useAuth } from '../context/AuthContext';

export default function TopBar() {
  const { user } = useAuth();

  // Get initials for the avatar
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'SK';

  return (
    <div className="flex items-center justify-between py-6 px-2">
      {/* Logo */}
      <div className="flex items-center gap-1">
        <span className="font-medium tracking-wide text-xl text-gray-900">MOMENTO</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-700 -mt-2">
          <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2ZM6.5 4.5L7.4 7.6L10.5 8.5L7.4 9.4L6.5 12.5L5.6 9.4L2.5 8.5L5.6 7.6L6.5 4.5Z" />
        </svg>
      </div>

      {/* User Pill */}
      <div className="flex items-center gap-2 pl-3 pr-1 py-1 bg-white/40 backdrop-blur-md rounded-full border border-white/50 shadow-sm">
        <span className="text-sm font-semibold text-gray-800 tracking-wide">{initials}</span>
        <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-300">
          <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=e5e7eb" alt="User avatar" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
