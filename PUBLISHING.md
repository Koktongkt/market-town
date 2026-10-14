# Publishing a daily report

Reports live in `public/data/reports/YYYY-MM-DD.json`. Publishing is scripted, so you never edit `index.json` or `latest.json` by hand.

## Daily steps

1. **Produce the data JSON.** It must match [`schema/report.schema.json`](schema/report.schema.json); field meanings are in `/workspace/market-report/README.md`. The usual path is `/workspace/market-report/data.json`, but any path works.
   - Required keys: `as_of`, `generated_at_utc`, `indices[]`, `sectors[]` (exactly 11), `macro{...}`, `mood.overall` (`bull`|`bear`|`neutral`), `risks[]`, `themes[]`, `sources[]` (≥1), `null_fields[]`.
   - Unknown figures are `null` (with a `note`) and listed in `null_fields`. Never omit a required key.
2. **Check it (optional, no side effects):**
   `cd /workspace/market-town && node scripts/validate.mjs /workspace/market-report/data.json`
3. **Publish:**
   `/workspace/market-report/publish.sh /workspace/market-report/data.json [YYYY-MM-DD]`
   - The date defaults to **today in America/New_York**. Pass the market date explicitly (normally the same as `as_of`) if you publish after midnight ET or backfill. The script warns if `as_of` ≠ date.
   - The script validates the file, pulls `main`, writes `reports/DATE.json`, rebuilds `index.json`, `latest.json` and `data.json` (alias), re-validates the whole archive, commits `Publish report DATE`, and pushes to `main`.
   - **Idempotent:** re-running with identical content for the same date prints `already published … nothing to do`. Re-running with changed content for an existing date overwrites that day.
4. **Confirm the deploy:** https://github.com/Koktongkt/market-town/actions shows a green "Deploy to GitHub Pages" run (about 1–2 min). Then open https://koktongkt.github.io/market-town/?date=YYYY-MM-DD.

## Requirements

- `GITHUB_TOKEN` must be set in the environment of the process that runs `publish.sh`, with Contents: write on `Koktongkt/market-town`. It is only passed to git through a one-shot credential helper and is never written to `.git/config` or printed.
- The GitHub connector available to agents is **read-only**, so pushes must go through this script.
- Repo checkout: `/workspace/market-town`, on `main`, with a clean working tree.

## Exit codes and failure handling

| Code | Meaning | What to do |
|---|---|---|
| 2 | Bad arguments or date, or the file can't be read/parsed | Fix the path, the date format (YYYY-MM-DD) or the JSON syntax |
| 3 | Schema validation failed (errors list the JSON paths) | Fix the data and re-run. Nothing was committed, and archive changes are reverted |
| 4 | `GITHUB_TOKEN` not set | Run from a process that has the token. Ask KT if it's missing |
| 5 | Repo not on `main`, or uncommitted changes | `cd /workspace/market-town && git status`; commit or stash stray changes |
| 6 | `git pull`/`push` failed (network, auth, non-fast-forward) | Re-run. If the push failed after commit, run `git push` from the repo with auth, or re-run publish (rerunning is safe) |

- **CI failure:** the workflow runs `npm run validate` before `npm run build`, so a bad archive blocks deploy and the live site keeps the last good version. Open the failed run's log, fix the data, and re-publish.
- **Rolling back a bad day:** `git revert <commit>` and push, or re-publish corrected data for the same date.
- **Rebuilding derived files:** `node scripts/publish.mjs --reindex` regenerates `index.json`, `latest.json` and `data.json` from `reports/`, without committing.
