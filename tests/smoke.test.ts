import { expect, it } from 'vitest';
import { canSubmit } from '../app/notebook';
it('empty workspace cannot submit a question', () => expect(canSubmit('Frage', [])).toBe(false));
