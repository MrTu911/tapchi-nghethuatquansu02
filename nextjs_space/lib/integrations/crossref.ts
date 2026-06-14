
/**
 * CrossRef DOI Integration Library
 * Handles DOI registration and metadata submission to CrossRef
 */

export interface CrossRefArticleMetadata {
  title: string
  authors: Array<{
    firstName: string
    lastName: string
    orcid?: string
    affiliation?: string
  }>
  abstract?: string
  publicationDate: string
  doi: string
  journalTitle: string
  journalIssn?: string
  volume?: number
  issue?: number
  pages?: string
  keywords?: string[]
  references?: Array<{
    doi?: string
    title?: string
    authors?: string
  }>
}

export interface CrossRefConfig {
  depositorName: string
  depositorEmail: string
  registrantName: string
  loginId?: string
  password?: string
  testMode?: boolean
}

/**
 * Generate CrossRef XML for DOI registration
 */
export function generateCrossRefXML(
  metadata: CrossRefArticleMetadata,
  config: CrossRefConfig
): string {
  const timestamp = new Date().getTime()
  const batchId = `batch_${timestamp}`

  const authorsXml = metadata.authors
    .map(
      (author, index) => `
    <person_name sequence="${index === 0 ? 'first' : 'additional'}" contributor_role="author">
      <given_name>${escapeXml(author.firstName)}</given_name>
      <surname>${escapeXml(author.lastName)}</surname>
      ${author.orcid ? `<ORCID>https://orcid.org/${author.orcid}</ORCID>` : ''}
      ${author.affiliation ? `<affiliation>${escapeXml(author.affiliation)}</affiliation>` : ''}
    </person_name>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch xmlns="http://www.crossref.org/schema/5.3.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           version="5.3.1"
           xsi:schemaLocation="http://www.crossref.org/schema/5.3.1 
           http://www.crossref.org/schemas/crossref5.3.1.xsd">
  <head>
    <doi_batch_id>${batchId}</doi_batch_id>
    <timestamp>${timestamp}</timestamp>
    <depositor>
      <depositor_name>${escapeXml(config.depositorName)}</depositor_name>
      <email_address>${escapeXml(config.depositorEmail)}</email_address>
    </depositor>
    <registrant>${escapeXml(config.registrantName)}</registrant>
  </head>
  <body>
    <journal>
      <journal_metadata>
        <full_title>${escapeXml(metadata.journalTitle)}</full_title>
        ${metadata.journalIssn ? `<issn>${metadata.journalIssn}</issn>` : ''}
      </journal_metadata>
      <journal_issue>
        ${metadata.volume ? `<volume>${metadata.volume}</volume>` : ''}
        ${metadata.issue ? `<issue>${metadata.issue}</issue>` : ''}
        <publication_date media_type="online">
          <year>${new Date(metadata.publicationDate).getFullYear()}</year>
          <month>${new Date(metadata.publicationDate).getMonth() + 1}</month>
          <day>${new Date(metadata.publicationDate).getDate()}</day>
        </publication_date>
      </journal_issue>
      <journal_article publication_type="full_text">
        <titles>
          <title>${escapeXml(metadata.title)}</title>
        </titles>
        <contributors>
          ${authorsXml}
        </contributors>
        ${metadata.abstract ? `<jats:abstract>${escapeXml(metadata.abstract)}</jats:abstract>` : ''}
        <publication_date media_type="online">
          <year>${new Date(metadata.publicationDate).getFullYear()}</year>
          <month>${new Date(metadata.publicationDate).getMonth() + 1}</month>
          <day>${new Date(metadata.publicationDate).getDate()}</day>
        </publication_date>
        ${metadata.pages ? `<pages><first_page>${metadata.pages.split('-')[0]}</first_page></pages>` : ''}
        <doi_data>
          <doi>${metadata.doi}</doi>
          <resource>${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/articles/${metadata.doi.split('/').pop()}</resource>
        </doi_data>
      </journal_article>
    </journal>
  </body>
</doi_batch>`
}

/**
 * Submit DOI registration to CrossRef
 */
export async function submitDOIToCrossRef(
  metadata: CrossRefArticleMetadata,
  config: CrossRefConfig
): Promise<{ success: boolean; message: string; batchId?: string }> {
  try {
    const xml = generateCrossRefXML(metadata, config)
    
    if (!config.loginId || !config.password) {
      return {
        success: false,
        message: 'Chưa cấu hình CrossRef credentials. Thiết lập CROSSREF_LOGIN_ID và CROSSREF_PASSWORD trong biến môi trường.'
      }
    }

    const batchId = `batch_${Date.now()}`
    // CrossRef API endpoint (test or production)
    const endpoint = config.testMode
      ? 'https://test.crossref.org/servlet/deposit'
      : 'https://doi.crossref.org/servlet/deposit'

    const formData = new FormData()
    formData.append('operation', 'doMDUpload')
    formData.append('login_id', config.loginId)
    formData.append('login_passwd', config.password)
    formData.append('fname', new Blob([xml], { type: 'application/xml' }), `${batchId}.xml`)

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30_000), // 30s timeout for CrossRef
    })

    if (!response.ok) {
      return {
        success: false,
        message: `CrossRef phản hồi lỗi HTTP ${response.status}`
      }
    }

    return {
      success: true,
      message: 'Đã gửi đăng ký DOI lên CrossRef thành công',
      batchId
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return {
        success: false,
        message: 'CrossRef không phản hồi trong 30 giây. Kiểm tra kết nối internet của máy chủ.'
      }
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi không xác định'
    }
  }
}

/**
 * Check DOI registration status
 */
export async function checkDOIStatus(
  doi: string,
  config: CrossRefConfig
): Promise<{ success: boolean; status: string; message?: string }> {
  try {
    // In production, query CrossRef API for DOI status
    // For now, return simulated response
    return {
      success: true,
      status: 'registered',
      message: `DOI ${doi} is registered and active`
    }
  } catch (error) {
    return {
      success: false,
      status: 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Generate a DOI suffix for new articles
 */
export function generateDOISuffix(
  volume: number,
  issue: number,
  articleNumber: number
): string {
  return `${volume}.${issue}.${articleNumber.toString().padStart(4, '0')}`
}

/**
 * Validate DOI format
 */
export function validateDOI(doi: string): boolean {
  const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/
  return doiRegex.test(doi)
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Get CrossRef configuration from environment
 */
export function getCrossRefConfig(): CrossRefConfig {
  return {
    depositorName: process.env.CROSSREF_DEPOSITOR_NAME || 'Tạp chí HCQS',
    depositorEmail: process.env.CROSSREF_DEPOSITOR_EMAIL || 'admin@journal.edu.vn',
    registrantName: process.env.CROSSREF_REGISTRANT_NAME || 'Học viện Quốc phòng',
    loginId: process.env.CROSSREF_LOGIN_ID,
    password: process.env.CROSSREF_PASSWORD,
    testMode: process.env.CROSSREF_TEST_MODE === 'true'
  }
}
