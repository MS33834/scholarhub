import type { Discipline, DisciplineInfo } from '@/types'

// `name` is the Chinese (中文) name; `nameEn` is the English counterpart.
// `blurb` is the Chinese one-liner; `blurbEn` is the English one.
// The UI picks based on the active language.

export const disciplines: DisciplineInfo[] = [
  {
    slug: 'computer-science',
    name: '计算机科学',
    nameEn: 'Computer Science',
    blurb: '机器学习、算法、系统与编程语言。',
    blurbEn: 'Machine learning, algorithms, systems, and programming languages.',
    order: 1,
  },
  {
    slug: 'mathematics',
    name: '数学',
    nameEn: 'Mathematics',
    blurb: '从分析到代数,建立严格的推理习惯。',
    blurbEn: 'From analysis to algebra — building rigorous reasoning habits.',
    order: 2,
  },
  {
    slug: 'physics',
    name: '物理学',
    nameEn: 'Physics',
    blurb: '从经典力学到量子场论的完整脉络。',
    blurbEn: 'From classical mechanics to quantum field theory.',
    order: 3,
  },
  {
    slug: 'life-sciences',
    name: '生命科学',
    nameEn: 'Life Sciences',
    blurb: '分子生物、遗传、生态与进化的基础读物。',
    blurbEn: 'Molecular biology, genetics, ecology, and evolution.',
    order: 4,
  },
  {
    slug: 'social-sciences',
    name: '社会科学',
    nameEn: 'Social Sciences',
    blurb: '经济学、心理学、社会学与行为科学。',
    blurbEn: 'Economics, psychology, sociology, and behavioral science.',
    order: 5,
  },
  {
    slug: 'humanities',
    name: '人文学科',
    nameEn: 'Humanities',
    blurb: '哲学、历史、文学与艺术理论。',
    blurbEn: 'Philosophy, history, literature, and art theory.',
    order: 6,
  },
]

export const disciplineMap: Record<Discipline, DisciplineInfo> = Object.fromEntries(
  disciplines.map((d) => [d.slug, d]),
) as Record<Discipline, DisciplineInfo>
