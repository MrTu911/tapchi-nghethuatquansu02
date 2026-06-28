import type { CorpusArticle } from '@/types/corpus'

export default function Article({ article, C, issueId }: { article: CorpusArticle; C: Record<string, string>; issueId: string }) {
  const titleFull = [article.title.main, article.title.subtitle].filter(Boolean).join(' ')
  const sectionLine = article.section_header || article.section
  
  // Dynamically calculate the actual maximum citation number from the references list
  let maxRef = article.references.length
  if (article.references.length > 0) {
    const allNums = article.references.flatMap(ref => {
      const match = ref.match(/^[\d\s,và\-–]+/);
      if (!match) return [];
      const nums = match[0].match(/\d+/g);
      return nums ? nums.map(n => parseInt(n)) : [];
    });
    if (allNums.length > 0) {
      maxRef = Math.max(...allNums);
    }
  }

  return (
    <>
      {/* HEADER + ABSTRACTS — single wrapper keeps them in the same column */}
      <div style={{ breakInside: 'avoid' }}>

        {/* HEADER BLOCK — section line + title + authors */}
        <div className="ntqs-art-header">
          {sectionLine && (
            <div className="ntqs-art-section-line">{sectionLine}</div>
          )}

          <h1 className="ntqs-art-title">{titleFull}</h1>

          {article.authors.map((a, i) => (
            <div key={i}>
              <p className="ntqs-art-author">
                {[a.rank, a.degree].filter(Boolean).join(', ')}
                {(a.rank || a.degree) ? ' ' : ''}
                <span className="ntqs-art-author-name">{a.name}</span>
              </p>
              {a.affiliation && (
                <p className="ntqs-art-affil">{a.affiliation}</p>
              )}
            </div>
          ))}
        </div>

        {/* VI ABSTRACT */}
        {article.abstract.vi && (
          <div className="ntqs-abstract">
            <div className="ntqs-abstract-label">Tóm tắt</div>
            <p className="ntqs-abstract-text">{article.abstract.vi}</p>
            {article.keywords.vi.length > 0 && (
              <div className="ntqs-keywords" style={{ marginTop: 12, marginBottom: 0 }}>
                <span className="ntqs-keywords-label">Từ khóa:</span>
                {article.keywords.vi.map((kw, i) => (
                  <span key={i} className="ntqs-pill">{kw}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EN ABSTRACT */}
        {article.abstract.en && (
          <div className="ntqs-abstract">
            <div className="ntqs-abstract-label">Abstract</div>
            <p className="ntqs-abstract-text">{article.abstract.en}</p>
            {article.keywords.en.length > 0 && (
              <div className="ntqs-keywords" style={{ marginTop: 12, marginBottom: 0 }}>
                <span className="ntqs-keywords-label">Keywords:</span>
                {article.keywords.en.map((kw, i) => (
                  <span key={i} className="ntqs-pill">{kw}</span>
                ))}
              </div>
            )}
          </div>
        )}

      </div>{/* end header+abstracts wrapper */}

      {/* BODY */}
      <div className="ntqs-body">
        {article.body.paragraphs.filter(p => p.text && p.text.trim().length > 0).map((p, i) =>
          p.type === 'h2' ? (
            <h2 key={i}>{p.text}</h2>
          ) : (
            <p key={i} className={i === 0 ? 'ntqs-first-para' : ''}>
              <span dangerouslySetInnerHTML={{ 
                __html: p.text
                  .replace(/(?<![a-zA-Zà-ỹđĐ\p{L}\p{M}])(m|cm|dm|mm|km)(2|3)\b/gu, '$1<sup class="ntqs-unit">$2</sup>')
                  .replace(/\[(\d{1,3})\]/g, (match, num) => {
                    return (maxRef > 0 && parseInt(num) > 0 && parseInt(num) <= maxRef) 
                      ? `<sup class="ntqs-cite">[${num}]</sup>` 
                      : match
                  })
                  .replace(/([a-zA-Zà-ỹđĐ\p{Ll}\p{M}\)\]”"’'“‘]+[.,;:”"’'“‘]?)(\d{1,3})([\.,;:\s\)\]”"’'“‘]|$)/gu, (match, prefix, num, suffix, offset, string) => {
                    // Find the start of the word containing this match
                    let start = offset;
                    while (start > 0 && !/\s/.test(string[start - 1])) {
                      start--;
                    }
                    // The word end is exactly the end of the digit (prefix + num)
                    const end = offset + prefix.length + num.length;
                    
                    // Extract the word and clean it of leading/trailing punctuation/quotes/parentheses
                    const fullWord = string.slice(start, end).replace(/^[.,;:?!”"’'“‘\(\[\s]+|[.,;:?!”"’'“‘\)\]\s]+$/g, '');
                    
                    // Remove any trailing punctuation from the prefix for length/character checks
                    const cleanPrefix = prefix.replace(/[.,;:?!”"’'“‘\(\)\[\]\s]+$/g, '');
                    
                    // A word is a model designation / military code if:
                    // 1. It contains a hyphen (e.g., Su-30MK2, B-52)
                    // 2. It contains another digit before the matched digit (e.g., M1A2)
                    // 3. The letter prefix before the digit is only 1 character long (e.g., K1, K2, d1, c2, b3, a4, T34, F9, A1)
                    // 4. The letter prefix contains any uppercase letters (e.g., Su30, AK47, RPG7, Kh29, Mi8, Ka52)
                    const isModel = 
                      /[-]/.test(fullWord) || 
                      (/\d/.test(fullWord.slice(0, fullWord.length - num.length))) ||
                      (cleanPrefix.length === 1) ||
                      (cleanPrefix !== cleanPrefix.toLowerCase());
                    
                    if (isModel) {
                      return match; // Keep as is, do not superscript
                    }
                    
                    return (maxRef > 0 && parseInt(num) > 0 && parseInt(num) <= maxRef)
                      ? `${prefix}<sup class="ntqs-cite">${num}</sup>${suffix}`
                      : match
                  })
              }} />
            </p>
          )
        )}
      </div>

      {/* REFERENCES */}
      {article.references.length > 0 && (
        <div className="ntqs-refs">
          <h3>Tài liệu tham khảo</h3>
          <ol>
            {article.references.map((ref, i) => (
              <li key={i}>{ref}</li>
            ))}
          </ol>
        </div>
      )}

      {/* PDF BUTTON */}
      {article.pdf_path && (
        <div style={{ marginTop: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>
          <a
            href={`/data/issues/${issueId}/${article.pdf_path}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 16px',
              color: C.accent,
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: `1px solid ${C.accent}`,
              borderRadius: '4px',
              opacity: 0.75,
              transition: 'all 0.2s ease',
            }}
            onMouseOver={e => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.backgroundColor = 'rgba(139, 69, 19, 0.05)'
            }}
            onMouseOut={e => {
              e.currentTarget.style.opacity = '0.75'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg style={{ width: 16, height: 16, marginRight: 8 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Đọc PDF bản gốc
          </a>
        </div>
      )}
    </>
  )
}
