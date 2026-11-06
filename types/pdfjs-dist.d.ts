declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export function getDocument(options: unknown): { promise: Promise<any> };
}
declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs' {
  export const WorkerMessageHandler: unknown;
}
