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
    <div className="page-fade min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <p className="text-mono text-[12px] uppercase tracking-wider2 text-moss mb-3">
            {t('home.hero.eyebrow')}
          </p>
          <h1 className="font-display text-4xl text-ink mb-2">{t('auth.register.title')}</h1>
          <p className="text-ink-soft">{t('auth.register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="border border-rule rounded-[2px] bg-paper p-8">
          {error && (
            <div className="mb-5 p-3 border border-ochre text-ochre rounded-[2px]">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-mute mb-2">
                {t('auth.register.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-mute mb-2">
                {t('auth.register.username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-mute mb-2">
                {t('auth.register.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                  required
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 bg-moss text-paper py-2.5 rounded-[2px] hover:bg-ink-soft transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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

          <div className="mt-5 text-center text-sm text-ink-soft">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="text-moss hover:text-ink underline decoration-1 underline-offset-4 transition-colors">
              {t('auth.register.login')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
