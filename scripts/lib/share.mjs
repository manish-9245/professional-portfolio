export function buildShareBlocks({ pageUrl, title, noun = "post" }) {
  const shareActionsHtml = `
      <h2>Share this ${noun}</h2>
      <div class="blog-share-actions">
        <a class="blog-share-link share-linkedin" aria-label="Share on LinkedIn" title="Share on LinkedIn" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}">
          <svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          <span>LinkedIn</span>
        </a>
        <a class="blog-share-link share-x" aria-label="Share on X" title="Share on X" target="_blank" rel="noopener noreferrer" href="https://x.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(title)}">
          <svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.78-6.24L6.66 22H3.55l7.24-8.27L1 2h6.25l4.32 5.7L18.9 2zm-1.07 18h1.69L6.33 3.9H4.52L17.83 20z"/></svg>
          <span>X</span>
        </a>
        <a class="blog-share-link share-whatsapp" aria-label="Share on WhatsApp" title="Share on WhatsApp" target="_blank" rel="noopener noreferrer" href="https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + pageUrl)}">
          <svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.187-1.622c1.763.961 3.746 1.469 5.758 1.471h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          <span>WhatsApp</span>
        </a>
        <a class="blog-share-link share-reddit" aria-label="Share on Reddit" title="Share on Reddit" target="_blank" rel="noopener noreferrer" href="https://www.reddit.com/submit?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(title)}">
          <svg class="blog-share-icon" viewBox="0 0 24 24"><path d="M24 11.5c0-1.65-1.35-3-3-3-.41 0-.79.08-1.14.24-1.64-1.14-3.85-1.88-6.28-1.97l1.08-5.08 3.53.75c.05.83.74 1.5 1.57 1.5 0.86 0 1.56-.7 1.56-1.56s-.7-1.56-1.56-1.56c-.63 0-1.18.38-1.42.92l-3.92-.83c-.19-.04-.38.07-.44.26l-1.21 5.7c-2.43.09-4.64.83-6.28 1.97-.35-.16-.73-.24-1.14-.24-1.65 0-3 1.35-3 3 0 1.25.77 2.32 1.86 2.77-.04.24-.06.48-.06.73 0 3.31 3.58 6 8 6s8-2.69 8-6c0-.25-.02-.49-.06-.73 1.09-.45 1.86-1.52 1.86-2.77zm-18 0c0-.83.67-1.5 1.5-1.5.31 0 .59.1.82.26-1.04.77-1.74 1.83-2.02 3.01-.18-.08-.3-.26-.3-.45v-1.32zm10 5.5c-1.3 1.3-3.7 1.3-5 0-.15-.15-.15-.39 0-.54s.39-.15.54 0c1 1 3.2 1 4.2 0 .15-.15.39-.15.54 0s.15.39 0 .54zm.32-2.23c-.28-1.18-.98-2.24-2.02-3.01.23-.16.51-.26.82-.26 0.83 0 1.5.67 1.5 1.5 0 .19-.12.37-.3.45v1.32zm3.32-3.27c0 .19-.12.37-.3.45v-1.32c0-.83.67-1.5 1.5-1.5.83 0 1.5.67 1.5 1.5s-1.35 3-3 3c-.41 0-.79-.08-1.14-.24z"/></svg>
          <span>Reddit</span>
        </a>
        <button type="button" class="blog-share-copy share-copy" aria-label="Copy link" title="Copy link" data-share-copy data-url="${pageUrl}">
          <svg class="blog-share-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          <span>Copy Link</span>
        </button>
      </div>`;

  const floatingShareHtml = `
      <div class="floating-share" id="floating-share">
        <div class="floating-share-menu">
          <a class="floating-share-item share-linkedin" title="LinkedIn" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
          <a class="floating-share-item share-x" title="X" target="_blank" rel="noopener noreferrer" href="https://x.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(title)}">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.77 7.74L23 22h-6.1l-4.78-6.24L6.66 22H3.55l7.24-8.27L1 2h6.25l4.32 5.7L18.9 2zm-1.07 18h1.69L6.33 3.9H4.52L17.83 20z"/></svg>
          </a>
          <a class="floating-share-item share-whatsapp" title="WhatsApp" target="_blank" rel="noopener noreferrer" href="https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + pageUrl)}">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.187-1.622c1.763.961 3.746 1.469 5.758 1.471h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>
          <button type="button" class="floating-share-item share-copy" title="Copy Link" data-share-copy data-url="${pageUrl}">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          </button>
        </div>
        <button type="button" class="floating-share-trigger" aria-label="Share ${noun}">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        </button>
      </div>`;

  return { shareActionsHtml, floatingShareHtml };
}
