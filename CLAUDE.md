# GitHub Workflow Rules

- **"Make a PR" means make a PR.** When the user says "make a PR" / "open a PR" / "create a PR", that is standing authorization to push the current branch and run `gh pr create` immediately — don't just summarize the diff or ask "should I create it?" first.
- **No Claude co-author trailer.** Never add a `Co-Authored-By: Claude ...` (or any Anthropic/Claude attribution) line to commit messages or PR bodies in this repo. Commits and PRs must read as authored solely by the repo owner (budhathoki10).
- Everything else in the standard git/PR safety rules still applies: no force-push to `master` without explicit confirmation, no `--no-verify`, prefer new commits over amending published ones.
