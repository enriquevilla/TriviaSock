// Deterministic trivia fixture for E2E tests.
// Used by server/trivia.js when TRIVIA_MOCK=true.
// correctIndex is the index within options[] of the correct answer.

export const MOCK_CATEGORIES = [
  { id: 1, name: 'Science' },
  { id: 2, name: 'History' },
  { id: 3, name: 'Geography' },
];

export const MOCK_QUESTIONS = new Map([
  [1, [
    { text: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'NaCl', 'O2'], correctIndex: 0, pointWinner: null },
    { text: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], correctIndex: 1, pointWinner: null },
    { text: 'What is the approximate speed of light?', options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'], correctIndex: 0, pointWinner: null },
    { text: 'What gas do plants absorb during photosynthesis?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctIndex: 2, pointWinner: null },
    { text: 'What is the atomic number of carbon?', options: ['4', '6', '8', '12'], correctIndex: 1, pointWinner: null },
  ]],
  [2, [
    { text: 'In what year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctIndex: 2, pointWinner: null },
    { text: 'Who was the first President of the United States?', options: ['John Adams', 'George Washington', 'Thomas Jefferson', 'Benjamin Franklin'], correctIndex: 1, pointWinner: null },
    { text: 'In what year did the Berlin Wall fall?', options: ['1987', '1988', '1989', '1990'], correctIndex: 2, pointWinner: null },
    { text: 'Julius Caesar was part of which empire?', options: ['Greek', 'Ottoman', 'Roman', 'Byzantine'], correctIndex: 2, pointWinner: null },
    { text: 'In what year did the Titanic sink?', options: ['1910', '1911', '1912', '1913'], correctIndex: 2, pointWinner: null },
  ]],
  [3, [
    { text: 'What is the capital of France?', options: ['London', 'Berlin', 'Madrid', 'Paris'], correctIndex: 3, pointWinner: null },
    { text: 'What is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correctIndex: 1, pointWinner: null },
    { text: 'On which continent is Egypt located?', options: ['Asia', 'Africa', 'Europe', 'South America'], correctIndex: 1, pointWinner: null },
    { text: 'What is the smallest country in the world by area?', options: ['Monaco', 'San Marino', 'Liechtenstein', 'Vatican City'], correctIndex: 3, pointWinner: null },
    { text: 'How many continents are there on Earth?', options: ['5', '6', '7', '8'], correctIndex: 2, pointWinner: null },
  ]],
]);
