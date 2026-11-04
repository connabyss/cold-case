# Cold Case Unit

**Somebody killed all these projects. The commit log says it was you.**

Type a GitHub username and get a case file on every project its owner walked away from: a WANTED poster with the suspect's habits, witness statements from the files left at the scene, last words, a funeral, and a court where you plead guilty or promise to finish it tomorrow.

Every line comes from the public GitHub record, read live in your browser. Nothing is stored on a server, only public projects are looked at, and it roasts code, not people.

## How it works

- `index.html` is the whole site. It calls GitHub's public API from your browser.
- The parts live in `src/`: the clue library (`lib.js`), witnesses, funerals and the M.O. profile (`extras.js`), the live lookup (`live.js`), sound (`sound.js`) and the share card (`share.js`). Run `python src/build.py` to rebuild `index.html`.
- GitHub allows each visitor 60 API lookups an hour, which is about two suspects. Sign in with GitHub, coming later, will lift that.
