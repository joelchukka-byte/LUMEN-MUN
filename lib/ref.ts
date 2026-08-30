import { randomInt } from 'node:crypto';

/**
 * Delegate reference codes, e.g. LM1-7QK4D.
 *
 * Crockford's alphabet minus I, L, O and U — so a code read aloud at the
 * registration desk, or typed off a phone screenshot, can't be misheard as
 * another valid code.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export const REF_PREFIX = 'LM1';
export const DELEGATION_PREFIX = 'LMD';

function code(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export const newDelegateRef = () => `${REF_PREFIX}-${code(5)}`;
export const newDelegationRef = () => `${DELEGATION_PREFIX}-${code(5)}`;

/** Accepts either prefix, case-insensitively, with or without the dash. */
export function normaliseRef(input: string): string {
  const cleaned = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = /^(LM1|LMD)([0-9A-Z]{5})$/.exec(cleaned);
  return match ? `${match[1]}-${match[2]}` : input.trim().toUpperCase();
}

export const isValidRef = (input: string) => /^(LM1|LMD)-[0-9A-Z]{5}$/.test(normaliseRef(input));
