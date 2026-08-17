import { normalizeAmharic, transliterateAmharic } from './amharic';
import { normalizeEnglish } from './english';
import {
  levenshteinSimilarity,
  tokenJaccardSimilarity,
  getTrigrams,
  trigramDiceSimilarity,
  tokenSubsetSimilarity,
} from './similarity';

export interface ScoreResult {
  finalScore: number;
  ruleFlags: string[];
}

export function calculateNameSimilarityScore(
  existingAm: string,
  existingEn: string,
  newAm: string,
  newEn: string
): ScoreResult {
  const masterAm = normalizeAmharic(existingAm);
  const masterEn = normalizeEnglish(existingEn);
  const masterTranslit = transliterateAmharic(masterAm);

  const appAm = normalizeAmharic(newAm);
  const appEn = normalizeEnglish(newEn);
  const appTranslit = transliterateAmharic(appAm);

  const ruleFlags: string[] = [];

  const strSimAm = appAm && masterAm ? levenshteinSimilarity(appAm, masterAm) : 0;
  const strSimEn = appEn && masterEn ? levenshteinSimilarity(appEn, masterEn) : 0;
  const bestStrSim = Math.max(strSimAm, strSimEn);

  const tokenSimAm = appAm && masterAm ? tokenJaccardSimilarity(appAm, masterAm) : 0;
  const tokenSimEn = appEn && masterEn ? tokenJaccardSimilarity(appEn, masterEn) : 0;
  const bestTokenSim = Math.max(tokenSimAm, tokenSimEn);

  const subsetSimAm = appAm && masterAm ? tokenSubsetSimilarity(appAm, masterAm) : 0;
  const subsetSimEn = appEn && masterEn ? tokenSubsetSimilarity(appEn, masterEn) : 0;
  const bestSubsetSim = Math.max(subsetSimAm, subsetSimEn);

  const tgSimAm = appAm && masterAm ? trigramDiceSimilarity(getTrigrams(appAm), getTrigrams(masterAm)) : 0;
  const tgSimEn = appEn && masterEn ? trigramDiceSimilarity(getTrigrams(appEn), getTrigrams(masterEn)) : 0;
  const bestTgSim = Math.max(tgSimAm, tgSimEn);

  const translitSimAm2Am = appTranslit && masterTranslit ? levenshteinSimilarity(appTranslit, masterTranslit) : 0;
  const translitSimAm2En = appTranslit && masterEn ? levenshteinSimilarity(appTranslit, masterEn) : 0;
  const translitSimEn2Am = appEn && masterTranslit ? levenshteinSimilarity(appEn, masterTranslit) : 0;
  const bestTranslitSim = Math.max(translitSimAm2Am, translitSimAm2En, translitSimEn2Am);

  const tgTranslitAm2En = appTranslit && masterEn ? trigramDiceSimilarity(getTrigrams(appTranslit), getTrigrams(masterEn)) : 0;
  const tgTranslitEn2Am = appEn && masterTranslit ? trigramDiceSimilarity(getTrigrams(appEn), getTrigrams(masterTranslit)) : 0;
  const tgTranslitAm2Am = appTranslit && masterTranslit ? trigramDiceSimilarity(getTrigrams(appTranslit), getTrigrams(masterTranslit)) : 0;
  const bestTgTranslitSim = Math.max(tgTranslitAm2En, tgTranslitEn2Am, tgTranslitAm2Am);

  // Rule 1: Exact match
  if (bestStrSim === 100) {
    ruleFlags.push('Exact match (+)');
    return { finalScore: 100, ruleFlags };
  }

  // Rule 2: Token-reordered exact match
  if (bestTokenSim === 100) {
    ruleFlags.push('Tokens reordered (+)');
    return { finalScore: 98, ruleFlags };
  }

  // Rule 3: Base blended score
  let finalScore = Math.max(
    bestTgSim * 0.90,
    bestTokenSim > bestStrSim
      ? (bestTokenSim * 0.70) + (bestStrSim * 0.20)
      : (bestStrSim * 0.55) + (bestTokenSim * 0.35)
  );

  // Cross-lingual boost
  if (bestTranslitSim > finalScore || bestTgTranslitSim > finalScore) {
    const translitBlendedScore = Math.max(bestTgTranslitSim * 0.90, bestTranslitSim * 0.85);
    finalScore = Math.max(finalScore, translitBlendedScore);
    if (translitBlendedScore >= 80 && ruleFlags.length === 0) {
      ruleFlags.push('Cross-lingual translation match');
    }
  }

  if (bestTgSim >= 85 && bestTokenSim < 100) {
    ruleFlags.push(`Trigram overlap (${bestTgSim.toFixed(0)}%)`);
    finalScore = Math.max(finalScore, bestTgSim);
  }

  // Rule 4: Subset match
  if (bestSubsetSim === 100 && bestTokenSim < 100) {
    ruleFlags.push('Subset match (+)');
    finalScore = Math.max(finalScore, 85);
  }

  // Rule 5: Acronym match
  const checkAcronym = (shortStr: string, longStr: string): boolean => {
    if (!shortStr || !longStr || shortStr.length < 2 || shortStr.length > 5) return false;
    const tokens = longStr.split(' ').filter(Boolean);
    if (tokens.length >= 2 && tokens.length === shortStr.length) {
      return tokens.map(t => t[0]).join('') === shortStr;
    }
    return false;
  };

  const isAmharicAcronym = checkAcronym(appAm, masterAm) || checkAcronym(masterAm, appAm);
  const isEnglishAcronym = checkAcronym(appEn, masterEn) || checkAcronym(masterEn, appEn);

  if (isAmharicAcronym || isEnglishAcronym) {
    finalScore = Math.max(finalScore, 95);
    ruleFlags.push('Acronym match (+)');
  }

  // Rule 6: Length mismatch penalty
  const mTokens = masterAm.split(' ').length;
  const aTokens = appAm.split(' ').length;
  if (Math.abs(mTokens - aTokens) > 2) {
    finalScore *= 0.8;
    ruleFlags.push('Length mismatch penalty (-)');
  }

  // Soundex or Metaphone logic can be added here for "perfecting" the algorithm
  // For now, the existing robust logic handles most cases efficiently

  return {
    finalScore: Math.min(Math.round(finalScore), 100),
    ruleFlags,
  };
}
