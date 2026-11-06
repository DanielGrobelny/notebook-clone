export const sourceLimits = {
  maxFileBytes: 5 * 1024 * 1024,
  maxTextCharacters: 500000,
  maxPages: 100,
  maxChunks: 1000,
  chunkCharacters: 1800,
};
export class PdfRuntimeError extends Error {
  readonly status = 503;
  readonly code = 'pdf_parser_unavailable';
  constructor() {
    super('Die PDF-Verarbeitung ist serverseitig nicht verfügbar. Bitte später erneut versuchen.');
  }
}
export type Extracted = {
  text: string;
  sections: Array<{ text: string; page: number | null; section: string | null }>;
};
const allowed = new Map([
  ['text/plain', 'txt'],
  ['text/markdown', 'md'],
  ['application/pdf', 'pdf'],
]);
export function safeFilename(name: string) {
  const clean = name
    .normalize('NFKC')
    .replace(/[^a-zA-Z0-9._ -]/g, '_')
    .replace(/\.{2,}/g, '.')
    .trim()
    .slice(0, 120);
  return clean || 'source';
}
export function detectType(file: File) {
  const extension = file.name.toLowerCase().split('.').pop();
  const mime = file.type.toLowerCase();
  if (mime && allowed.has(mime)) return mime;
  if (extension === 'txt') return 'text/plain';
  if (extension === 'md' || extension === 'markdown') return 'text/markdown';
  if (extension === 'pdf') return 'application/pdf';
  return null;
}
function cleanText(text: string) {
  return text
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}
function assertPdf(bytes: Uint8Array) {
  if (bytes.byteLength < 5 || new TextDecoder('ascii').decode(bytes.subarray(0, 5)) !== '%PDF-')
    throw new Error('Die Datei ist kein gültiges PDF.');
}
function assertWithinTextLimit(length: number) {
  if (length > sourceLimits.maxTextCharacters) throw new Error('Der Text ist zu lang.');
}
export async function extractText(bytes: Uint8Array, mime: string): Promise<Extracted> {
  if (mime !== 'application/pdf') {
    const text = cleanText(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!text) throw new Error('Die Quelle ist leer.');
    assertWithinTextLimit(text.length);
    const sections = text
      .split(/\n(?=#{1,6}\s+)/)
      .map((part) => ({
        text: part.trim(),
        page: null,
        section: (part.match(/^#{1,6}\s+(.+)/m) || [])[1] ?? null,
      }))
      .filter((entry) => entry.text);
    return { text, sections };
  }
  assertPdf(bytes);
  let documentProxy: any;
  try {
    if (!globalThis.DOMMatrix) {
      (globalThis as any).DOMMatrix = class {
        a = 1;
        b = 0;
        c = 0;
        d = 1;
        e = 0;
        f = 0;
        constructor(values?: number[]) {
          if (values) [this.a, this.b, this.c, this.d, this.e, this.f] = values;
        }
      };
    }
    /* Explicit import ensures the worker is traced into serverless output. */ (
      globalThis as any
    ).pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const task = pdfjs.getDocument({ data: bytes.slice(), stopAtErrors: false });
    documentProxy = await task.promise;
  } catch (error: any) {
    if (error?.name === 'PasswordException') throw new Error('Dieses PDF ist passwortgeschützt.');
    if (error?.name === 'InvalidPDFException')
      throw new Error('Das PDF ist beschädigt oder kann nicht gelesen werden.');
    const message = String(error?.message ?? '');
    console.error(
      JSON.stringify({
        event: 'pdf_parser_startup_failed',
        name: String(error?.name ?? 'Error').slice(0, 40),
        workerSetup: message.includes('Setting up fake worker failed'),
        missingModule: message.includes('Cannot find module'),
        missingWorker: message.includes('pdf.worker.mjs'),
      }),
    );
    throw new PdfRuntimeError();
  }
  try {
    if (documentProxy.numPages > sourceLimits.maxPages) throw new Error('Zu viele PDF-Seiten.');
    const sections: Extracted['sections'] = [];
    let totalCharacters = 0;
    for (let pageNumber = 1; pageNumber <= documentProxy.numPages; pageNumber += 1) {
      const page = await documentProxy.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = cleanText(
        content.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .filter(Boolean)
          .join(' '),
      );
      if (pageText) {
        totalCharacters += pageText.length;
        assertWithinTextLimit(totalCharacters);
        sections.push({ text: pageText, page: pageNumber, section: null });
      }
    }
    if (!sections.length)
      throw new Error(
        'Dieses PDF enthält keinen extrahierbaren Text. Gescannte PDFs und OCR werden nicht unterstützt.',
      );
    return { text: sections.map((section) => section.text).join('\n'), sections };
  } catch (error: any) {
    if (
      error?.message === 'Zu viele PDF-Seiten.' ||
      error?.message === 'Der Text ist zu lang.' ||
      error?.message?.startsWith('Dieses PDF enthält keinen extrahierbaren Text.')
    )
      throw error;
    if (error?.name === 'InvalidPDFException')
      throw new Error('Das PDF ist beschädigt oder kann nicht gelesen werden.');
    console.error(
      JSON.stringify({
        event: 'pdf_text_extraction_failed',
        name: String(error?.name ?? 'Error').slice(0, 40),
      }),
    );
    throw new PdfRuntimeError();
  } finally {
    await documentProxy?.destroy();
  }
}
export function chunkExtracted(extracted: Extracted) {
  const chunks: Array<{
    content: string;
    position: number;
    page: number | null;
    section: string | null;
  }> = [];
  for (const entry of extracted.sections) {
    let remaining = entry.text;
    while (remaining) {
      let end = Math.min(remaining.length, sourceLimits.chunkCharacters);
      if (end < remaining.length) {
        const boundary = remaining.lastIndexOf(' ', end);
        if (boundary > 300) end = boundary;
      }
      const content = remaining.slice(0, end).trim();
      if (content)
        chunks.push({ content, position: chunks.length, page: entry.page, section: entry.section });
      if (chunks.length > sourceLimits.maxChunks)
        throw new Error('Die Quelle erzeugt zu viele Abschnitte.');
      remaining = remaining.slice(end).trimStart();
    }
  }
  return chunks;
}
export function validateText(text: string) {
  const clean = cleanText(text);
  if (!clean) throw new Error('Die Quelle ist leer.');
  assertWithinTextLimit(clean.length);
  return clean;
}
