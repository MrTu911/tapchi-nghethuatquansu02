import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import dynamic from 'next/dynamic'
import type { Corpus } from '@/types/corpus'

interface Props {
  params: { slug: string }
}

const KindleReader = dynamic(() => import('@/components/reader/KindleReader'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: '#F4ECD8' }}>
      <div className="w-9 h-9 rounded-full border-4 animate-spin"
           style={{ borderColor: 'rgba(122,46,46,.18)', borderTopColor: '#7A2E2E' }} />
      <p className="mt-4 text-sm font-medium" style={{ color: '#7A2E2E' }}>Đang tải tạp chí...</p>
    </div>
  ),
})

function readCorpus(slug: string): Corpus | null {
  const corpusPath = path.join(process.cwd(), 'public', 'data', 'issues', slug, 'corpus.json')
  if (!fs.existsSync(corpusPath)) return null
  try {
    return JSON.parse(fs.readFileSync(corpusPath, 'utf-8')) as Corpus
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const corpus = readCorpus(params.slug)
  if (!corpus) return { title: 'Không tìm thấy số tạp chí' }
  return {
    title: `${corpus.issue.name} | ${corpus.issue.title}`,
    description: `Đọc ${corpus.issue.title} — ${corpus.issue.name}`,
  }
}

export const dynamicParams = true
// corpus.json chỉ thay đổi khi deploy số mới
export const revalidate = false

export default function LibraryReaderPage({ params }: Props) {
  const corpus = readCorpus(params.slug)
  if (!corpus) notFound()
  return <KindleReader corpus={corpus!} issueId={params.slug} />
}
