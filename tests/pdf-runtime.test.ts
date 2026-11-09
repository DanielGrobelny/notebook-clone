import { it, expect, vi, afterEach } from 'vitest';
const m = vi.hoisted(() => ({ getDocument: vi.fn() }));
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({ getDocument: m.getDocument }));
vi.mock('pdfjs-dist/legacy/build/pdf.worker.mjs', () => ({ WorkerMessageHandler: {} }));
import { extractText, PdfRuntimeError } from '../lib/sources/import';
const bytes = new TextEncoder().encode('%PDF-1.7 test fixture');
afterEach(() => vi.restoreAllMocks());
it('reports missing server worker as 503, never damaged PDF', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  m.getDocument.mockReturnValue({
    promise: Promise.reject(
      new Error('Setting up fake worker failed: Cannot find module pdf.worker.mjs'),
    ),
  });
  await expect(extractText(bytes, 'application/pdf')).rejects.toBeInstanceOf(PdfRuntimeError);
  expect(console.error).toHaveBeenCalledWith(expect.stringContaining('"missingWorker":true'));
});
it('distinguishes actual malformed document', async () => {
  m.getDocument.mockReturnValue({
    promise: Promise.reject(Object.assign(new Error('invalid'), { name: 'InvalidPDFException' })),
  });
  await expect(extractText(bytes, 'application/pdf')).rejects.toThrow('beschädigt');
});
it('distinguishes password protection', async () => {
  m.getDocument.mockReturnValue({
    promise: Promise.reject(Object.assign(new Error('password'), { name: 'PasswordException' })),
  });
  await expect(extractText(bytes, 'application/pdf')).rejects.toThrow('passwortgeschützt');
});
it('distinguishes image-only scan with no extractable text', async () => {
  const destroy = vi.fn();
  m.getDocument.mockReturnValue({
    promise: Promise.resolve({
      numPages: 2,
      getPage: async () => ({ getTextContent: async () => ({ items: [] }) }),
      destroy,
    }),
  });
  await expect(extractText(bytes, 'application/pdf')).rejects.toThrow(
    'OCR werden nicht unterstützt',
  );
  expect(destroy).toHaveBeenCalled();
});
