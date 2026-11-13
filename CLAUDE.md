# CLAUDE.md

Cold Case Unit is a one-page site: type a GitHub username, get a case file on its abandoned projects.
Live at https://connabyss.github.io/cold-case/.

## How it's built

- Edit the parts in `src/`, never `index.html` by hand. Then run `python src/build.py` to rebuild `index.html`,
  and commit both.
- `auth/worker.js` is the GitHub sign-in helper, a Cloudflare Worker. connabyss deploys it in Cloudflare; editing
  the file here does not change the live worker.

## Tests

- `node tests/clues.test.js` builds every case file from the saved suspects in `tests/fixtures/` and checks the
  wording. It needs Playwright and no network. If Playwright is installed globally, run it as
  `NODE_PATH=$(npm root -g) node tests/clues.test.js`. Passing prints `ok: N cases`.
- Run it after `python src/build.py`, before every PR. A fix gets a check in that file that fails without it.
- Anything that changes how the page looks: take a screenshot and look at it yourself before calling it done.

## Deploying

- **Merging into the default branch deploys.** GitHub Pages serves the repo's default branch (today it is
  `claude/project-thread-cx4blx`; there is no `main`), so a merge is live within a minute or two.
  Open PRs against the default branch, and only connabyss merges.

## Rules (from connabyss)

- Commit as `CH <340279802+connabyss@users.noreply.github.com>` (the GitHub no-reply address), never a personal email.
- Fewer PRs with more changes each. Batch related work into one PR; overlapping fixes always go in ONE PR.
- Don't merge. Open the PR, assign connabyss, request their review, and let them merge.
- No PRs, issues or comments on other people's repos unless connabyss picked that repo.
- Nothing goes live or gets posted without connabyss's OK.
- It roasts code, not people: keep every line about the projects, never the person.
