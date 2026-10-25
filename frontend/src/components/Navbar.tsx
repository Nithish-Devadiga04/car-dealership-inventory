import { useAuth } from '../context/AuthContext';
import { LogoutIcon } from './Icons';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-violet-500 text-lg shadow-lg shadow-brand-500/30">🚗</span>
          <span className="text-lg font-extrabold tracking-tight text-white">
            Auto<span className="text-brand-300">Vault</span>
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                user.role === 'admin' ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40' : 'bg-white/10 text-slate-300'
              }`}
            >
              {user.role}
            </span>
            <button type="button" onClick={logout} className="btn !px-3 !py-2 bg-white/10 text-white hover:bg-white/20" aria-label="Log out">
              <LogoutIcon />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
