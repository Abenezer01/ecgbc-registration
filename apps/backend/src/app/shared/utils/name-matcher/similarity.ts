export function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

export function levenshteinSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const dist = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  return Math.max(0, (1 - dist / maxLen) * 100);
}

export function tokenJaccardSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const tokensA = new Set(a.split(' ').filter(Boolean));
  const tokensB = new Set(b.split(' ').filter(Boolean));
  if (tokensA.size === 0 && tokensB.size === 0) return 0;

  let intersection = 0;
  tokensA.forEach(t => {
    if (tokensB.has(t)) intersection++;
  });

  const union = tokensA.size + tokensB.size - intersection;
  return (intersection / union) * 100;
}

export function tokenSubsetSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const tokensA = a.split(' ').filter(Boolean);
  const tokensB = b.split(' ').filter(Boolean);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const smaller = tokensA.length <= tokensB.length ? tokensA : tokensB;
  const larger = tokensA.length > tokensB.length ? tokensA : tokensB;

  let matchCount = 0;
  const largerSet = new Set(larger);
  smaller.forEach(t => {
    if (largerSet.has(t)) matchCount++;
  });

  return (matchCount / smaller.length) * 100;
}

export function getTrigrams(text: string): Set<string> {
  const trigrams = new Set<string>();
  const padded = ` ${text} `;
  for (let i = 0; i < padded.length - 2; i++) {
    trigrams.add(padded.substring(i, i + 3));
  }
  return trigrams;
}

export function trigramDiceSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach(t => {
    if (setB.has(t)) intersection++;
  });
  return (2 * intersection / (setA.size + setB.size)) * 100;
}
