import { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useT } from '@/i18n/useLang';
import { api } from '../services/api';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import type { Resource } from '../types';

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Resource>>({
    id: '',
    title: '',
    type: 'paper',
    year: new Date().getFullYear(),
    discipline: 'computer-science',
    authors: [''],
    tags: [''],
    abstract: '',
    preview: '',
  });

  const loadResources = async () => {
    try {
      const result = await api.getResources({ limit: 100 });
      setResources(result.resources || []);
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    // Data-fetching effect: setState calls inside loadResources are async (post-await)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadResources();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateResource(editingId, formData);
      } else {
        await api.createResource(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ id: '', title: '', type: 'paper', year: new Date().getFullYear(), discipline: 'computer-science' });
      loadResources();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleEdit = (resource: Resource) => {
    setFormData(resource);
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

  if (!user?.is_admin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-ink">{t('admin.title')}</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ id: '', title: '', type: 'paper', year: new Date().getFullYear(), discipline: 'computer-science' });
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <div>
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
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-ink mb-2">{t('admin.discipline')}</label>
                <input
                  type="text"
                  value={formData.discipline}
                  onChange={(e) => setFormData({ ...formData, discipline: e.target.value as Resource['discipline'] })}
                  className="w-full px-3 py-2 border border-rule rounded-lg focus:outline-none focus:ring-2 focus:ring-moss"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
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
