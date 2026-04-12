# External Contract: Open Trivia Database API

**Date**: 2026-04-11
**Source**: https://opentdb.com/

This is an external dependency. The server consumes it; clients never call it directly.

---

## Endpoints Used

### GET Categories
```
GET https://opentdb.com/api_category.php
```

**Response**:
```json
{
  "trivia_categories": [
    { "id": 9, "name": "General Knowledge" },
    { "id": 10, "name": "Entertainment: Books" }
  ]
}
```

Called once at server startup and cached in memory. The cached list is reused for all
subsequent game sessions until the server restarts.

### GET Questions
```
GET https://opentdb.com/api.php?amount=5&category={categoryId}&type=multiple
```

**Response**:
```json
{
  "response_code": 0,
  "results": [
    {
      "category": "General Knowledge",
      "type": "multiple",
      "difficulty": "medium",
      "question": "What is the capital of France?",
      "correct_answer": "Paris",
      "incorrect_answers": ["Berlin", "Madrid", "Rome"]
    }
  ]
}
```

Called once per category when that category's voting phase resolves. The result is cached
in memory for the duration of the session. Since each category is played at most once per
game, there is no scenario requiring a re-fetch.

---

## Response Codes

| Code | Meaning | Handling |
|------|---------|---------|
| 0 | Success | Proceed normally |
| 1 | No results | Show `TRIVIA_UNAVAILABLE` error; skip category or retry once |
| 2 | Invalid parameter | Should not occur with correct category IDs; log and skip |
| 3 | Token not found | Not used (no session tokens) |
| 4 | Token empty | Not used (no session tokens) |

---

## Data Handling

- All `question`, `correct_answer`, and `incorrect_answers` fields are HTML-encoded.
  Decode with a utility function before storing or broadcasting (e.g., parse via a
  `DOMParser` in browser, or a minimal HTML entity decoder on the server).
- Shuffle `[correct_answer, ...incorrect_answers]` into a 4-element array.
  Record the index of `correct_answer` after shuffling — this is `correctIndex` in the
  data model.
- The API does not guarantee question uniqueness across calls. For our use case (one call
  per category per game), duplicates within a single game are unlikely and acceptable.

---

## Caching Strategy

All API data is cached in-memory within `server/trivia.js` as module-level variables:

| Data | Cached at | Cache key | Eviction |
|------|-----------|-----------|----------|
| Categories | Server startup | N/A (single list) | Server restart |
| Questions | First fetch per category | `categoryId` | Server restart |

The cache is a plain JS `Map` / variable — no external cache library. Because state is
never persisted, the cache naturally resets with the process.

---

## Mock Mode

When the environment variable `TRIVIA_MOCK=true` is set, `server/trivia.js` returns data
from the local fixture file `tests/e2e/fixtures/trivia.js` instead of calling the API.

- `fetchCategories()` returns the fixture's category list
- `fetchQuestions(categoryId)` returns the fixture's question set for that category

This is used exclusively by the Playwright test runner (configured via `playwright.config.js`
`webServer.env`). Production and manual development always use the live API.

The fixture file MUST cover every category referenced in the test suite. Correct answer
indices in the fixture are stable and known, enabling deterministic test assertions.

---

## Error Handling Policy

- If the categories endpoint fails on game start, display an error to all lobby players and
  do not start the game until a successful fetch.
- If the questions endpoint fails when a round begins, broadcast `TRIVIA_UNAVAILABLE` to all
  players and retry once after 3 seconds. If the retry also fails, skip the category (mark it
  as used) and return to voting with the remaining categories.
- Do not retry indefinitely — one retry per failed request.
