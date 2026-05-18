# AI project notes

This file records repo-specific decisions that future AI agents should follow without needing the user to repeat them.

## Variable update contract

- The story reply format for this project is:
  ` <story>...</story>` immediately followed by
  ` <UpdateVariable><Analysis>...</Analysis><JSONPatch>...</JSONPatch></UpdateVariable>`
- Do not switch this back to `<state>...</state>` for normal variable updates.
- Backend parsing for variable updates now lives in:
  `src/角色卡/脚本/剧情机制/index.ts`
- The script applies `JSONPatch` style operations from `<JSONPatch>` and persists them into chat `stat_data`.

## Frontend display contract

- The main story UI intentionally hides raw update tags from the prose body.
- Instead, the UI shows a styled collapsible "Variable Update" card below the story when update data exists.
- Keep the prose clean, but preserve the ability for the user to inspect:
  - `Analysis`
  - formatted `JSONPatch`
- The placeholder tag `<StatusPlaceHolderImpl/>` is an integration placeholder for the status-bar injection rule, not user-facing prose.
- Frontend narrative cleanup should always hide `<StatusPlaceHolderImpl/>` if it appears in greetings, first messages, or raw generated text.
- Related UI file:
  `src/角色卡/界面/状态栏/TabStory.vue`

## Persistence expectations

- Narrative content must persist after refresh.
- Variable updates must persist in chat `stat_data`, not only in local component state.
- The latest variable update visualization is also stored in schema field:
  `stat_data._变量更新可视化`

## Git upload workflow

- Preferred remote:
  `user_card`
- Preferred remote branch:
  `main`
- Local branch commonly used:
  `master`
- Standard upload command:
  `.\scripts\upload_user_card.ps1 -Message "your commit message"`
- If push is blocked only by the generated GitHub Actions bundle commit, use:
  `.\scripts\upload_user_card.ps1 -ForceWithLease`
- Do not default to pushing to `origin/main` for this repo.

## When modifying this project

- If changing generation output rules, keep backend parsing and frontend rendering in sync.
- If changing variable update format, update both:
  - `src/角色卡/脚本/剧情机制/index.ts`
  - `src/角色卡/界面/状态栏/TabStory.vue`
- After changes, run a build before upload:
  `pnpm build`
