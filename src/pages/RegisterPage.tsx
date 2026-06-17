import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useT } from '@/i18n/useLang';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuth((s) => s.register);
  const navigate = useNavigate();
  const { t } = useT();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-ink mb-2">{t('auth.register.title')}</h1>
          <p className="text-ink-soft">{t('auth.register.subtitle')}</p>
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
                {t('auth.register.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {t('auth.register.username')}
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
                {t('auth.register.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                  required
                  minLength={6}
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
              <span>{t('auth.register.loading')}</span>
            ) : (
              <>
                <UserPlus size={20} />
                <span>{t('auth.register.submit')}</span>
              </>
            )}
          </button>

          <div className="mt-4 text-center text-sm text-ink-soft">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="text-moss hover:underline">
              {t('auth.register.login')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
