type Citation = { id: string; sourceId: string; page: number | null; section: string | null; excerpt: string };
// Bounded Markdown subset; React escapes model text. No HTML or executable URLs.
export function AnswerText({text,citations,onOpen}:{text:string;citations:Citation[];onOpen:(citation:Citation)=>void}) {
  return <div className="answer-text">{text.split('\n').map((line,i)=>{
    const heading=/^#{1,6}\s+/.test(line); const bullet=/^\s*[-*]\s+/.test(line);
    const clean=line.replace(/^#{1,6}\s+/, '').replace(/^\s*[-*]\s+/, '• ');
    const nodes=clean.split(/(\[citation:[0-9a-f-]{36}\]|\*\*[^*]+\*\*)/gi).map((part,j)=>{
      const match=part.match(/^\[citation:([0-9a-f-]{36})\]$/i);
      if(match){const citation=citations.find(c=>c.id.toLowerCase()===match[1].toLowerCase());return citation?<button type="button" className="citation" key={j} onClick={()=>onOpen(citation)}>Beleg{citation.page?' · Seite '+citation.page:''}</button>:<span className="evidence-note" key={j}>[Beleg nicht bestätigt]</span>}
      if(part.startsWith('**')&&part.endsWith('**'))return <strong key={j}>{part.slice(2,-2)}</strong>;
      return part;
    });
    return <div key={i} className={bullet?'answer-list-item':undefined}>{heading?<strong>{nodes}</strong>:line?nodes:<br/>}</div>;
  })}</div>;
}
