import { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/i18n/useLang';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Save, X, Trash } from 'lucide-react';
import type { Resource, Citation } from '../types';

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

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Resource>>(EMPTY_FORM);

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

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }
    // Data-fetching effect: setState calls inside loadResources are async (post-await)
    loadResources();
  }, [user, navigate]);

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

  if (!user?.isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-ink">{t('admin.title')}</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData(EMPTY_FORM);
          }}
          className="bg-moss text-white px-4 py-2 rounded-lg hover:bg-moss/90 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          <span>{t('admin.addResource')}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-ink mb-4">
            {editingId ? t('admin.editResource') : t('admin.newResource')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">ID</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                  required
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">{t('admin.type')}</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Resource['type'] })}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                >
                  <option value="paper">Paper</option>
                  <option value="book">Book</option>
                  <option value="dataset">Dataset</option>
                  <option value="tutorial">Tutorial</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-2">{t('admin.title')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">{t('admin.year')}</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">{t('admin.venue')}</label>
                <input
                  type="text"
                  value={formData.venue ?? ''}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">{t('admin.discipline')}</label>
                <input
                  type="text"
                  value={formData.discipline}
                  onChange={(e) => setFormData({ ...formData, discipline: e.target.value as Resource['discipline'] })}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">{t('admin.subdiscipline')}</label>
                <input
                  type="text"
                  value={formData.subdiscipline ?? ''}
                  onChange={(e) => setFormData({ ...formData, subdiscipline: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                />
              </div>
            </div>

            {/* Authors */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">{t('admin.authors')}</label>
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
                      className="flex-1 px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = (formData.authors ?? ['']).filter((_, i) => i !== idx);
                        setFormData({ ...formData, authors: next.length ? next : [''] });
                      }}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('admin.remove')}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, authors: [...(formData.authors ?? ['']), ''] })}
                  className="text-sm text-moss hover:underline"
                >
                  + {t('admin.addAuthor')}
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">{t('admin.tags')}</label>
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
                      className="flex-1 px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = (formData.tags ?? ['']).filter((_, i) => i !== idx);
                        setFormData({ ...formData, tags: next });
                      }}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('admin.remove')}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tags: [...(formData.tags ?? []), ''] })}
                  className="text-sm text-moss hover:underline"
                >
                  + {t('admin.addTag')}
                </button>
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">{t('admin.doi')}</label>
                <input
                  type="text"
                  value={formData.doi ?? ''}
                  onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">{t('admin.downloadUrl')}</label>
                <input
                  type="url"
                  value={formData.downloadUrl ?? ''}
                  onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">{t('admin.externalUrl')}</label>
                <input
                  type="url"
                  value={formData.externalUrl ?? ''}
                  onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                />
              </div>
            </div>

            {/* Citations */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">{t('admin.citation')}</label>
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
                      className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss font-mono text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Abstract & Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">{t('admin.abstract')}</label>
                <textarea
                  value={formData.abstract}
                  onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">{t('admin.preview')}</label>
                <textarea
                  value={formData.preview}
                  onChange={(e) => setFormData({ ...formData, preview: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                  required
                />
              </div>
            </div>

            {/* Citation count */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">{t('admin.citations')}</label>
              <input
                type="number"
                min={0}
                value={formData.citations ?? 0}
                onChange={(e) => setFormData({ ...formData, citations: parseInt(e.target.value, 10) || 0 })}
                className="w-full md:w-1/3 px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="bg-moss text-white px-4 py-2 rounded-lg hover:bg-moss/90 transition-colors flex items-center gap-2"
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
                className="bg-gray-200 text-ink px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <X size={20} />
                <span>{t('admin.cancel')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-ink-soft">{t('admin.loading')}</div>
        ) : resources.length === 0 ? (
          <div className="p-8 text-center text-ink-soft">{t('admin.noResources')}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-paper">
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
                      className="text-moss hover:text-moss/80 mr-3"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
