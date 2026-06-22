// UI string dictionary.
// English is the source of truth; Chinese is the alternate.
// Use useT().t('key') to look up, falls back to English if a key is missing in zh.

export type Dict = {
  // ── Brand / chrome ──────────────────────────────────────────
  'brand.tagline': string
  'brand.volume': string

  // ── Header / nav ────────────────────────────────────────────
  'nav.home': string
  'nav.resources': string
  'nav.favorites': string
  'nav.history': string
  'nav.lists': string
  'nav.settings': string
  'nav.about': string
  'nav.submit': string
  'nav.menu': string
  'nav.close': string
  'search.placeholder': string
  'search.aria': string
  'search.empty': string            // toast: "Please enter a keyword"

  // ── Footer ──────────────────────────────────────────────────
  'footer.section.brand': string
  'footer.section.navigation': string
  'footer.section.contribute': string
  'footer.link.resources': string
  'footer.link.favorites': string
  'footer.link.settings': string
  'footer.link.contributing': string
  'footer.link.submit': string
  'footer.link.github': string
  'footer.copyright': string        // accepts {year}

  // ── Home ────────────────────────────────────────────────────
  'home.kicker': string             // top publication header
  'home.hero.eyebrow': string
  'home.hero.title': string
  'home.hero.subtitle': string
  'home.hero.search.placeholder': string
  'home.hero.search.submit': string
  'home.hero.meta': string          // "{n} resources · {d} disciplines · …"
  'home.disciplines.title': string
  'home.disciplines.hint': string
  'home.featured.title': string
  'home.featured.viewAll': string
  'home.featured.scrollHint': string
  'home.recommendations.title': string
  'home.recommendations.subtitle': string
  'home.intro.title': string
  'home.intro.what.title': string
  'home.intro.what.body': string
  'home.intro.cite.title': string
  'home.intro.cite.body': string
  'home.intro.contrib.title': string
  'home.intro.contrib.body': string

  // ── Resources list ──────────────────────────────────────────
  'resources.title': string
  'resources.subtitle': string
  'resources.filter.type': string
  'resources.filter.discipline': string
  'resources.filter.year': string
  'resources.filter.all': string
  'resources.empty': string
  'resources.summary': string        // accepts {n} — "Showing 8 resources"
  'resources.countLabel': string     // small label above the count

  // ── Resource types ──────────────────────────────────────────
  'type.paper': string
  'type.dataset': string
  'type.book': string
  'type.tutorial': string
  'type.all': string

  // ── Detail page ─────────────────────────────────────────────
  'detail.back': string
  'detail.tags': string
  'detail.abstract.toggle': string
  'detail.actions.download': string
  'detail.actions.doi': string
  'detail.actions.source': string
  'detail.actions.nolink': string
  'detail.actions.copy': string
  'detail.actions.save': string
  'detail.actions.saved': string
  'detail.also': string
  'detail.citedBy': string
  'detail.cite.title': string
  'detail.cite.apa': string
  'detail.cite.mla': string
  'detail.cite.gbt': string
  'detail.cite.bibtex': string
  'detail.cite.previewAll': string
  'detail.related.title': string
  'detail.notFound.title': string
  'detail.notFound.body': string
  // ── Discipline page ─────────────────────────────────────────
  'discipline.subdisciplines': string
  'discipline.yearSpan': string
  'discipline.viewAll': string       // accepts {name}
  'discipline.empty': string
  'discipline.notFound.title': string

  // ── Search ──────────────────────────────────────────────────
  'search.title': string
  'search.empty.title': string
  'search.empty.body': string
  'search.results.title': string     // accepts {q}
  'search.results.count': string     // accepts {n}
  'search.noResults': string

  // ── Favorites ───────────────────────────────────────────────
  'favorites.title': string
  'favorites.subtitle': string
  'favorites.export': string
  'favorites.clearAll': string
  'favorites.empty.title': string
  'favorites.empty.body': string
  'favorites.confirm.clear': string

  // ── Settings ────────────────────────────────────────────────
  'settings.title': string
  'settings.subtitle': string
  'settings.theme.title': string
  'settings.theme.light': { label: string; desc: string }
  'settings.theme.dark': { label: string; desc: string }
  'settings.theme.auto': { label: string; desc: string }
  'settings.font.title': string
  'settings.font.standard': { label: string; desc: string }
  'settings.font.large': { label: string; desc: string }
  'settings.motion.title': string
  'settings.motion.full': { label: string; desc: string }
  'settings.motion.reduced': { label: string; desc: string }
  'settings.motion.off': { label: string; desc: string }
  'settings.lang.title': string
  'settings.lang.en': { label: string; desc: string }
  'settings.lang.zh': { label: string; desc: string }
  'settings.reset': string
  'settings.confirm.reset': string
  'settings.selected': string

  // ── About ───────────────────────────────────────────────────
  'about.title': string
  'about.subtitle': string
  'about.mission.title': string
  'about.mission.body': string
  'about.scope.title': string
  'about.scope.body': string
  'about.data.title': string
  'about.data.body': string
  'about.contribute.title': string
  'about.contribute.body': string
  'about.license.title': string
  'about.license.body': string

  // ── Resource card ───────────────────────────────────────────
  'card.details': string
  'card.fav.add': string             // aria-label
  'card.fav.remove': string          // aria-label
  'card.fav.add.title': string
  'card.fav.remove.title': string
  'card.summary': string             // accepts {type}, {year}, {tags}

  // ── Discipline card ─────────────────────────────────────────
  'disciplineCard.count': string     // accepts {n}
  'disciplineCard.viewAll': string   // accepts {name}
  'disciplineCard.empty': string

  // ── Toast messages ──────────────────────────────────────────
  'toast.fav.added': string
  'toast.fav.removed': string
  'toast.cite.copied': string        // accepts {format}
  'toast.cite.failed': string
  'toast.user.updated': string
  'toast.user.deleted': string

  // ── Pagination ──────────────────────────────────────────────
  'pagination.label': string
  'pagination.previous': string
  'pagination.next': string
  'pagination.page': string          // accepts {page}

  // ── Print ───────────────────────────────────────────────────
  'print.title': string
  'print.button': string

  // ── Reading History ─────────────────────────────────────────
  'history.title': string
  'history.subtitle': string
  'history.empty.title': string
  'history.empty.body': string
  'history.clearAll': string
  'history.confirm.clear': string
  'history.visited': string          // accepts {count}
  'history.justNow': string
  'history.minutesAgo': string       // accepts {count}
  'history.hoursAgo': string         // accepts {count}
  'history.daysAgo': string          // accepts {count}
  'history.visitedCount': string     // accepts {count}
  'history.remove': string

  // ── Reading Lists ───────────────────────────────────────────
  'lists.title': string
  'lists.subtitle': string
  'lists.create': string
  'lists.empty.title': string
  'lists.empty.body': string
  'lists.delete': string
  'lists.confirm.delete': string
  'lists.addTo': string
  'lists.addToList': string
  'lists.removeFrom': string
  'lists.items': string              // accepts {count}
  'lists.selectList': string
  'lists.emptyForAdd': string
  'lists.added': string
  'lists.alreadyInList': string
  'lists.name': string
  'lists.namePlaceholder': string
  'lists.description': string
  'lists.descriptionPlaceholder': string
  'lists.noResources': string

  // ── Authentication ──────────────────────────────────────────
  'auth.login.title': string
  'auth.login.subtitle': string
  'auth.login.username': string
  'auth.login.password': string
  'auth.login.loading': string
  'auth.login.submit': string
  'auth.login.noAccount': string
  'auth.login.register': string
  'auth.register.title': string
  'auth.register.subtitle': string
  'auth.register.email': string
  'auth.register.username': string
  'auth.register.password': string
  'auth.register.loading': string
  'auth.register.submit': string
  'auth.register.hasAccount': string
  'auth.register.login': string

  // ── Profile ─────────────────────────────────────────────────
  'profile.admin': string
  'profile.user': string
  'profile.adminPanel': string
  'profile.logout': string

  // ── Submit resource ─────────────────────────────────────────
  'submit.title': string
  'submit.subtitle': string
  'submit.form.title': string
  'submit.form.type': string
  'submit.form.authors': string
  'submit.form.tags': string
  'submit.form.year': string
  'submit.form.venue': string
  'submit.form.discipline': string
  'submit.form.subdiscipline': string
  'submit.form.abstract': string
  'submit.form.doi': string
  'submit.form.downloadUrl': string
  'submit.form.externalUrl': string
  'submit.submit': string
  'submit.success': string
  'submit.loginRequired': string

  // ── Admin ───────────────────────────────────────────────────
  'admin.title': string
  'admin.resources.title': string
  'admin.addResource': string
  'admin.editResource': string
  'admin.newResource': string
  'admin.type': string
  'admin.year': string
  'admin.discipline': string
  'admin.subdiscipline': string
  'admin.venue': string
  'admin.authors': string
  'admin.author': string
  'admin.addAuthor': string
  'admin.tags': string
  'admin.tag': string
  'admin.addTag': string
  'admin.doi': string
  'admin.downloadUrl': string
  'admin.externalUrl': string
  'admin.citation': string
  'admin.citation.apa': string
  'admin.citation.mla': string
  'admin.citation.gbt': string
  'admin.citation.bibtex': string
  'admin.abstract': string
  'admin.preview': string
  'admin.citations': string
  'admin.remove': string
  'admin.save': string
  'admin.cancel': string
  'admin.loading': string
  'admin.noResources': string
  'admin.actions': string
  'admin.deleteResource': string
  'admin.confirmDelete': string

  // ── Admin users ─────────────────────────────────────────────
  'admin.users.title': string
  'admin.users.username': string
  'admin.users.email': string
  'admin.users.active': string
  'admin.users.inactive': string
  'admin.users.admin': string
  'admin.users.registeredAt': string
  'admin.users.toggleActive': string
  'admin.users.toggleAdmin': string
  'admin.users.delete': string
  'admin.users.deleteConfirm': string
  'admin.users.cannotDeleteSelf': string
  'admin.users.empty': string
  'admin.users.loading': string

  // ── Admin submissions ───────────────────────────────────────
  'admin.submissions.title': string
  'admin.submissions.pending': string
  'admin.submissions.approved': string
  'admin.submissions.rejected': string
  'admin.submissions.approve': string
  'admin.submissions.reject': string
  'admin.submissions.rejectNote': string
  'admin.submissions.empty': string

  // ── Export ──────────────────────────────────────────────────
  'export.title': string
  'export.bibtex': string
  'export.ris': string
  'export.zotero': string
  'export.json': string
  'export.success': string
  'export.failed': string

  // ── PDF Viewer ──────────────────────────────────────────────
  'pdf.title': string
  'pdf.loading': string
  'pdf.error': string
  'pdf.close': string
  'pdf.previousPage': string
  'pdf.nextPage': string
  'pdf.zoomIn': string
  'pdf.zoomOut': string

  // ── Timeline ────────────────────────────────────────────────
  'timeline.title': string
  'timeline.empty': string

  // ── Recommendations ─────────────────────────────────────────
  'recommendations.title': string
  'recommendations.basedOn': string
  'recommendations.history': string
  'recommendations.empty': string

  // ── Keyboard Shortcuts ──────────────────────────────────────
  'shortcuts.title': string
  'shortcuts.search': string
  'shortcuts.navigateUp': string
  'shortcuts.navigateDown': string
  'shortcuts.openItem': string
  'shortcuts.goHome': string
  'shortcuts.goBack': string
  'shortcuts.toggleTheme': string
  'shortcuts.showHelp': string

  // ── Misc ────────────────────────────────────────────────────
  'common.yes': string
  'common.no': string
  'common.cancel': string
  'common.ok': string
  'common.backHome': string
  'common.pageNotFound': string
  'common.errorTitle': string
  'common.errorBody': string
}

