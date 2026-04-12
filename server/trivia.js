const MOCK = process.env.TRIVIA_MOCK === 'true';

// Load fixture data at startup when in mock mode (top-level await, Node 20+ ES module)
let mockCategories, mockQuestionsMap;
if (MOCK) {
  const fixture = await import('../tests/e2e/fixtures/trivia.js');
  mockCategories = fixture.MOCK_CATEGORIES;
  mockQuestionsMap = fixture.MOCK_QUESTIONS;
}

// In-memory caches for live API data
let cachedCategories = null;
const cachedQuestions = new Map(); // Map<categoryId, Question[]>

/**
 * Return all available trivia categories as { id, name }[].
 * Fetched once from the API and cached; mock mode returns fixture data.
 */
export async function fetchCategories() {
  if (MOCK) return mockCategories;
  if (cachedCategories) return cachedCategories;

  const res = await fetch('https://opentdb.com/api_category.php');
  if (!res.ok) throw new Error('TRIVIA_UNAVAILABLE');
  const data = await res.json();
  cachedCategories = data.trivia_categories.map(c => ({
    id: c.id,
    name: decodeHtml(c.name),
  }));
  return cachedCategories;
}

/**
 * Return 5 questions for the given category as Question[].
 * Fetched once per category and cached; mock mode returns fixture data.
 * @param {number} categoryId
 */
export async function fetchQuestions(categoryId) {
  if (MOCK) return mockQuestionsMap.get(categoryId) ?? [];
  if (cachedQuestions.has(categoryId)) return cachedQuestions.get(categoryId);

  const url = `https://opentdb.com/api.php?amount=5&category=${categoryId}&type=multiple`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('TRIVIA_UNAVAILABLE');
  const data = await res.json();

  if (data.response_code !== 0) {
    throw new Error(`TRIVIA_API_ERROR:${data.response_code}`);
  }

  const questions = data.results.map(q => {
    const correct = decodeHtml(q.correct_answer);
    const options = shuffle([correct, ...q.incorrect_answers.map(decodeHtml)]);
    return {
      text: decodeHtml(q.question),
      options,
      correctIndex: options.indexOf(correct),
      pointWinner: null,
    };
  });

  cachedQuestions.set(categoryId, questions);
  return questions;
}

/**
 * Decode common HTML entities returned by the Open Trivia DB API.
 * Handles named entities and numeric character references (e.g. &#8217;).
 * @param {string} str
 * @returns {string}
 */
export function decodeHtml(str) {
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
