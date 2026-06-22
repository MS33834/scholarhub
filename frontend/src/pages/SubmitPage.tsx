import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { useT } from '@/i18n/useLang'
import { useAuth } from '@/store/authStore'
import { useDisciplines } from '@/hooks/useResources'
import { api } from '@/lib/api'
import type { ResourceSubmissionCreate } from '@/lib/api'

const EMPTY_FORM: ResourceSubmissionCreate = {
  title: '',
  type: 'paper',
  year: new Date().getFullYear(),
  authors: [],
  tags: [],
  venue: '',
  discipline: '',
  subdiscipline: '',
  abstract: '',
  doi: '',
  downloadUrl: '',
  externalUrl: '',
}

function splitField(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

export function SubmitPage() {
  const { t, lang } = useT()
  const { isAuthenticated } = useAuth()
  const disciplines = useDisciplines()
  const [form, setForm] = useState<ResourceSubmissionCreate>(EMPTY_FORM)
  const [authorsInput, setAuthorsInput] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const updateField = <K extends keyof ResourceSubmissionCreate>(key: K, value: ResourceSubmissionCreate[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')

    if (!form.discipline) {
      setError(t('submit.disciplineRequired'))
      setLoading(false)
      return
    }

    const payload: ResourceSubmissionCreate = {
      ...form,
      authors: splitField(authorsInput),
      tags: splitField(tagsInput),
    }

    try {
      await api.createSubmission(payload)
      setSuccess(true)
      setForm(EMPTY_FORM)
      setAuthorsInput('')
      setTagsInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
        <div className="border border-rule rounded-[2px] p-8 text-center">
          <AlertCircle size={32} className="mx-auto mb-4 text-ochre" />
          <h1 className="font-display text-2xl text-ink mb-3">{t('submit.title')}</h1>
          <p className="text-ink-soft mb-6">{t('submit.loginRequired')}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 border border-moss rounded-[2px] text-paper bg-moss hover:bg-paper hover:text-moss transition-colors"
          >
            {t('auth.login.submit')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-fade mx-auto max-w-column px-6 sm:px-8 pt-16 pb-32">
      <header className="border-b border-rule pb-8 mb-10">
        <p className="text-mono text-[12px] uppercase tracking-wider2 text-moss mb-3">
          {t('home.hero.eyebrow')}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-ink tracking-tight mb-3">{t('submit.title')}</h1>
        <p className="text-ink-soft">{t('submit.subtitle')}</p>
      </header>

      {success && (
        <div className="mb-6 p-4 border border-moss/30 rounded-[2px] bg-moss/5 flex items-start gap-3">
          <CheckCircle size={20} className="text-moss mt-0.5 shrink-0" />
          <p className="text-sm text-ink-soft">{t('submit.success')}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 border border-ochre/30 rounded-[2px] bg-ochre/5 flex items-start gap-3">
          <AlertCircle size={20} className="text-ochre mt-0.5 shrink-0" />
          <p className="text-sm text-ink-soft">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="border border-rule rounded-[2px] p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="submit-title" className="block text-sm font-medium text-ink-mute mb-2">
              {t('submit.form.title')}
            </label>
            <input
              id="submit-title"
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
              required
            />
          </div>

          <div>
            <label htmlFor="submit-type" className="block text-sm font-medium text-ink-mute mb-2">
              {t('submit.form.type')}
            </label>
            <select
              id="submit-type"
              value={form.type}
              onChange={(e) => updateField('type', e.target.value as ResourceSubmissionCreate['type'])}
              className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
            >
              <option value="paper">{t('type.paper')}</option>
              <option value="book">{t('type.book')}</option>
              <option value="dataset">{t('type.dataset')}</option>
              <option value="tutorial">{t('type.tutorial')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="submit-year" className="block text-sm font-medium text-ink-mute mb-2">
              {t('submit.form.year')}
            </label>
            <input
              id="submit-year"
              type="number"
              value={form.year}
              onChange={(e) => updateField('year', parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
              required
            />
          </div>

          <div>
            <label htmlFor="submit-authors" className="block text-sm font-medium text-ink-mute mb-2">
              {t('submit.form.authors')}
            </label>
            <input
              id="submit-authors"
              type="text"
              value={authorsInput}
              onChange={(e) => setAuthorsInput(e.target.value)}
              placeholder="Author One, Author Two"
              className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
              required
            />
          </div>

          <div>
            <label htmlFor="submit-tags" className="block text-sm font-medium text-ink-mute mb-2">
              {t('submit.form.tags')}
            </label>
            <input
              id="submit-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="machine learning, nlp"
              className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
            />
          </div>

          <div>
            <label htmlFor="submit-venue" className="block text-sm font-medium text-ink-mute mb-2">
              {t('submit.form.venue')}
            </label>
            <input
              id="submit-venue"
              type="text"
              value={form.venue}
              onChange={(e) => updateField('venue', e.target.value)}
              className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
            />
          </div>

          <div>
            <label htmlFor="submit-doi" className="block text-sm font-medium text-ink-mute mb-2">
              {t('submit.form.doi')}
            </label>
            <input
              id="submit-doi"
              type="text"
              value={form.doi}
              onChange={(e) => updateField('doi', e.target.value)}
              className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
            />
          </div>

          <div>
            <label htmlFor="submit-discipline" className="block text-sm font-medium text-ink-mute mb-2">
              {t('submit.form.discipline')}
            </label>
            <select
              id="submit-discipline"
              value={form.discipline}
              onChange={(e) => updateField('discipline', e.target.value as ResourceSubmissionCreate['discipline'])}
              className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
              required
            >
              <option value="">{t('resources.filter.all')}</option>
              {disciplines.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {lang === 'en' ? d.nameEn : d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="submit-subdiscipline" className="block text-sm font-medium text-ink-mute mb-2">
              {t('submit.form.subdiscipline')}
            </label>
            <input
              id="submit-subdiscipline"
              type="text"
              value={form.subdiscipline}
              onChange={(e) => updateField('subdiscipline', e.target.value)}
              className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
            />
          </div>

          <div>
            <label htmlFor="submit-downloadUrl" className="block text-sm font-medium text-ink-mute mb-2">
              {t('submit.form.downloadUrl')}
            </label>
            <input
              id="submit-downloadUrl"
              type="url"
              value={form.downloadUrl}
              onChange={(e) => updateField('downloadUrl', e.target.value)}
              className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
            />
          </div>

          <div>
            <label htmlFor="submit-externalUrl" className="block text-sm font-medium text-ink-mute mb-2">
              {t('submit.form.externalUrl')}
            </label>
            <input
              id="submit-externalUrl"
              type="url"
              value={form.externalUrl}
              onChange={(e) => updateField('externalUrl', e.target.value)}
              className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
            />
          </div>
        </div>

        <div>
          <label htmlFor="submit-abstract" className="block text-sm font-medium text-ink-mute mb-2">
            {t('submit.form.abstract')}
          </label>
          <textarea
            id="submit-abstract"
            value={form.abstract}
            onChange={(e) => updateField('abstract', e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-rule rounded-[2px] bg-transparent focus:outline-none focus:border-moss"
            required
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-moss rounded-[2px] text-paper bg-moss hover:bg-paper hover:text-moss transition-colors disabled:opacity-50"
            aria-label={t('submit.submit')}
          >
            <Upload size={20} />
            <span>{loading ? '...' : t('submit.submit')}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