const en: Dict = {
  // Brand
  'brand.tagline': 'Open Academic Shelf',
  'brand.volume': 'Vol. 1 · 2026',

  // Header
  'nav.home': 'Home',
  'nav.resources': 'Resources',
  'nav.favorites': 'Favorites',
  'nav.history': 'History',
  'nav.lists': 'Reading Lists',
  'nav.settings': 'Settings',
  'nav.about': 'About',
  'nav.submit': 'Submit',
  'nav.menu': 'Menu',
  'nav.close': 'Close',
  'search.placeholder': 'Search title, author, keyword',
  'search.aria': 'Search',
  'search.empty': 'Please enter a keyword',

  // Footer
  'footer.section.brand': 'ScholarHUB',
  'footer.section.navigation': 'Navigation',
  'footer.section.contribute': 'Contribute',
  'footer.link.resources': 'All resources',
  'footer.link.favorites': 'Favorites',
  'footer.link.settings': 'Settings',
  'footer.link.contributing': 'Contributing guide',
  'footer.link.submit': 'Submit a resource',
  'footer.link.github': 'GitHub',
  'footer.copyright': '© {year} ScholarHUB · Content licensed under CC BY 4.0 unless otherwise noted.',

  // Home
  'home.kicker': 'ScholarHUB · Open Academic Shelf · Vol. 1 · Issue 2026.06',
  'home.hero.eyebrow': 'A community-curated shelf',
  'home.hero.title': 'Papers, books, and datasets\n— gathered for students.',
  'home.hero.subtitle': 'A community-curated index of open academic resources, organized by discipline and topic. No login, no paywall, no tracking.',
  'home.hero.search.placeholder': 'Search title, author, keyword, discipline…',
  'home.hero.search.submit': 'Search',
  'home.hero.meta': '{n} resources · {d} disciplines · continuously updated',
  'home.disciplines.title': 'Disciplines',
  'home.disciplines.hint': 'Click to expand',
  'home.featured.title': 'Featured Resources',
  'home.featured.viewAll': 'View all',
  'home.featured.scrollHint': '← scroll horizontally →',
  'home.recommendations.title': 'Recommended for You',
  'home.recommendations.subtitle': 'Based on your reading history',
  'home.intro.title': 'About This Project',
  'home.intro.what.title': 'What is this',
  'home.intro.what.body':
    'A community-maintained catalog of open academic resources. All data lives on GitHub — browse online or download for offline use.',
  'home.intro.cite.title': 'Cite resources',
  'home.intro.cite.body':
    'Every resource page provides APA, MLA, GB/T 7714, and BibTeX formats. One click to copy.',
  'home.intro.contrib.title': 'Contribute',
  'home.intro.contrib.body':
    'Found a broken link or missing resource? File an issue. Want to add something? Submit a PR. See the',

  // Resources list
  'resources.title': 'All Resources',
  'resources.subtitle': 'Browse the catalogue by type, discipline, or keyword.',
  'resources.filter.type': 'Type',
  'resources.filter.discipline': 'Discipline',
  'resources.filter.year': 'Year',
  'resources.filter.all': 'All',
  'resources.empty': 'No resources match the current filters.',
  'resources.summary': 'Showing {n} resources',
  'resources.countLabel': 'Resources',

  // Types
  'type.paper': 'Papers',
  'type.dataset': 'Datasets',
  'type.book': 'Books',
  'type.tutorial': 'Tutorials',
  'type.all': 'All',

  // Detail
  'detail.back': 'Back to all resources',
  'detail.tags': 'Tags',
  'detail.abstract.toggle': 'Abstract',
  'detail.actions.download': 'Download',
  'detail.actions.doi': 'View DOI',
  'detail.actions.source': 'View Source',
  'detail.actions.nolink': 'No Link',
  'detail.actions.copy': 'Copy Cite',
  'detail.actions.save': 'Save',
  'detail.actions.saved': 'Saved',
  'detail.also': 'Also:',
  'detail.citedBy': 'Cited by {count}',
  'detail.cite.title': 'Cite this resource',
  'detail.cite.apa': 'APA',
  'detail.cite.mla': 'MLA',
  'detail.cite.gbt': 'GB/T 7714',
  'detail.cite.bibtex': 'BibTeX',
  'detail.cite.previewAll': 'Preview all citation formats',
  'detail.related.title': 'You may also like',
  'detail.notFound.title': 'Resource not found',
  'detail.notFound.body': 'The resource you requested does not exist in the catalogue.',

  // Discipline
  'discipline.subdisciplines': 'Subdisciplines',
  'discipline.yearSpan': 'Year span',
  'discipline.viewAll': 'View all resources in {name}',
  'discipline.empty': 'No resources in this discipline yet.',

  // Search
  'search.title': 'Search',
  'search.empty.title': 'Type a keyword to begin',
  'search.empty.body': 'Search runs across title, authors, abstract, tags, discipline and venue.',
  'search.results.title': 'Results for “{q}”',
  'search.results.count': '{n} matches',
  'search.noResults': 'No resources match “{q}”. Try a broader term.',

  // Favorites
  'favorites.title': 'Favorites',
  'favorites.subtitle': 'Resources you have saved for later reading.',
  'favorites.export': 'Export JSON',
  'favorites.clearAll': 'Clear all',
  'favorites.empty.title': 'No favorites yet',
  'favorites.empty.body': 'Tap the bookmark icon on any resource card to save it here.',
  'favorites.confirm.clear': 'Clear all favorites? This cannot be undone.',

  // Settings
  'settings.title': 'Settings',
  'settings.subtitle': 'Personalise the reading experience.',
  'settings.theme.title': 'Theme',
  'settings.theme.light': { label: 'Light', desc: 'Cream paper, dark ink — printed journal feel.' },
  'settings.theme.dark': { label: 'Dark', desc: 'Ink-black background, easy on the eyes at night.' },
  'settings.theme.auto': { label: 'Auto', desc: 'Follow your operating system preference.' },
  'settings.font.title': 'Font size',
  'settings.font.standard': { label: 'Standard', desc: '17px base — the editorial default.' },
  'settings.font.large': { label: 'Large', desc: '18px base — for slower, careful reading.' },
  'settings.motion.title': 'Animation',
  'settings.motion.full': { label: 'Full', desc: 'All transitions, 0.3s ease.' },
  'settings.motion.reduced': { label: 'Reduced', desc: 'Shorter transitions, easier on the vestibular system.' },
  'settings.motion.off': { label: 'Off', desc: 'No animation. Snap transitions only.' },
  'settings.lang.title': 'Language',
  'settings.lang.en': { label: 'English', desc: 'Primary language of the interface.' },
  'settings.lang.zh': { label: '中文', desc: '界面切到中文(资源元数据保持原语种)。' },
  'settings.reset': 'Reset all settings',
  'settings.confirm.reset': 'Reset all settings to defaults?',
  'settings.selected': 'Selected',

  // About
  'about.title': 'About',
  'about.subtitle': 'What this is, what it is not.',
  'about.mission.title': 'Mission',
  'about.mission.body':
    'ScholarHUB indexes open academic resources — papers, books, datasets, tutorials — that are useful to undergraduate and early-stage researchers. We do not host files; we curate links to free, legal copies.',
  'about.scope.title': 'Scope',
  'about.scope.body':
    'Resources are accepted if they are: (a) free to access without institutional login, (b) attributable to a known author or organisation, and (c) appropriate for a student audience.',
  'about.data.title': 'Data format',
  'about.data.body':
    'The catalogue lives as a typed JSON-like TypeScript module in frontend/src/data/. Each entry carries title, authors, year, type, abstract, link(s), tags, and pre-formatted citations in APA, MLA, GB/T 7714 and BibTeX.',
  'about.contribute.title': 'Contribute',
  'about.contribute.body':
    'The fastest way to help is to file an issue for a broken link or a missing resource. To add a resource, open a pull request that edits frontend/src/data/resources.ts.',
  'about.license.title': 'License',
  'about.license.body':
    'Code: MIT. Resource metadata: CC BY 4.0. Underlying resources remain under their original licenses — see each detail page for the source.',

  // Card
  'card.details': 'Details',
  'card.fav.add': 'Add to favorites',
  'card.fav.remove': 'Remove from favorites',
  'card.fav.add.title': 'Save',
  'card.fav.remove.title': 'Saved — click to remove',
  'card.summary': '{type} · {year} · {tags} tags',

  // Discipline card
  'disciplineCard.count': '{n} resources',
  'disciplineCard.viewAll': 'View all {name} resources',
  'disciplineCard.empty': 'No resources indexed in this discipline yet.',
  'discipline.notFound.title': 'Discipline not found',

  // Toasts
  'toast.fav.added': 'Added to favorites',
  'toast.fav.removed': 'Removed from favorites',
  'toast.cite.copied': '{format} citation copied to clipboard',
  'toast.cite.failed': 'Could not copy — please copy manually',
  'toast.user.updated': 'User updated',
  'toast.user.deleted': 'User deleted',

  // Common
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.cancel': 'Cancel',
  'common.ok': 'OK',
  'common.backHome': 'Back to home',
  'common.pageNotFound': 'Page not found',
  'common.errorTitle': 'Something went wrong',
  'common.errorBody': 'The application encountered an unexpected error.',

  // ── Pagination ──────────────────────────────────────────────
  'pagination.label': 'Pagination',
  'pagination.previous': 'Previous',
  'pagination.next': 'Next',
  'pagination.page': 'Page {page}',

  // ── Print ───────────────────────────────────────────────────
  'print.title': 'Print this resource',
  'print.button': 'Print',

  // ── Reading History ─────────────────────────────────────────
  'history.title': 'Reading History',
  'history.subtitle': 'Resources you have recently viewed.',
  'history.empty.title': 'No history yet',
  'history.empty.body': 'Resources you view will appear here for easy access.',
  'history.clearAll': 'Clear history',
  'history.confirm.clear': 'Clear all reading history? This cannot be undone.',
  'history.visited': 'Visited {count} resources',
  'history.justNow': 'Just now',
  'history.minutesAgo': '{count} minutes ago',
  'history.hoursAgo': '{count} hours ago',
  'history.daysAgo': '{count} days ago',
  'history.visitedCount': 'Visited {count} times',
  'history.remove': 'Remove from history',

  // ── Reading Lists ───────────────────────────────────────────
  'lists.title': 'Reading Lists',
  'lists.subtitle': 'Organize resources into custom collections.',
  'lists.create': 'Create new list',
  'lists.empty.title': 'No reading lists yet',
  'lists.empty.body': 'Create custom lists to organize resources by topic or project.',
  'lists.delete': 'Delete list',
  'lists.confirm.delete': 'Delete this reading list? Resources will not be removed from the catalogue.',
  'lists.addTo': 'Add to list',
  'lists.addToList': 'Add to list',
  'lists.removeFrom': 'Remove from list',
  'lists.items': '{count} items',
  'lists.selectList': 'Select a list',
  'lists.emptyForAdd': 'No reading lists. Create one first.',
  'lists.added': 'Added to list',
  'lists.alreadyInList': 'Already in this list',
  'lists.name': 'List name',
  'lists.namePlaceholder': 'Enter list name',
  'lists.description': 'Description',
  'lists.descriptionPlaceholder': 'Enter description (optional)',
  'lists.noResources': 'No resources in this list yet.',

  // ── Export ──────────────────────────────────────────────────
  'export.title': 'Export',
  'export.bibtex': 'Export as BibTeX',
  'export.ris': 'Export as RIS',
  'export.zotero': 'Export to Zotero',
  'export.json': 'Export as JSON',
  'export.success': 'Export successful',
  'export.failed': 'Export failed',

  // ── PDF Viewer ──────────────────────────────────────────────
  'pdf.title': 'PDF Viewer',
  'pdf.loading': 'Loading PDF...',
  'pdf.error': 'Failed to load PDF',
  'pdf.close': 'Close viewer',
  'pdf.previousPage': 'Previous page',
  'pdf.nextPage': 'Next page',
  'pdf.zoomIn': 'Zoom in',
  'pdf.zoomOut': 'Zoom out',

  // ── Timeline ────────────────────────────────────────────────
  'timeline.title': 'Timeline',
  'timeline.empty': 'No resources available for timeline view.',

  // ── Recommendations ─────────────────────────────────────────
  'recommendations.title': 'Recommended for You',
  'recommendations.basedOn': 'Based on your reading history and interests',
  'recommendations.history': 'From your history',
  'recommendations.empty': 'No recommendations yet. Start exploring resources!',

  // ── Keyboard Shortcuts ──────────────────────────────────────
  'shortcuts.title': 'Keyboard Shortcuts',
  'shortcuts.search': 'Focus search',
  'shortcuts.navigateUp': 'Navigate up',
  'shortcuts.navigateDown': 'Navigate down',
  'shortcuts.openItem': 'Open selected item',
  'shortcuts.goHome': 'Go to home',
  'shortcuts.goBack': 'Go back',
  'shortcuts.toggleTheme': 'Toggle theme',
  'shortcuts.showHelp': 'Show this help',

  // ── Authentication ──────────────────────────────────────────
  'auth.login.title': 'Login',
  'auth.login.subtitle': 'Welcome back to ScholarHUB',
  'auth.login.username': 'Username',
  'auth.login.password': 'Password',
  'auth.login.loading': 'Logging in...',
  'auth.login.submit': 'Login',
  'auth.login.noAccount': "Don't have an account?",
  'auth.login.register': 'Register',
  'auth.register.title': 'Register',
  'auth.register.subtitle': 'Create your ScholarHUB account',
  'auth.register.email': 'Email',
  'auth.register.username': 'Username',
  'auth.register.password': 'Password',
  'auth.register.loading': 'Creating account...',
  'auth.register.submit': 'Register',
  'auth.register.hasAccount': 'Already have an account?',
  'auth.register.login': 'Login',

  // ── Profile ─────────────────────────────────────────────────
  'profile.admin': 'Administrator',
  'profile.user': 'User',
  'profile.adminPanel': 'Admin Panel',
  'profile.logout': 'Logout',

  // ── Submit resource ─────────────────────────────────────────
  'submit.title': 'Submit a Resource',
  'submit.subtitle': 'Contribute a paper, book, dataset, or tutorial to the catalogue.',
  'submit.form.title': 'Title',
  'submit.form.type': 'Type',
  'submit.form.authors': 'Authors',
  'submit.form.tags': 'Tags',
  'submit.form.year': 'Year',
  'submit.form.venue': 'Venue / Publisher',
  'submit.form.discipline': 'Discipline',
  'submit.form.subdiscipline': 'Subdiscipline',
  'submit.form.abstract': 'Abstract',
  'submit.form.doi': 'DOI',
  'submit.form.downloadUrl': 'Download URL',
  'submit.form.externalUrl': 'External URL',
  'submit.submit': 'Submit resource',
  'submit.success': 'Submission received. It will be reviewed shortly.',
  'submit.loginRequired': 'Please log in to submit a resource.',

  // ── Admin ───────────────────────────────────────────────────
  'admin.title': 'Resource Management',
  'admin.resources.title': 'Resources',
  'admin.addResource': 'Add Resource',
  'admin.editResource': 'Edit Resource',
  'admin.newResource': 'New Resource',
  'admin.type': 'Type',
  'admin.year': 'Year',
  'admin.discipline': 'Discipline',
  'admin.subdiscipline': 'Subdiscipline',
  'admin.venue': 'Venue / Publisher',
  'admin.authors': 'Authors',
  'admin.author': 'Author',
  'admin.addAuthor': 'Add author',
  'admin.tags': 'Tags',
  'admin.tag': 'Tag',
  'admin.addTag': 'Add tag',
  'admin.doi': 'DOI',
  'admin.downloadUrl': 'Download URL',
  'admin.externalUrl': 'External URL',
  'admin.citation': 'Citation formats',
  'admin.citation.apa': 'APA',
  'admin.citation.mla': 'MLA',
  'admin.citation.gbt': 'GB/T 7714',
  'admin.citation.bibtex': 'BibTeX',
  'admin.abstract': 'Abstract',
  'admin.preview': 'Preview',
  'admin.citations': 'Citation count',
  'admin.remove': 'Remove',
  'admin.save': 'Save',
  'admin.cancel': 'Cancel',
  'admin.loading': 'Loading resources...',
  'admin.noResources': 'No resources found',
  'admin.actions': 'Actions',
  'admin.deleteResource': 'Delete resource',
  'admin.confirmDelete': 'Are you sure you want to delete this resource?',

  // ── Admin users ─────────────────────────────────────────────
  'admin.users.title': 'User Management',
  'admin.users.username': 'Username',
  'admin.users.email': 'Email',
  'admin.users.active': 'Active',
  'admin.users.inactive': 'Inactive',
  'admin.users.admin': 'Admin',
  'admin.users.registeredAt': 'Registered',
  'admin.users.toggleActive': 'Toggle active',
  'admin.users.toggleAdmin': 'Toggle admin',
  'admin.users.delete': 'Delete user',
  'admin.users.deleteConfirm': 'Are you sure you want to delete this user?',
  'admin.users.cannotDeleteSelf': 'You cannot delete your own account.',
  'admin.users.empty': 'No users found.',
  'admin.users.loading': 'Loading users...',

  // ── Admin submissions ───────────────────────────────────────
  'admin.submissions.title': 'Review Submissions',
  'admin.submissions.pending': 'Pending',
  'admin.submissions.approved': 'Approved',
  'admin.submissions.rejected': 'Rejected',
  'admin.submissions.approve': 'Approve',
  'admin.submissions.reject': 'Reject',
  'admin.submissions.rejectNote': 'Admin note (optional)',
  'admin.submissions.empty': 'No pending submissions.',
}

