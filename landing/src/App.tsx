import { useEffect, useState } from 'react'
import {
  BookOpen,
  Database,
  FileText,
  Github,
  GraduationCap,
  Heart,
  Layers,
  Moon,
  Search,
  Sun,
  Tag,
} from 'lucide-react'

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])

  return (
    <button
      onClick={() => setIsDark((v) => !v)}
      aria-label="Toggle theme"
      className="p-2 border border-rule text-ink-soft hover:text-ink hover:border-ink transition-colors"
    >
      {isDark ? <Sun size={18} strokeWidth={1.25} /> : <Moon size={18} strokeWidth={1.25} />}
    </button>
  )
}

function SectionRule() {
  return <div className="rule w-full" />
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="mono text-[13px] tracking-wide">{children}</span>
}

export default function App() {
  return (
    <div className="min-h-full flex flex-col bg-paper text-ink fade-in">
      {/* Top masthead */}
      <header className="px-6 sm:px-10 lg:px-16 pt-8 pb-6">
        <div className="max-w-column mx-auto">
          <div className="flex items-baseline justify-between">
            <Mono>ScholarHUB — Vol. 1 · 2026</Mono>
            <ThemeToggle />
          </div>
          <div className="rule mt-4" />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 sm:px-10 lg:px-16 pt-16 sm:pt-24 lg:pt-32 pb-20 sm:pb-28">
          <div className="max-w-column mx-auto">
            <p className="mono text-ochre text-[12px] uppercase tracking-wider2 mb-6">
              Open Academic Resource Index
            </p>
            <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] mb-8">
              An open shelf of papers, books, and datasets.
            </h1>
            <p className="text-ink-soft text-lg sm:text-xl leading-relaxed max-w-[680px] mb-10">
              ScholarHUB 是一个面向学生与科研初学者的开放学术资源索引。我们将散落在各处的论文、教材、公开数据集与教程按学科归类整理，无需登录即可检索、浏览与引用。
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/ms33834/scholarhub"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-moss text-paper border border-moss hover:bg-ink hover:border-ink transition-colors mono text-[13px] tracking-wide"
              >
                <Github size={16} strokeWidth={1.25} />
                View on GitHub
              </a>
              <a
                href="/scholarhub/"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-ink text-ink hover:bg-ink hover:text-paper transition-colors mono text-[13px] tracking-wide"
              >
                <Search size={16} strokeWidth={1.25} />
                Open App
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 sm:px-10 lg:px-16 py-20 sm:py-28 border-t border-rule">
          <div className="max-w-column mx-auto">
            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-16">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Search size={20} strokeWidth={1.25} className="text-moss" />
                  <h2 className="text-2xl font-display">统一检索</h2>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  按标题、作者、关键词或学科进行全文检索，支持多学科交叉筛选，快速定位所需资料。
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Layers size={20} strokeWidth={1.25} className="text-moss" />
                  <h2 className="text-2xl font-display">学科归类</h2>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  覆盖计算机科学、数学、物理学、生命科学、社会科学等多门一级学科，并细分子领域。
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <FileText size={20} strokeWidth={1.25} className="text-moss" />
                  <h2 className="text-2xl font-display">引用格式</h2>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  一键生成 APA、MLA、GB/T 7714 与 BibTeX 四种引用格式，减少手动排版的琐碎工作。
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Heart size={20} strokeWidth={1.25} className="text-moss" />
                  <h2 className="text-2xl font-display">收藏与书单</h2>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  本地收藏夹与自定义阅读书单，登录用户更可同步至云端，跨设备延续学习进度。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section className="px-6 sm:px-10 lg:px-16 py-20 sm:py-28 border-t border-rule bg-paper">
          <div className="max-w-column mx-auto">
            <p className="mono text-ochre text-[12px] uppercase tracking-wider2 mb-4">Architecture</p>
            <h2 className="text-3xl sm:text-4xl font-display mb-8">前后端分离，数据库真实驱动</h2>
            <p className="text-ink-soft text-lg leading-relaxed mb-12 max-w-[720px]">
              前端基于 React + Vite + Tailwind CSS，后端采用 FastAPI + PostgreSQL，通过 Alembic 管理数据库迁移。GitHub Pages 仅托管项目介绍页，应用本身可独立部署。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="border border-rule p-5 hover:border-ink transition-colors">
                <Database size={18} strokeWidth={1.25} className="text-ochre mb-3" />
                <h3 className="text-lg font-display mb-2">PostgreSQL</h3>
                <p className="mono text-[12px] text-ink-mute">关系型数据持久化</p>
              </div>
              <div className="border border-rule p-5 hover:border-ink transition-colors">
                <GraduationCap size={18} strokeWidth={1.25} className="text-ochre mb-3" />
                <h3 className="text-lg font-display mb-2">FastAPI</h3>
                <p className="mono text-[12px] text-ink-mute">异步 Python 后端</p>
              </div>
              <div className="border border-rule p-5 hover:border-ink transition-colors">
                <BookOpen size={18} strokeWidth={1.25} className="text-ochre mb-3" />
                <h3 className="text-lg font-display mb-2">React + Vite</h3>
                <p className="mono text-[12px] text-ink-mute">现代化前端构建</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats / Coverage */}
        <section className="px-6 sm:px-10 lg:px-16 py-20 sm:py-28 border-t border-rule">
          <div className="max-w-column mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div>
                <p className="font-display text-4xl sm:text-5xl text-moss mb-2">6+</p>
                <p className="mono text-[12px] text-ink-mute uppercase tracking-wide">Disciplines</p>
              </div>
              <div>
                <p className="font-display text-4xl sm:text-5xl text-moss mb-2">4</p>
                <p className="mono text-[12px] text-ink-mute uppercase tracking-wide">Resource Types</p>
              </div>
              <div>
                <p className="font-display text-4xl sm:text-5xl text-moss mb-2">4</p>
                <p className="mono text-[12px] text-ink-mute uppercase tracking-wide">Citation Formats</p>
              </div>
              <div>
                <p className="font-display text-4xl sm:text-5xl text-moss mb-2">0</p>
                <p className="mono text-[12px] text-ink-mute uppercase tracking-wide">Paywalls</p>
              </div>
            </div>
          </div>
        </section>

        {/* Resource types */}
        <section className="px-6 sm:px-10 lg:px-16 py-20 sm:py-28 border-t border-rule">
          <div className="max-w-column mx-auto">
            <p className="mono text-ochre text-[12px] uppercase tracking-wider2 mb-4">Collections</p>
            <h2 className="text-3xl sm:text-4xl font-display mb-10">收录类型</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Tag size={18} strokeWidth={1.25} className="text-ochre mt-1.5 shrink-0" />
                <div>
                  <h3 className="text-xl font-display mb-1">学术论文 Papers</h3>
                  <p className="text-ink-soft">经典与前沿论文，提供 DOI、摘要与跳转下载。</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <BookOpen size={18} strokeWidth={1.25} className="text-ochre mt-1.5 shrink-0" />
                <div>
                  <h3 className="text-xl font-display mb-1">教材与专著 Books</h3>
                  <p className="text-ink-soft">系统入门的教科书与参考书籍。</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Database size={18} strokeWidth={1.25} className="text-ochre mt-1.5 shrink-0" />
                <div>
                  <h3 className="text-xl font-display mb-1">公开数据集 Datasets</h3>
                  <p className="text-ink-soft">用于科研与实验的开放数据源。</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <GraduationCap size={18} strokeWidth={1.25} className="text-ochre mt-1.5 shrink-0" />
                <div>
                  <h3 className="text-xl font-display mb-1">教程 Tutorials</h3>
                  <p className="text-ink-soft">课程笔记、讲义与动手实践指南。</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contribute */}
        <section className="px-6 sm:px-10 lg:px-16 py-20 sm:py-28 border-t border-rule bg-paper">
          <div className="max-w-column mx-auto">
            <p className="mono text-ochre text-[12px] uppercase tracking-wider2 mb-4">Contribute</p>
            <h2 className="text-3xl sm:text-4xl font-display mb-6">参与共建</h2>
            <p className="text-ink-soft text-lg leading-relaxed mb-8 max-w-[680px]">
              ScholarHUB 由社区共同维护。你可以提交新的资源、修正元数据、改进前端体验，或帮助完善文档。所有贡献均遵循 MIT 协议。
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://github.com/ms33834/scholarhub/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noreferrer"
                className="link-underline mono text-[13px] text-ink-soft hover:text-ink"
              >
                CONTRIBUTING.md
              </a>
              <a
                href="https://github.com/ms33834/scholarhub/issues"
                target="_blank"
                rel="noreferrer"
                className="link-underline mono text-[13px] text-ink-soft hover:text-ink"
              >
                GitHub Issues
              </a>
              <a
                href="https://github.com/ms33834/scholarhub/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
                className="link-underline mono text-[13px] text-ink-soft hover:text-ink"
              >
                LICENSE
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 sm:px-10 lg:px-16 py-12 border-t border-rule">
        <div className="max-w-column mx-auto">
          <SectionRule />
          <div className="grid sm:grid-cols-3 gap-10 mt-10">
            <div>
              <p className="mono text-[12px] uppercase tracking-wide text-ink-mute mb-3">Project</p>
              <ul className="space-y-2 text-ink-soft">
                <li>
                  <a href="/scholarhub/" className="link-underline">Web App</a>
                </li>
                <li>
                  <a href="https://github.com/ms33834/scholarhub" target="_blank" rel="noreferrer" className="link-underline">Source Code</a>
                </li>
                <li>
                  <a href="https://github.com/ms33834/scholarhub/blob/main/README.md" target="_blank" rel="noreferrer" className="link-underline">Documentation</a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mono text-[12px] uppercase tracking-wide text-ink-mute mb-3">Community</p>
              <ul className="space-y-2 text-ink-soft">
                <li>
                  <a href="https://github.com/ms33834/scholarhub/issues" target="_blank" rel="noreferrer" className="link-underline">Issues</a>
                </li>
                <li>
                  <a href="https://github.com/ms33834/scholarhub/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer" className="link-underline">Contributing</a>
                </li>
                <li>
                  <a href="https://github.com/ms33834/scholarhub/blob/main/CODE_OF_CONDUCT.md" target="_blank" rel="noreferrer" className="link-underline">Code of Conduct</a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mono text-[12px] uppercase tracking-wide text-ink-mute mb-3">Legal</p>
              <ul className="space-y-2 text-ink-soft">
                <li>
                  <a href="https://github.com/ms33834/scholarhub/blob/main/LICENSE" target="_blank" rel="noreferrer" className="link-underline">MIT License</a>
                </li>
                <li>
                  <a href="https://github.com/ms33834/scholarhub/blob/main/SECURITY.md" target="_blank" rel="noreferrer" className="link-underline">Security</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-rule flex flex-col sm:flex-row justify-between gap-4 text-ink-mute mono text-[12px]">
            <p>© 2026 ScholarHUB. Released under the MIT License.</p>
            <p>Designed with restraint.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
