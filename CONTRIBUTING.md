# Contributing

All help is welcome: bug reports, ideas for new clues, funnier case-file lines, typo fixes, art, or code.

## Quick ways to help
- **A case file got something wrong?** Open an issue with the GitHub username you typed and the line that was off.
- **Found a bug or something hard to read or use?** Open an issue and say what you did and what happened. A screenshot helps.
- **Want to change code?** Fork the repo, make your change on a branch, and open a pull request.

## How it's built
- Edit the parts in `src/`, never `index.html` by hand, then run `python src/build.py` to rebuild `index.html`, and commit both.
- `node tests/clues.test.js` checks the wording of every saved case (needs Playwright, no network). A fix gets a check in that file that fails without it.

## Accessibility
Please keep it usable for everyone: everything should work with a keyboard and on a phone, text should pass contrast, and motion should calm down when "reduce motion" is turned on.

Be kind. Cold Case roasts code, never people: every line is about the projects, not the person.
