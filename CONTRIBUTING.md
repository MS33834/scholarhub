# Contributing to ScholarHUB

Thank you for your interest in contributing to ScholarHUB! This document provides guidelines and information for contributors.

## How to Contribute

### Adding a New Resource

1. **Fork the repository** and create a new branch
2. **Edit `src/data/resources.ts`** and add your resource entry:

```typescript
{
  id: 'unique-resource-id',
  type: 'paper', // or 'dataset', 'book', 'tutorial'
  title: 'Resource Title',
  authors: ['Author Name'],
  year: 2024,
  venue: 'Conference/Journal Name',
  doi: '10.xxxx/xxxxx', // optional
  discipline: 'computer-science', // see Discipline type in src/types/index.ts
  subdiscipline: 'machine-learning', // optional
  tags: ['tag1', 'tag2'],
  abstract: 'Brief abstract of the resource...',
  preview: 'Short preview text for cards...',
  downloadUrl: 'https://example.com/download', // optional
  externalUrl: 'https://example.com/resource', // optional
  citation: {
    apa: 'Author, A. (2024). Title. Venue.',
    mla: 'Author, A. "Title." Venue (2024).',
    gbt: 'Author A. Title[J]. Venue, 2024.',
    bibtex: '@article{...}',
  },
  addedAt: '2024-01-01',
  citations: 100, // optional
}
```

3. **Submit a pull request** with your changes

### Reporting Issues

- **Broken links**: File an issue with the resource ID and the correct URL
- **Missing resources**: File an issue or submit a PR with the resource data
- **Bugs**: File an issue with reproduction steps and expected behavior

## Development Setup

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The site will be available at `http://localhost:5173/`

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── components/       # Reusable UI components
├── data/            # Resource and discipline data
├── hooks/           # Domain-specific React hooks
├── i18n/            # Internationalization (EN/CN)
├── lib/             # API facade, environment config
├── pages/           # Page components
├── store/           # Zustand state management
├── types/           # TypeScript type definitions
└── utils/           # Utility functions

backend/
├── app/             # FastAPI application
├── alembic/         # Database migrations
└── scripts/         # Backup and maintenance scripts
```

## Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Keep components small and focused
- Use Zustand for state management
- Use the i18n system for all user-facing strings

## Internationalization

ScholarHUB supports both English and Chinese. When adding new UI strings:

1. Add the key to `src/i18n/dict.ts` in the `Dict` type
2. Add English translation in the `en` object
3. Add Chinese translation in the `zh` object
4. Use the key in your component: `t('your.key')`

## Questions?

Feel free to open an issue if you have questions about contributing.
