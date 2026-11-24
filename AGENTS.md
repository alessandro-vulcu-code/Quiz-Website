# Repository Guidelines

## Project Structure

- `index.html` is the entry point for Study Hub, a static multiple-choice quiz app. `app.js` handles navigation, quizzes, exams, and results. `style.css` defines layouts and themes.
- `parser.js` handles TXT, CSV, and JSON imports. `storage.js` manages data loading and browser storage. `supabase-client.js` wraps database calls.
- `Decks/` holds question files grouped by course. `test_quiz.txt` is a three-question import fixture. `migrate.html` and `migrate.js` load legacy questions from `data.js` into Supabase.

## Local Development

- Run `python3 -m http.server 8000` from the repository root, then open `http://localhost:8000/`. The app runs directly in the browser and loads MathJax and the Supabase client from a CDN.
- Run `node --check app.js` for a syntax check, substituting any JavaScript file you changed. The project has no build step or configured linter.

## Coding Style

Use four-space indentation, camelCase for JavaScript functions and variables, and kebab-case for CSS classes. Preserve the script order in `index.html` because the scripts share browser globals. Reuse CSS custom properties for theme colors and keep user-facing labels in Italian.

## Testing

Use browser smoke tests. There is no configured test framework or coverage threshold. For quiz changes, open a deck, answer questions, and verify navigation, scoring, and results review. For exam changes, check the timer and question selection. For import changes, try `test_quiz.txt` and verify the answers and math rendering. Each TXT row lists the correct answer first.

## Commits and Pull Requests

Recent commits use short subjects with bracketed tags such as `[feat]`, `[fix]`, and `[edit]`. Follow that pattern with a specific subject, such as `[fix] preserve quiz answers during navigation`. In pull requests, describe the change, list manual checks, link related issues when available, and include screenshots for visible changes.

## Supabase Configuration

Use a development Supabase project for imports, migrations, and policy changes. Start from `supabase_schema.sql` for a fresh database and review row-level security policies before applying the other SQL scripts. Keep service-role keys out of browser code and commits.
