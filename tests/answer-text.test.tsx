import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnswerText } from '../app/answer-text';
const id = '33333333-3333-4333-8333-333333333333';
describe('safe answer rendering', () => {
  it('renders bold, headings, line breaks and confirmed citations without raw markers', () => {
    const html = renderToStaticMarkup(
      <AnswerText
        text={'## Ergebnis\n**Erfahrung**\n- TypeScript [citation:' + id + ']'}
        citations={[{ id, sourceId: id, page: 2, section: null, excerpt: 'TypeScript' }]}
        onOpen={() => {}}
      />,
    );
    expect(html).toContain('<strong>Ergebnis</strong>');
    expect(html).toContain('<strong>Erfahrung</strong>');
    expect(html).toContain('• TypeScript');
    expect(html).toContain('Beleg · Seite 2');
    expect(html).not.toContain('[citation:');
  });
  it('escapes HTML and preserves unverified evidence visibly', () => {
    const html = renderToStaticMarkup(
      <AnswerText
        text={'<script>alert(1)</script> [citation:' + id + ']'}
        citations={[]}
        onOpen={() => {}}
      />,
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Beleg nicht bestätigt');
  });
});
