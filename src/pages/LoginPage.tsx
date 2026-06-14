import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useT } from '@/i18n/LangProvider';
import { LogIn, Lock, User } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuth((s) => s.login);
  const navigate = useNavigate();
  const { t } = useT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-ink mb-2">{t('auth.login.title')}</h1>
          <p className="text-ink-soft">{t('auth.login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {t('auth.login.username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {t('auth.login.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-moss text-white py-2 rounded-lg hover:bg-moss/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>{t('auth.login.loading')}</span>
            ) : (
              <>
                <LogIn size={20} />
                <span>{t('auth.login.submit')}</span>
              </>
            )}
          </button>

          <div className="mt-4 text-center text-sm text-ink-soft">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="text-moss hover:underline">
              {t('auth.login.register')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
