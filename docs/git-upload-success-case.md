# Git upload success case

This repository has two remotes, but the successful upload path is:

- Local repository: `d:\tavern_helper_template-main`
- Local branch: `master`
- Target remote: `user_card`
- Target branch: `main`
- Target URL: `https://github.com/hajimi0220-design/user_card.git`
- Working push command: `git push -u user_card master:main`

The last verified successful upload used commit:

```text
9ac46b1 upload project files
```

## Next upload

Use the helper script from the repository root:

```powershell
.\scripts\upload_user_card.ps1 -Message "your commit message"
```

If no message is passed, the script creates one with the current timestamp.

The script follows the successful sequence:

```powershell
git add -A
git commit -m "<message>"
git push -u user_card HEAD:main
```

If the normal push is rejected because the remote only contains the GitHub Actions `[bot] bundle` commit, use:

```powershell
.\scripts\upload_user_card.ps1 -ForceWithLease
```

That runs:

```powershell
git push --force-with-lease user_card HEAD:main
```

## Important notes

- Push to `user_card/main`, not `origin/main`.
- `origin/main` is a different history and should not be used for this upload flow.
- The GitHub Action may create a `[bot] bundle` commit after upload. That commit can contain paths that are invalid on Windows, so rebasing onto it may fail locally.
- Use `-ForceWithLease` only for this known generated bundle conflict on `user_card/main`, not for unrelated remote work.