const zh: Dict = {
  'brand.tagline': '开放学术书架',
  'brand.volume': '第 1 卷 · 2026',

  'nav.home': '首页',
  'nav.resources': '资源',
  'nav.favorites': '收藏',
  'nav.history': '历史',
  'nav.lists': '阅读列表',
  'nav.settings': '设置',
  'nav.about': '关于',
  'nav.submit': '提交资源',
  'nav.menu': '菜单',
  'nav.close': '关闭',
  'search.placeholder': '搜索标题、作者、关键词',
  'search.aria': '搜索',
  'search.empty': '请输入关键词',

  'footer.section.brand': 'ScholarHUB',
  'footer.section.navigation': '导航',
  'footer.section.contribute': '参与',
  'footer.link.resources': '资源列表',
  'footer.link.favorites': '收藏夹',
  'footer.link.settings': '设置',
  'footer.link.contributing': '贡献指南',
  'footer.link.submit': '提交资源',
  'footer.link.github': 'GitHub 仓库',
  'footer.copyright': '© {year} ScholarHUB · 内容除特别说明外采用 CC BY 4.0 许可。',

  'home.kicker': 'ScholarHUB · 开放学术书架 · 第 1 卷 · 2026.06',
  'home.hero.eyebrow': '社区维护的开放书架',
  'home.hero.title': '论文、教材与数据集\n— 整理给学生与初学者。',
  'home.hero.subtitle': '由社区维护的开放学术资源索引,按学科与主题整理。无需登录,无墙,无追踪。',
  'home.hero.search.placeholder': '搜索论文标题、作者、关键词、学科...',
  'home.hero.search.submit': '搜索',
  'home.hero.meta': '收录 {n} 项资源 · 覆盖 {d} 个一级学科 · 持续更新',
  'home.disciplines.title': '学科导航',
  'home.disciplines.hint': '点击展开',
  'home.featured.title': '精选资源',
  'home.featured.viewAll': '查看全部',
  'home.featured.scrollHint': '← 横向滑动浏览更多 →',
  'home.recommendations.title': '为你推荐',
  'home.recommendations.subtitle': '基于你的阅读历史',
  'home.intro.title': '关于本项目',
  'home.intro.what.title': '关于这个项目',
  'home.intro.what.body':
    '这是一个由社区维护的开放学术资源目录。所有数据都保存在 GitHub 上，你可以直接在线浏览，也可以下载离线使用。',
  'home.intro.cite.title': '引用资源',
  'home.intro.cite.body':
    '每个资源页面都提供 APA、MLA、GB/T 7714 和 BibTeX 四种引用格式，一键复制。',
  'home.intro.contrib.title': '参与贡献',
  'home.intro.contrib.body':
    '发现链接失效或缺少资源？欢迎提交 issue。想添加新资源？直接提交 PR 即可。详见',

  'resources.title': '全部资源',
  'resources.subtitle': '按类型、学科、关键词浏览整个目录。',
  'resources.filter.type': '类型',
  'resources.filter.discipline': '学科',
  'resources.filter.year': '年份',
  'resources.filter.all': '全部',
  'resources.empty': '当前筛选下没有匹配的资源。',
  'resources.summary': '共 {n} 项',
  'resources.countLabel': '资源',

  'type.paper': '论文',
  'type.dataset': '数据集',
  'type.book': '教材',
  'type.tutorial': '教程',
  'type.all': '全部',

  'detail.back': '返回资源列表',
  'detail.tags': '标签',
  'detail.abstract.toggle': '摘要',
  'detail.actions.download': '下载',
  'detail.actions.doi': '查看 DOI',
  'detail.actions.source': '查看来源',
  'detail.actions.nolink': '无链接',
  'detail.actions.copy': '复制引用',
  'detail.actions.save': '收藏',
  'detail.actions.saved': '已收藏',
  'detail.also': '另见:',
  'detail.citedBy': '被引用 {count} 次',
  'detail.cite.title': '引用此资源',
  'detail.cite.apa': 'APA',
  'detail.cite.mla': 'MLA',
  'detail.cite.gbt': 'GB/T 7714',
  'detail.cite.bibtex': 'BibTeX',
  'detail.cite.previewAll': '预览所有引用格式',
  'detail.related.title': '你可能也会喜欢',
  'detail.notFound.title': '资源未找到',
  'detail.notFound.body': '请求的资源不在目录中。',

  'discipline.subdisciplines': '子学科',
  'discipline.yearSpan': '时间跨度',
  'discipline.viewAll': '查看 {name} 全部资源',
  'discipline.empty': '本学科暂无收录资源。',

  'search.title': '搜索',
  'search.empty.title': '输入关键词开始搜索',
  'search.empty.body': '搜索会扫描标题、作者、摘要、标签、学科与会议/期刊名。',
  'search.results.title': '“{q}” 的搜索结果',
  'search.results.count': '共 {n} 条',
  'search.noResults': '未找到与 “{q}” 相关的资源。换一个更宽泛的词试试。',

  'favorites.title': '收藏夹',
  'favorites.subtitle': '你保存下来方便以后阅读的资源。',
  'favorites.export': '导出 JSON',
  'favorites.clearAll': '清空全部',
  'favorites.empty.title': '暂无收藏',
  'favorites.empty.body': '在资源卡片上点击书签图标即可加入收藏。',
  'favorites.confirm.clear': '确定要清空全部收藏吗?该操作不可撤销。',

  'settings.title': '设置',
  'settings.subtitle': '自定义你的阅读体验。',
  'settings.theme.title': '主题',
  'settings.theme.light': { label: '浅色', desc: '纸白底、墨黑字，像翻阅印刷期刊一样。' },
  'settings.theme.dark': { label: '深色', desc: '墨黑背景，晚上看更舒服。' },
  'settings.theme.auto': { label: '跟随系统', desc: '自动适配你设备的明暗设置。' },
  'settings.font.title': '字号',
  'settings.font.standard': { label: '标准', desc: '17px 基础字号，默认阅读体验。' },
  'settings.font.large': { label: '加大', desc: '18px 基础字号，适合慢慢细读。' },
  'settings.motion.title': '动效',
  'settings.motion.full': { label: '完整', desc: '保留所有过渡动画，0.3s 缓动。' },
  'settings.motion.reduced': { label: '减弱', desc: '缩短过渡时间，减少视觉干扰。' },
  'settings.motion.off': { label: '关闭', desc: '无动画，瞬间切换。' },
  'settings.lang.title': '语言',
  'settings.lang.en': { label: 'English', desc: '界面主语言。' },
  'settings.lang.zh': { label: '中文', desc: '切换到中文界面（资源元数据保留原语种）。' },
  'settings.reset': '重置所有设置',
  'settings.confirm.reset': '确定要重置所有设置到默认值吗？',
  'settings.selected': '已选择',

  'about.title': '关于',
  'about.subtitle': '简单介绍一下这个项目。',
  'about.mission.title': '我们在做什么',
  'about.mission.body':
    'ScholarHUB 整理了一些对本科生和科研新手有用的开放学术资源——论文、教材、数据集、教程。我们不存储文件，只是收集那些免费、合法的链接。',
  'about.scope.title': '收录标准',
  'about.scope.body':
    '我们收录的资源需要满足：(a) 不用机构登录就能访问；(b) 能追溯到明确的作者或机构；(c) 适合学生使用。',
  'about.data.title': '数据格式',
  'about.data.body':
    '资源目录用 TypeScript 写在 frontend/src/data/ 里。每条记录包含标题、作者、年份、类型、摘要、链接、标签，还有 APA、MLA、GB/T 7714、BibTeX 四种引用格式。',
  'about.contribute.title': '参与贡献',
  'about.contribute.body':
    '发现链接失效或缺少资源？提交个 issue 最快。想添加新资源？直接改 frontend/src/data/resources.ts 然后提 PR。',
  'about.license.title': '许可协议',
  'about.license.body':
    '代码用 MIT 协议。资源元数据用 CC BY 4.0。原始资源保留各自的许可，具体看每个资源详情页。',

  'card.details': '详情',
  'card.fav.add': '加入收藏',
  'card.fav.remove': '取消收藏',
  'card.fav.add.title': '收藏',
  'card.fav.remove.title': '已收藏 · 点击移除',
  'card.summary': '{type} · {year} · {tags} 个主题',

  'disciplineCard.count': '{n} 项资源',
  'disciplineCard.viewAll': '查看 {name} 全部资源',
  'disciplineCard.empty': '本学科暂无收录资源。',
  'discipline.notFound.title': '学科未找到',

  'toast.fav.added': '已加入收藏',
  'toast.fav.removed': '已移出收藏',
  'toast.cite.copied': '{format} 引用已复制到剪贴板',
  'toast.cite.failed': '复制失败 — 请手动复制',
  'toast.user.updated': '用户已更新',
  'toast.user.deleted': '用户已删除',

  'common.yes': '是',
  'common.no': '否',
  'common.cancel': '取消',
  'common.ok': '好',
  'common.backHome': '返回首页',
  'common.pageNotFound': '页面没找到',
  'common.errorTitle': '出错了',
  'common.errorBody': '应用遇到了意外错误。',

  // ── Pagination ──────────────────────────────────────────────
  'pagination.label': '分页导航',
  'pagination.previous': '上一页',
  'pagination.next': '下一页',
  'pagination.page': '第 {page} 页',

  // ── Print ───────────────────────────────────────────────────
  'print.title': '打印此资源',
  'print.button': '打印',

  // ── Reading History ─────────────────────────────────────────
  'history.title': '阅读历史',
  'history.subtitle': '你最近看过的资源。',
  'history.empty.title': '暂无历史记录',
  'history.empty.body': '你看过什么资源，这里就会显示什么，方便你快速找到。',
  'history.clearAll': '清空历史',
  'history.confirm.clear': '确定要清空全部阅读历史吗？这个操作没法撤销。',
  'history.visited': '看过 {count} 次',
  'history.justNow': '刚刚',
  'history.minutesAgo': '{count} 分钟前',
  'history.hoursAgo': '{count} 小时前',
  'history.daysAgo': '{count} 天前',
  'history.visitedCount': '看了 {count} 次',
  'history.remove': '从历史中删掉',

  // ── Reading Lists ───────────────────────────────────────────
  'lists.title': '阅读列表',
  'lists.subtitle': '把资源整理成你自己的集合。',
  'lists.create': '新建列表',
  'lists.empty.title': '暂无阅读列表',
  'lists.empty.body': '建几个列表，按主题或项目把资源分分类。',
  'lists.delete': '删掉这个列表',
  'lists.confirm.delete': '确定要删掉这个阅读列表吗？资源本身不会被删。',
  'lists.addTo': '加到列表',
  'lists.addToList': '加入书单',
  'lists.removeFrom': '从列表里删掉',
  'lists.items': '{count} 项',
  'lists.selectList': '选择一个书单',
  'lists.emptyForAdd': '暂无书单，请先创建。',
  'lists.added': '已加入书单',
  'lists.alreadyInList': '已在该书单中',
  'lists.name': '列表名称',
  'lists.namePlaceholder': '给列表起个名',
  'lists.description': '描述',
  'lists.descriptionPlaceholder': '简单描述一下（可选）',
  'lists.noResources': '这个列表里还没东西。',

  // ── Export ──────────────────────────────────────────────────
  'export.title': '导出',
  'export.bibtex': '导出为 BibTeX',
  'export.ris': '导出为 RIS',
  'export.zotero': '导出到 Zotero',
  'export.json': '导出为 JSON',
  'export.success': '导出成功',
  'export.failed': '导出失败',

  // ── PDF Viewer ──────────────────────────────────────────────
  'pdf.title': 'PDF 查看器',
  'pdf.loading': '正在加载 PDF...',
  'pdf.error': 'PDF 加载失败',
  'pdf.close': '关闭查看器',
  'pdf.previousPage': '上一页',
  'pdf.nextPage': '下一页',
  'pdf.zoomIn': '放大',
  'pdf.zoomOut': '缩小',

  // ── Timeline ────────────────────────────────────────────────
  'timeline.title': '时间线',
  'timeline.empty': '暂无可用于时间线视图的资源。',

  // ── Recommendations ─────────────────────────────────────────
  'recommendations.title': '为你推荐',
  'recommendations.basedOn': '基于你的阅读历史和兴趣',
  'recommendations.history': '来自你的历史',
  'recommendations.empty': '暂无推荐。开始探索资源吧！',

  // ── Keyboard Shortcuts ──────────────────────────────────────
  'shortcuts.title': '键盘快捷键',
  'shortcuts.search': '聚焦搜索框',
  'shortcuts.navigateUp': '向上导航',
  'shortcuts.navigateDown': '向下导航',
  'shortcuts.openItem': '打开选中项',
  'shortcuts.goHome': '返回首页',
  'shortcuts.goBack': '返回上一页',
  'shortcuts.toggleTheme': '切换主题',
  'shortcuts.showHelp': '显示此帮助',

  // ── Authentication ──────────────────────────────────────────
  'auth.login.title': '登录',
  'auth.login.subtitle': '欢迎回到 ScholarHUB',
  'auth.login.username': '用户名',
  'auth.login.password': '密码',
  'auth.login.loading': '登录中...',
  'auth.login.submit': '登录',
  'auth.login.noAccount': '还没有账号？',
  'auth.login.register': '注册',
  'auth.register.title': '注册',
  'auth.register.subtitle': '创建你的 ScholarHUB 账号',
  'auth.register.email': '邮箱',
  'auth.register.username': '用户名',
  'auth.register.password': '密码',
  'auth.register.loading': '创建账号中...',
  'auth.register.submit': '注册',
  'auth.register.hasAccount': '已有账号？',
  'auth.register.login': '登录',

  // ── Profile ─────────────────────────────────────────────────
  'profile.admin': '管理员',
  'profile.user': '用户',
  'profile.adminPanel': '管理面板',
  'profile.logout': '退出登录',

  // ── Submit resource ─────────────────────────────────────────
  'submit.title': '提交资源',
  'submit.subtitle': '向目录贡献论文、教材、数据集或教程。',
  'submit.form.title': '标题',
  'submit.form.type': '类型',
  'submit.form.authors': '作者',
  'submit.form.tags': '标签',
  'submit.form.year': '年份',
  'submit.form.venue': '会议/期刊/出版社',
  'submit.form.discipline': '学科',
  'submit.form.subdiscipline': '子学科',
  'submit.form.abstract': '摘要',
  'submit.form.doi': 'DOI',
  'submit.form.downloadUrl': '下载链接',
  'submit.form.externalUrl': '外部链接',
  'submit.submit': '提交资源',
  'submit.success': '提交已收到，将尽快审核。',
  'submit.loginRequired': '请登录后再提交资源。',

  // ── Admin ───────────────────────────────────────────────────
  'admin.title': '资源管理',
  'admin.resources.title': '资源',
  'admin.addResource': '添加资源',
  'admin.editResource': '编辑资源',
  'admin.newResource': '新建资源',
  'admin.type': '类型',
  'admin.year': '年份',
  'admin.discipline': '学科',
  'admin.subdiscipline': '子学科',
  'admin.venue': '会议/期刊/出版社',
  'admin.authors': '作者',
  'admin.author': '作者',
  'admin.addAuthor': '添加作者',
  'admin.tags': '标签',
  'admin.tag': '标签',
  'admin.addTag': '添加标签',
  'admin.doi': 'DOI',
  'admin.downloadUrl': '下载链接',
  'admin.externalUrl': '外部链接',
  'admin.citation': '引用格式',
  'admin.citation.apa': 'APA',
  'admin.citation.mla': 'MLA',
  'admin.citation.gbt': 'GB/T 7714',
  'admin.citation.bibtex': 'BibTeX',
  'admin.abstract': '摘要',
  'admin.preview': '预览',
  'admin.citations': '被引次数',
  'admin.remove': '移除',
  'admin.save': '保存',
  'admin.cancel': '取消',
  'admin.loading': '加载资源中...',
  'admin.noResources': '未找到资源',
  'admin.actions': '操作',
  'admin.deleteResource': '删除资源',
  'admin.confirmDelete': '确定要删除此资源吗？',

  // ── Admin users ─────────────────────────────────────────────
  'admin.users.title': '用户管理',
  'admin.users.username': '用户名',
  'admin.users.email': '邮箱',
  'admin.users.active': '已激活',
  'admin.users.inactive': '已禁用',
  'admin.users.admin': '管理员',
  'admin.users.registeredAt': '注册时间',
  'admin.users.toggleActive': '切换激活状态',
  'admin.users.toggleAdmin': '切换管理员',
  'admin.users.delete': '删除用户',
  'admin.users.deleteConfirm': '确定要删除该用户吗？',
  'admin.users.cannotDeleteSelf': '不能删除自己的账号。',
  'admin.users.empty': '暂无用户。',
  'admin.users.loading': '加载用户中...',

  // ── Admin submissions ───────────────────────────────────────
  'admin.submissions.title': '审核提交',
  'admin.submissions.pending': '待审核',
  'admin.submissions.approved': '已通过',
  'admin.submissions.rejected': '已拒绝',
  'admin.submissions.approve': '通过',
  'admin.submissions.reject': '拒绝',
  'admin.submissions.rejectNote': '管理员备注（可选）',
  'admin.submissions.empty': '暂无待审核提交。',
}

export const dicts = { en, zh } as const
export type Lang = keyof typeof dicts
