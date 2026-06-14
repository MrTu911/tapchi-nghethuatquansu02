import { SERIF, SANS } from './types'

export const getStyles = (settings: { dark: boolean }, C: Record<string, string>) => `
  .ntqs-root * { box-sizing: border-box; }

  /* Reader Scrollbar */
  .ntqs-root *::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .ntqs-root *::-webkit-scrollbar-track {
    background: transparent;
  }
  .ntqs-root *::-webkit-scrollbar-thumb {
    background: ${settings.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
    border-radius: 4px;
  }
  .ntqs-root *::-webkit-scrollbar-thumb:hover {
    background: ${settings.dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'};
  }

  .ntqs-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: ${settings.dark ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)' : 'linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.05) 100%)'};
    backdrop-filter: blur(48px) saturate(140%);
    -webkit-backdrop-filter: blur(48px) saturate(140%);
    box-shadow: ${settings.dark ? 'inset 0 1px 1px rgba(255, 255, 255, 0.1), inset 0 -1px 1px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.7), inset 0 -1px 1px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(58, 42, 38, 0.03), 0 8px 16px rgba(58, 42, 38, 0.05)'};
    border: 1px solid ${settings.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'};
    border-bottom-color: ${settings.dark ? 'rgba(0,0,0,0.4)' : 'rgba(0, 0, 0, 0.05)'};
    border-right-color: ${settings.dark ? 'rgba(0,0,0,0.4)' : 'rgba(0, 0, 0, 0.05)'};
    border-radius: 999px;
    color: ${C.text};
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    font-family: ${SANS};
    transition: all .2s ease;
  }
  .ntqs-back:hover {
    background: ${settings.dark ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)' : 'linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.2) 100%)'};
    box-shadow: ${settings.dark ? 'inset 0 1px 2px rgba(255, 255, 255, 0.2), inset 0 -1px 1px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.4)' : 'inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -1px 1px rgba(0, 0, 0, 0.01), 0 4px 12px rgba(58, 42, 38, 0.05)'};
  }
  .ntqs-back:active {
    background: ${settings.dark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)'};
    box-shadow: ${settings.dark ? 'inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 2px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.4), 0 2px 4px rgba(58, 42, 38, 0.02)'};
  }

  .ntqs-font-group {
    display: inline-flex;
    align-items: center;
    background: ${settings.dark ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)' : 'linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.05) 100%)'};
    backdrop-filter: blur(48px) saturate(140%);
    -webkit-backdrop-filter: blur(48px) saturate(140%);
    box-shadow: ${settings.dark ? 'inset 0 1px 1px rgba(255, 255, 255, 0.1), inset 0 -1px 1px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.7), inset 0 -1px 1px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(58, 42, 38, 0.03), 0 8px 16px rgba(58, 42, 38, 0.05)'};
    border: 1px solid ${settings.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'};
    border-bottom-color: ${settings.dark ? 'rgba(0,0,0,0.4)' : 'rgba(0, 0, 0, 0.05)'};
    border-right-color: ${settings.dark ? 'rgba(0,0,0,0.4)' : 'rgba(0, 0, 0, 0.05)'};
    border-radius: 999px;
    height: 38px;
    overflow: hidden;
  }
  .ntqs-font-btn {
    background: transparent;
    border: none;
    color: ${C.text};
    font-size: 16px;
    font-weight: 700;
    font-family: ${SANS};
    height: 100%;
    padding: 0 16px;
    cursor: pointer;
    transition: all .2s ease;
  }
  .ntqs-font-btn:hover { background: ${settings.dark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.4)'}; }
  .ntqs-font-btn:active { background: ${settings.dark ? 'rgba(0,0,0,.2)' : 'rgba(0,0,0,.04)'}; }
  .ntqs-font-pct {
    font-size: 13px;
    color: ${C.muted};
    min-width: 46px;
    text-align: center;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  .ntqs-icon-btn {
    background: ${settings.dark ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)' : 'linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.05) 100%)'};
    backdrop-filter: blur(48px) saturate(140%);
    -webkit-backdrop-filter: blur(48px) saturate(140%);
    box-shadow: ${settings.dark ? 'inset 0 1px 1px rgba(255, 255, 255, 0.1), inset 0 -1px 1px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.7), inset 0 -1px 1px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(58, 42, 38, 0.03), 0 8px 16px rgba(58, 42, 38, 0.05)'};
    border: 1px solid ${settings.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'};
    border-bottom-color: ${settings.dark ? 'rgba(0,0,0,0.4)' : 'rgba(0, 0, 0, 0.05)'};
    border-right-color: ${settings.dark ? 'rgba(0,0,0,0.4)' : 'rgba(0, 0, 0, 0.05)'};
    border-radius: 999px;
    padding: 8px 12px;
    color: ${C.text};
    font-size: 18px;
    cursor: pointer;
    min-width: 38px;
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all .2s ease;
  }
  .ntqs-icon-btn:hover {
    background: ${settings.dark ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)' : 'linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.2) 100%)'};
    box-shadow: ${settings.dark ? 'inset 0 1px 2px rgba(255, 255, 255, 0.2), inset 0 -1px 1px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.4)' : 'inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -1px 1px rgba(0, 0, 0, 0.01), 0 4px 12px rgba(58, 42, 38, 0.05)'};
  }
  .ntqs-icon-btn:active {
    background: ${settings.dark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)'};
    box-shadow: ${settings.dark ? 'inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 2px 4px rgba(0,0,0,0.1)' : 'inset 0 1px 1px rgba(255, 255, 255, 0.4), 0 2px 4px rgba(58, 42, 38, 0.02)'};
  }

  /* TOC */
  .ntqs-toc-heading {
    font-size: 14px;
    font-weight: 700;
    color: ${C.accent};
    letter-spacing: 2px;
    margin: 0 auto 16px;
    padding: 8px 24px;
    width: fit-content;
    text-align: center;
    background: ${settings.dark ? 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)' : 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)'};
    backdrop-filter: blur(40px) saturate(120%);
    -webkit-backdrop-filter: blur(40px) saturate(120%);
    border-radius: 999px;
    border: 1px solid ${settings.dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.2)'};
    border-top: 1px solid ${settings.dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'};
    box-shadow: 0 8px 32px ${settings.dark ? 'rgba(0,0,0,0.4)' : 'rgba(58,42,38,0.08)'};
  }
  .ntqs-toc-cover {
    display: block;
    width: 100%;
    background: ${settings.dark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)'};
    border: 1px solid ${C.border};
    border-radius: 8px;
    padding: 12px 14px;
    color: ${C.text};
    font-family: ${SANS};
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: background .15s;
  }
  .ntqs-toc-cover.is-active {
    background: ${settings.dark ? 'rgba(212,147,126,.1)' : 'rgba(122,46,46,.08)'};
    border-color: ${C.accent}66;
    border-left: 3px solid ${C.accent};
    padding-left: 12px;
  }
  .ntqs-toc-cover:hover { background: ${settings.dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}; }
  .ntqs-toc-cover-label {
    font-weight: 500;
    color: ${C.text};
  }

  .ntqs-toc-section {
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 1.2px;
    color: ${C.accent};
    margin: 16px 0 0;
    padding: 12px 14px;
    line-height: 1.45;
    background: ${settings.dark ? 'rgba(212,147,126,.06)' : 'rgba(122,46,46,.06)'};
    border: 1px solid ${C.border};
    border-radius: 8px;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: background .2s;
  }
  .ntqs-toc-section:hover {
    background: ${settings.dark ? 'rgba(212,147,126,.1)' : 'rgba(122,46,46,.1)'};
  }
  .ntqs-toc-section.is-active {
    background: ${settings.dark ? 'rgba(212,147,126,.12)' : 'rgba(122,46,46,.12)'};
    border-color: ${C.accent}40;
  }
  .ntqs-toc-arrow {
    color: ${C.accent};
    font-size: 10px;
    flex-shrink: 0;
    width: 10px;
  }
  .ntqs-toc-section-label { flex: 1; text-align: justify; hyphens: auto; text-transform: uppercase; }
  .ntqs-toc-count {
    background: ${settings.dark ? 'rgba(212,147,126,.15)' : 'rgba(122,46,46,.12)'};
    color: ${C.accent};
    font-size: 11px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 999px;
    letter-spacing: 0;
    flex-shrink: 0;
  }

  .ntqs-toc-art {
    padding: 16px;
    margin-bottom: 8px;
    border-radius: 16px;
    cursor: pointer;
    background: ${settings.dark ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 100%)'};
    backdrop-filter: blur(40px) saturate(120%);
    -webkit-backdrop-filter: blur(40px) saturate(120%);
    border-top: 1px solid ${settings.dark ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.15)'};
    border-left: 1px solid ${settings.dark ? 'rgba(255,255,255,0.03)' : 'rgba(255, 255, 255, 0.1)'};
    border-bottom: 1px solid ${settings.dark ? 'rgba(0,0,0,0.2)' : 'rgba(0, 0, 0, 0.04)'};
    border-right: 1px solid ${settings.dark ? 'rgba(0,0,0,0.2)' : 'rgba(0, 0, 0, 0.04)'};
    box-shadow: 0 8px 24px ${settings.dark ? 'rgba(0,0,0,0.2)' : 'rgba(58,42,38,0.04)'};
    backface-visibility: hidden;
    transform: translateZ(0);
    transition: all .2s ease;
  }
  .ntqs-toc-art:hover {
    background: ${settings.dark ? 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 100%)'};
    border-top: 1px solid ${settings.dark ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.4)'};
    border-left: 1px solid ${settings.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255, 255, 255, 0.2)'};
    box-shadow: ${settings.dark ? '0 12px 32px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1)' : '0 12px 32px rgba(58, 42, 38, 0.1), inset 0 1px 2px rgba(255,255,255,0.8)'};
  }
  .ntqs-toc-art.is-active {
    padding: 16px 16px 16px 12px;
    background: ${settings.dark ? 'linear-gradient(135deg, rgba(212,147,126,0.1) 0%, rgba(212,147,126,0.02) 100%)' : 'linear-gradient(135deg, rgba(122,46,46,0.12) 0%, rgba(122,46,46,0.03) 100%)'};
    backdrop-filter: blur(40px) saturate(130%);
    -webkit-backdrop-filter: blur(40px) saturate(130%);
    border-left: 3px solid ${settings.dark ? 'rgba(212,147,126,0.4)' : 'rgba(122,46,46,0.4)'};
    border-top: 1px solid ${settings.dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'};
    border-right: 1px solid ${settings.dark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)'};
    border-bottom: 1px solid ${settings.dark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.06)'};
    box-shadow: 0 12px 32px ${settings.dark ? 'rgba(0,0,0,0.3)' : 'rgba(122,46,46,0.08)'};
    backface-visibility: hidden;
    transform: translateZ(0);
  }
  .ntqs-toc-art.is-active:hover {
    background: ${settings.dark ? 'linear-gradient(135deg, rgba(212,147,126,0.15) 0%, rgba(212,147,126,0.04) 100%)' : 'linear-gradient(135deg, rgba(122, 46, 46, 0.22) 0%, rgba(122, 46, 46, 0.06) 100%)'};
    box-shadow: ${settings.dark ? '0 16px 36px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)' : '0 16px 36px rgba(122, 46, 46, 0.14), inset 0 1px 1px rgba(255,255,255,0.5)'};
  }
  .ntqs-toc-art-num {
    font-family: ${SERIF};
    font-size: 15px;
    font-weight: 700;
    color: ${C.accent};
    margin-bottom: 6px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .ntqs-toc-art-title {
    font-family: ${SANS};
    font-size: 13px;
    font-weight: 700;
    color: ${C.text};
    line-height: 1.45;
    margin-bottom: 6px;
    text-align: justify;
    hyphens: auto;
  }
  .ntqs-toc-art.is-active .ntqs-toc-art-title { color: ${C.accent}; }
  .ntqs-toc-art-author {
    font-family: ${SERIF};
    font-style: italic;
    font-size: 11.5px;
    color: ${C.muted};
    line-height: 1.4;
  }

  /* Nav arrows */
  .ntqs-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: ${settings.dark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.25)'};
    border: 1px solid ${C.border};
    color: ${C.accent};
    font-size: 16px;
    line-height: 1;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    backdrop-filter: blur(14px) saturate(180%);
    -webkit-backdrop-filter: blur(14px) saturate(180%);
    box-shadow: 0 4px 12px rgba(0,0,0,.06);
    transition: background .2s, transform .15s, opacity .3s, border-color .2s;
  }
  .ntqs-nav-prev { left: 4px; }
  .ntqs-nav-next { right: 4px; }
  .ntqs-nav:hover {
    background: ${settings.dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.4)'};
    transform: translateY(-50%) scale(1.06);
    border-color: ${C.accent}66;
  }
  .ntqs-nav:active { transform: translateY(-50%) scale(0.96); }

  /* Page indicator */
  .ntqs-pageind {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-family: ${SERIF};
    font-style: italic;
    font-size: 12px;
    color: ${C.muted};
    z-index: 5;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }

  /* Article typography (inside multi-column) */
  .ntqs-art-header {
    margin-bottom: 18px;
  }
  .ntqs-art-section-line {
    font-family: ${SANS};
    font-size: 0.9em;
    font-weight: 700;
    letter-spacing: 1.2px;
    color: ${C.accent};
    margin-bottom: 18px;
    line-height: 1.5;
    text-transform: uppercase;
    text-align: justify;
    hyphens: auto;
  }
  .ntqs-art-title {
    font-family: ${SERIF};
    font-size: 1.65em;
    font-weight: 700;
    color: ${C.accent};
    margin: 0 0 22px;
    line-height: 1.35;
    letter-spacing: 0.5px;
    text-align: justify;
    break-inside: avoid;
  }
  .ntqs-art-author {
    font-family: ${SERIF};
    font-style: italic;
    font-size: 0.95em;
    color: ${C.text};
    margin: 0 0 4px;
    line-height: 1.5;
    break-inside: avoid;
  }
  .ntqs-art-author-name {
    font-style: normal;
    font-weight: 700;
  }
  .ntqs-art-affil {
    font-family: ${SERIF};
    font-style: italic;
    font-size: 0.88em;
    color: ${C.muted};
    margin: 0 0 18px;
    line-height: 1.5;
    break-inside: avoid;
  }
  .ntqs-art-divider {
    height: 1px;
    background: ${C.border};
    margin: 22px 0;
    break-inside: avoid;
  }
  .ntqs-abstract {
    background: ${settings.dark ? 'rgba(212,147,126,.06)' : 'rgba(122,46,46,.06)'};
    border-left: 3px solid ${C.accent};
    padding: 18px 22px;
    margin: 0 0 22px;
    border-radius: 4px;
  }
  .ntqs-abstract-label {
    font-family: ${SANS};
    font-size: 11.5px;
    letter-spacing: 2px;
    color: ${C.accent};
    font-weight: 700;
    margin-bottom: 12px;
  }
  .ntqs-abstract-text {
    font-family: ${SERIF};
    font-style: italic;
    font-size: 1em;
    line-height: 1.65;
    color: ${C.text};
    text-align: justify;
    margin: 0;
  }
  .ntqs-keywords {
    display: block;
    margin: 0 0 22px;
    line-height: 2.15;
  }
  .ntqs-keywords-label {
    display: inline-block;
    font-family: ${SANS};
    font-size: 11px;
    letter-spacing: 1.2px;
    color: ${C.accent};
    font-weight: 700;
    margin-right: 5px;
  }
  .ntqs-pill {
    display: inline-flex;
    align-items: center;
    background: ${C.pillBg};
    color: ${C.text};
    font-family: ${SANS};
    font-size: 12px;
    padding: 2px 9px;
    line-height: 1.35;
    margin: 0 4px 6px 0;
    border-radius: 999px;
    transition: background .15s;
  }
  .ntqs-pill:hover { background: ${C.pillHover}; }

  .ntqs-body p {
    margin: 0;
    text-align: justify;
    text-indent: 1.8em;
    hyphens: auto;
    color: ${C.text};
    orphans: 1;
    widows: 1;
  }
  .ntqs-cite {
    display: inline;
    white-space: nowrap;
    font-size: 0.75em;
    vertical-align: super;
    line-height: 0;
    color: ${C.accent};
    font-weight: 600;
  }
  .ntqs-body h2 {
    font-family: ${SERIF};
    font-size: 1.1em;
    font-weight: 700;
    color: ${C.text};
    margin: 1.4em 0 0.6em;
    break-inside: avoid;
  }

  /* Drop cap on first paragraph */
  .ntqs-body .ntqs-first-para {
    text-indent: 0;
    orphans: 3;
  }
  .ntqs-body .ntqs-first-para:first-letter {
    font-family: ${SERIF};
    font-size: 3.6em;
    font-weight: 700;
    float: left;
    line-height: 0.85;
    margin: 0.08em 0.06em 0 0;
    color: ${C.accent};
  }

  .ntqs-refs {
    margin-top: 30px;
    padding-top: 18px;
    border-top: 1px solid ${C.border};
  }
  .ntqs-refs h3 {
    font-family: ${SANS};
    font-size: 12px;
    letter-spacing: 1.8px;
    color: ${C.accent};
    font-weight: 700;
    margin: 0 0 14px;
    break-after: avoid;
  }
  .ntqs-refs ol {
    padding-left: 22px;
    margin: 0;
  }
  .ntqs-refs li {
    font-family: ${SERIF};
    font-size: 0.95em;
    line-height: 1.6;
    margin-bottom: 8px;
    color: ${C.text};
    text-align: justify;
  }

  /* View Transitions for cross-article sliding */
  .ntqs-reader-paper {
    view-transition-name: reader-paper;
  }
  
  ::view-transition-old(reader-paper),
  ::view-transition-new(reader-paper) {
    animation-duration: 0.42s;
    animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1);
  }

  html[data-vt-dir="next"] ::view-transition-old(reader-paper) { animation-name: vt-out-left; }
  html[data-vt-dir="next"] ::view-transition-new(reader-paper) { animation-name: vt-in-right; }
  
  html[data-vt-dir="prev"] ::view-transition-old(reader-paper) { animation-name: vt-out-right; }
  html[data-vt-dir="prev"] ::view-transition-new(reader-paper) { animation-name: vt-in-left; }

  @keyframes vt-out-left { to { transform: translateX(-60px); opacity: 0; } }
  @keyframes vt-in-right { from { transform: translateX(60px); opacity: 0; } }
  @keyframes vt-out-right { to { transform: translateX(60px); opacity: 0; } }
  @keyframes vt-in-left { from { transform: translateX(-60px); opacity: 0; } }
`
