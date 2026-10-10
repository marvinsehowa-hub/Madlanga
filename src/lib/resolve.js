/**
 * Resolving free-text "alleged by" strings to people in the register.
 *
 * Kept free of any JSON imports so it can be exercised directly by
 * scripts/verify-data.mjs under plain Node, not just through the bundler.
 */
import { people } from '../data/people.js';

export const norm = (s) => s.toLowerCase().replace(/[‘’]/g, "'");

/**
 * Longest matcher wins, so a specific name beats an accidental substring.
 * Returns null for institutional allegers ("Commission", "Evidence leaders"),
 * which deliberately produce no edge rather than a guessed one.
 */
export function resolveAlleger(by, targetId) {
  const hay = norm(by);
  let best = null;
  let bestLen = 0;
  for (const p of people) {
    for (const m of p.matchers) {
      const needle = norm(m);
      if (hay.includes(needle) && needle.length > bestLen) {
        best = p.id;
        bestLen = needle.length;
      }
    }
  }
  if (best) return best;
  // The witness's own evidence, however the record phrases it.
  if (/^self\b/i.test(by) || /on the record at the hearing/i.test(by))
    return targetId;
  if (/ad hoc committee/i.test(by)) return 'adhoc-mps';
  // Put by the bench or an evidence leader without a named individual.
  if (/commission|evidence leader/i.test(by)) return 'the-commission';
  // Charges brought by the prosecution in the criminal courts.
  if (/^the state$|prosecution|\bnpa\b|director of public prosecutions/i.test(by))
    return 'the-state';
  // A party acting as a body, rather than one of its named members.
  if (/economic freedom fighters|^the eff$/i.test(by)) return 'the-eff';
  return null;
}
