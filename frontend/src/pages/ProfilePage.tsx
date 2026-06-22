import { useAuth } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/i18n/useLang';
import { User, LogOut, Settings, Shield } from 'lucide-react';
import { useEffect } from 'react';

export function ProfilePage() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [isLoading, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
      <header className="border-b border-rule pb-8 mb-10">
        <p className="text-mono text-[12px] uppercase tracking-wider2 text-moss mb-3">
          {t('home.hero.eyebrow')}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-ink tracking-tight">{user.username}</h1>
        <p className="mt-3 text-lg text-ink-soft">{user.email}</p>
      </header>

      <div className="border border-rule rounded-[2px] p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 border border-rule rounded-[2px] flex items-center justify-center text-moss">
            <User size={32} />
          </div>
          <div>
            <h2 className="font-display text-3xl text-ink">{user.username}</h2>
            <p className="text-ink-soft">{user.email}</p>
          </div>
        </div>

        <div className="border-t border-rule pt-6 space-y-4">
          <div className="flex items-center gap-3 text-ink-soft">
            <Shield size={20} className="text-moss" />
            <span>
              {user.isAdmin ? t('profile.admin') : t('profile.user')}
            </span>
          </div>

          {user.isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full border border-moss rounded-[2px] text-paper bg-moss py-2.5 hover:bg-paper hover:text-moss transition-colors flex items-center justify-center gap-2"
            >
              <Settings size={20} />
              <span>{t('profile.adminPanel')}</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full border border-ochre rounded-[2px] text-ochre py-2.5 hover:border-ink hover:text-ink transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            <span>{t('profile.logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
