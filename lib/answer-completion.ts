export const incompletePrefix = 'Antwort unvollständig';
export function completionNotice(reason: string) {
  const cause = reason === 'length' ? 'Ausgabelimit erreicht' : reason === 'timeout' ? 'Zeitlimit erreicht' : reason === 'abort' ? 'Anfrage abgebrochen' : 'Generierung nicht erfolgreich abgeschlossen';
  return incompletePrefix + ': ' + cause + '. Stelle eine gezieltere Frage oder versuche es erneut.';
}
export function completedContent(text: string, reason: string) {
  return reason === 'stop' ? text : text + '\n\n' + completionNotice(reason);
}
