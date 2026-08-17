const englishStopwords = new Set([
  'church', 'ministry', 'ministries', 'fellowship', 'international',
  'worldwide', 'global', 'local', 'the', 'of', 'and', 'in', 'at',
  'center', 'centre', 'assembly', 'assemblies', 'congregation',
  'protestant', 'catholic', 'orthodox', 'gospel', 'full',
  'believers', 'faith', 'evangelical'
]);

const englishSynonyms: Record<string, string> = {
  'mkc': 'meserete kristos',
  'ekhc': 'ethiopian kale heywet',
  'kale hiwot': 'kale heywet',
  'hiwot': 'heywet',
  'hiwet': 'heywet',
  'mulu wongel': 'mulu wengel',
  'hawaryat': 'apostolic',
};

export function normalizeEnglish(text: string): string {
  if (!text) return '';
  let n = text.toLowerCase().replace(/[\s_]+/g, ' ').trim();

  // Remove punctuation
  n = n.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"\[\]]/g, ' ');

  // Apply synonyms
  for (const [key, val] of Object.entries(englishSynonyms)) {
    if (n.includes(key)) {
      n = n.split(key).join(val);
    }
  }

  // Remove stopwords
  n = n.split(/\s+/).filter(w => !englishStopwords.has(w)).join(' ');

  n = n.replace(/\s+/g, ' ').trim();

  if (!n && text) {
    n = text.toLowerCase().replace(/[\s_]+/g, ' ').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return n;
}
