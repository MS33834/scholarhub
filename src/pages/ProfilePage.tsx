import { useAuth } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/i18n/useLang';
import { User, LogOut, Settings, Shield } from 'lucide-react';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-moss/10 rounded-full flex items-center justify-center">
            <User size={32} className="text-moss" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-ink">{user.username}</h1>
            <p className="text-ink-soft">{user.email}</p>
          </div>
        </div>

        <div className="border-t border-rule pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-moss" />
            <span className="text-ink">
              {user.is_admin ? t('profile.admin') : t('profile.user')}
            </span>
          </div>

          {user.is_admin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full bg-ochre text-white py-2 rounded-lg hover:bg-ochre/90 transition-colors flex items-center justify-center gap-2"
            >
              <Settings size={20} />
              <span>{t('profile.adminPanel')}</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            <span>{t('profile.logout')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
