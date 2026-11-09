/** Extract textual model output from OpenAI Responses API/SDK result shapes. */
export function extractResponseText(response) {
  if (!response || typeof response !== 'object') return '';
  if (typeof response.output_text === 'string') return response.output_text;
  if (!Array.isArray(response.output)) return '';
  return response.output
    .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
    .filter((part) => part?.type === 'output_text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('');
}
