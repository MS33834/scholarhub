import { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/i18n/useLang';
import { api } from '@/lib/api';
import { useUI } from '@/store/ui';
import { Plus, Edit, Trash2, Save, X, Trash, ChevronDown, UserCog, Shield, ShieldOff, UserX } from 'lucide-react';
import type { Resource, Citation } from '../types';
import type { ResourceSubmission, User } from '@/lib/api';

const EMPTY_CITATION: Citation = {
  apa: '',
  mla: '',
  gbt: '',
  bibtex: '',
};

const EMPTY_FORM: Partial<Resource> = {
  id: '',
  title: '',
  type: 'paper',
  year: new Date().getFullYear(),
  discipline: 'computer-science',
  subdiscipline: '',
  authors: [''],
  tags: [''],
  venue: '',
  abstract: '',
  preview: '',
  doi: '',
  downloadUrl: '',
  externalUrl: '',
  citation: EMPTY_CITATION,
  citations: 0,
};

function getInitialForm(resource?: Resource | null): Partial<Resource> {
  if (!resource) return EMPTY_FORM;
  return {
    ...resource,
    citation: resource.citation ?? EMPTY_CITATION,
    citations: resource.citations ?? 0,
  };
}

type AdminTab = 'resources' | 'submissions' | 'users';

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();
  const { showToast } = useUI();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Resource>>(EMPTY_FORM);

  const [submissions, setSubmissions] = useState<ResourceSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsOpen, setSubmissionsOpen] = useState(true);

  const [activeTab, setActiveTab] = useState<AdminTab>('resources');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadResources = async () => {
    try {
      const result = await api.listResources({ limit: 100 });
      setResources(result.data || []);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const result = await api.listPendingSubmissions();
      setSubmissions(result.data || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const result = await api.listUsers();
      setUsers(result || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }
    loadResources();
    loadSubmissions();
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleaned: Partial<Resource> = {
      ...formData,
      authors: (formData.authors ?? []).map((a) => a.trim()).filter(Boolean),
      tags: (formData.tags ?? []).map((t) => t.trim()).filter(Boolean),
      citation: {
        apa: (formData.citation?.apa ?? '').trim(),
        mla: (formData.citation?.mla ?? '').trim(),
        gbt: (formData.citation?.gbt ?? '').trim(),
        bibtex: (formData.citation?.bibtex ?? '').trim(),
      },
    };

    try {
      if (editingId) {
        await api.updateResource(editingId, cleaned);
      } else {
        await api.createResource(cleaned);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
      loadResources();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleEdit = (resource: Resource) => {
    setFormData(getInitialForm(resource));
    setEditingId(resource.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    try {
      await api.deleteResource(id);
      loadResources();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.reviewSubmission(id, { status: 'approved' });
      loadSubmissions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Approval failed');
    }
  };

  const handleReject = async (id: string) => {
    const note = prompt(t('admin.submissions.rejectNote'));
    if (note === null) return;
    try {
      await api.reviewSubmission(id, { status: 'rejected', adminNote: note });
      loadSubmissions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rejection failed');
    }
  };

  const handleToggleActive = async (targetUser: User) => {
    try {
      await api.updateUser(targetUser.id, { isActive: !targetUser.isActive });
      await loadUsers();
      showToast(t('toast.user.updated'));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleToggleAdmin = async (targetUser: User) => {
    try {
      await api.updateUser(targetUser.id, { isAdmin: !targetUser.isAdmin });
      await loadUsers();
      showToast(t('toast.user.updated'));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (targetUser.id === user?.id) {
      alert(t('admin.users.cannotDeleteSelf'));
      return;
    }
    if (!confirm(t('admin.users.deleteConfirm'))) return;
    try {
      await api.deleteUser(targetUser.id);
      await loadUsers();
      showToast(t('toast.user.deleted'));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (!user?.isAdmin) return null;

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'resources', label: t('admin.resources.title') },
    { key: 'submissions', label: t('admin.submissions.title') },
    { key: 'users', label: t('admin.users.title') },
  ];

  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
      <header className="border-b border-rule pb-8 flex items-baseline justify-between gap-6 flex-wrap mb-6">
        <div>
          <p className="text-mono text-[12px] uppercase tracking-wider2 text-moss mb-3">
            {t('home.hero.eyebrow')}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl text-ink tracking-tight">{t('admin.title')}</h1>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData(EMPTY_FORM);
            setActiveTab('resources');
          }}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 border border-moss rounded-[2px] text-paper bg-moss hover:bg-paper hover:text-moss transition-colors"
        >
          <Plus size={20} />
          <span>{t('admin.addResource')}</span>
        </button>
      </header>

      <nav className="border-b border-rule mb-10" aria-label="Admin sections">
        <div className="flex gap-2 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-moss text-moss'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === 'submissions' && (
        <section className="border border-rule rounded-[2px] overflow-hidden mb-10">
          <button
            type="button"
            onClick={() => setSubmissionsOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-paper/50 transition-colors"
            aria-expanded={submissionsOpen}
            aria-controls="submissions-panel"
          >
            <h2 className="font-display text-xl text-ink">{t('admin.submissions.title')}</h2>
            <ChevronDown
              size={20}
              className={`text-ink-mute transition-transform ${submissionsOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {submissionsOpen && (
            <div id="submissions-panel" className="border-t border-rule">
              {submissionsLoading ? (
                <div className="p-8 text-center text-ink-soft">{t('admin.loading')}</div>
              ) : submissions.length === 0 ? (
                <div className="p-8 text-center text-ink-soft">{t('admin.submissions.empty')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead className="border-b border-rule">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('submit.form.title')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('admin.authors')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('profile.user')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('submit.form.year')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('admin.submissions.pending')}</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-ink">{t('admin.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule">
                      {submissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-paper/50">
                          <td className="px-4 py-3 text-sm text-ink">{submission.title}</td>
                          <td className="px-4 py-3 text-sm text-ink-mute">{submission.authors.join(', ')}</td>
                          <td className="px-4 py-3 text-sm text-ink-mute">{submission.submittedBy.username}</td>
                          <td className="px-4 py-3 text-sm text-ink-mute">{submission.year}</td>
                          <td className="px-4 py-3 text-sm text-ink-mute">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleApprove(submission.id)}
                              className="text-sm px-3 py-1.5 mr-2 border border-moss rounded-[2px] text-paper bg-moss hover:bg-paper hover:text-moss transition-colors"
                            >
                              {t('admin.submissions.approve')}
                            </button>
                            <button
                              onClick={() => handleReject(submission.id)}
                              className="text-sm px-3 py-1.5 border border-ochre rounded-[2px] text-ochre hover:bg-ochre hover:text-paper transition-colors"
                            >
                              {t('admin.submissions.reject')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {activeTab === 'users' && (
        <section className="border border-rule rounded-[2px] overflow-hidden mb-10">
          {usersLoading ? (
            <div className="p-8 text-center text-ink-soft">{t('admin.users.loading')}</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-ink-soft">{t('admin.users.empty')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-rule">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('admin.users.username')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('admin.users.email')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('admin.users.active')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('admin.users.admin')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('admin.users.registeredAt')}</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-ink">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-paper/50">
                      <td className="px-4 py-3 text-sm text-ink">{u.username}</td>
                      <td className="px-4 py-3 text-sm text-ink-mute">{u.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={u.isActive ? 'text-moss' : 'text-ochre'}>
                          {u.isActive ? t('admin.users.active') : t('admin.users.inactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-mute">
                        {u.isAdmin ? t('common.yes') : t('common.no')}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-mute">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleToggleActive(u)}
                          aria-label={t('admin.users.toggleActive')}
                          title={t('admin.users.toggleActive')}
                          className="text-moss hover:text-ink transition-colors mr-3"
                        >
                          <UserCog size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleAdmin(u)}
                          aria-label={t('admin.users.toggleAdmin')}
                          title={t('admin.users.toggleAdmin')}
                          className="text-moss hover:text-ink transition-colors mr-3"
                        >
                          {u.isAdmin ? <ShieldOff size={18} /> : <Shield size={18} />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === user?.id}
                          aria-label={t('admin.users.delete')}
                          title={u.id === user?.id ? t('admin.users.cannotDeleteSelf') : t('admin.users.delete')}
                          className={`transition-colors ${
                            u.id === user?.id
                              ? 'text-ink-soft cursor-not-allowed'
                              : 'text-ink-mute hover:text-ochre'
                          }`}
                        >
                          <UserX size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'resources' && showForm && (
        <div className="border border-rule rounded-[2px] p-6 mb-10">
          <h2 className="font-display text-2xl text-ink mb-5">
            {editingId ? t('admin.editResource') : t('admin.newResource')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">ID</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                  required
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.type')}</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Resource['type'] })}
                  className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                >
                  <option value="paper">Paper</option>
                  <option value="book">Book</option>
                  <option value="dataset">Dataset</option>
                  <option value="tutorial">Tutorial</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.title')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.year')}</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.venue')}</label>
                <input
                  type="text"
                  value={formData.venue ?? ''}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.discipline')}</label>
                <input
                  type="text"
                  value={formData.discipline}
                  onChange={(e) => setFormData({ ...formData, discipline: e.target.value as Resource['discipline'] })}
                  className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.subdiscipline')}</label>
                <input
                  type="text"
                  value={formData.subdiscipline ?? ''}
                  onChange={(e) => setFormData({ ...formData, subdiscipline: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.authors')}</label>
              <div className="space-y-2">
                {(formData.authors ?? ['']).map((author, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => {
                        const next = [...(formData.authors ?? [''])];
                        next[idx] = e.target.value;
                        setFormData({ ...formData, authors: next });
                      }}
                      placeholder={t('admin.author')}
                      className="flex-1 px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = (formData.authors ?? ['']).filter((_, i) => i !== idx);
                        setFormData({ ...formData, authors: next.length ? next : [''] });
                      }}
                      className="px-3 py-2 text-ink-mute hover:text-ochre transition-colors"
                      title={t('admin.remove')}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, authors: [...(formData.authors ?? ['']), ''] })}
                  className="text-sm text-moss hover:text-ink underline decoration-1 underline-offset-4 transition-colors"
                >
                  + {t('admin.addAuthor')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.tags')}</label>
              <div className="space-y-2">
                {(formData.tags ?? ['']).map((tag, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => {
                        const next = [...(formData.tags ?? [''])];
                        next[idx] = e.target.value;
                        setFormData({ ...formData, tags: next });
                      }}
                      placeholder={t('admin.tag')}
                      className="flex-1 px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = (formData.tags ?? ['']).filter((_, i) => i !== idx);
                        setFormData({ ...formData, tags: next });
                      }}
                      className="px-3 py-2 text-ink-mute hover:text-ochre transition-colors"
                      title={t('admin.remove')}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tags: [...(formData.tags ?? []), ''] })}
                  className="text-sm text-moss hover:text-ink underline decoration-1 underline-offset-4 transition-colors"
                >
                  + {t('admin.addTag')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.doi')}</label>
                <input
                  type="text"
                  value={formData.doi ?? ''}
                  onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.downloadUrl')}</label>
                <input
                  type="url"
                  value={formData.downloadUrl ?? ''}
                  onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.externalUrl')}</label>
                <input
                  type="url"
                  value={formData.externalUrl ?? ''}
                  onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.citation')}</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['apa', 'mla', 'gbt', 'bibtex'] as const).map((fmt) => (
                  <div key={fmt} className="md:col-span-2">
                    <label className="block text-xs font-medium text-ink-mute mb-1 uppercase">{t(`admin.citation.${fmt}`)}</label>
                    <textarea
                      value={formData.citation?.[fmt] ?? ''}
                      onChange={(e) => {
                        const next: Citation = { ...(formData.citation ?? EMPTY_CITATION), [fmt]: e.target.value };
                        setFormData({ ...formData, citation: next });
                      }}
                      rows={fmt === 'bibtex' ? 4 : 2}
                      className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss font-mono text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.abstract')}</label>
                <textarea
                  value={formData.abstract}
                  onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.preview')}</label>
                <textarea
                  value={formData.preview}
                  onChange={(e) => setFormData({ ...formData, preview: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-mute mb-2">{t('admin.citations')}</label>
              <input
                type="number"
                min={0}
                value={formData.citations ?? 0}
                onChange={(e) => setFormData({ ...formData, citations: parseInt(e.target.value, 10) || 0 })}
                className="w-full md:w-1/3 px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 border border-moss rounded-[2px] text-paper bg-moss hover:bg-paper hover:text-moss transition-colors flex items-center gap-2"
              >
                <Save size={20} />
                <span>{t('admin.save')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-rule rounded-[2px] text-sm font-medium text-ink-soft hover:text-ink hover:border-ink transition-colors flex items-center gap-2"
              >
                <X size={20} />
                <span>{t('admin.cancel')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="border border-rule rounded-[2px] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-ink-soft">{t('admin.loading')}</div>
          ) : resources.length === 0 ? (
            <div className="p-8 text-center text-ink-soft">{t('admin.noResources')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-rule">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('admin.title')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('admin.type')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('admin.year')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-ink">{t('admin.discipline')}</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-ink">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {resources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-paper/50">
                      <td className="px-4 py-3 text-sm text-ink-mute">{resource.id}</td>
                      <td className="px-4 py-3 text-sm text-ink">{resource.title}</td>
                      <td className="px-4 py-3 text-sm text-ink-mute">{resource.type}</td>
                      <td className="px-4 py-3 text-sm text-ink-mute">{resource.year}</td>
                      <td className="px-4 py-3 text-sm text-ink-mute">{resource.discipline}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(resource)}
                          aria-label={t('admin.editResource')}
                          className="text-moss hover:text-ink transition-colors mr-3"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          aria-label={t('admin.deleteResource')}
                          className="text-ink-mute hover:text-ochre transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
