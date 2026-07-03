---
name: Test builder form shape
description: How the CreateTest wizard formData maps to the POST /api/tests API payload
---

The wizard accumulates all steps into a single `formData` object. The `createTest()` function in `testsService.js` is the canonical mapper.

**formData keys (wizard):**
- `testTitle` → `name`
- `role` → `role`
- `description` (step 1) OR `instructions` (step 2) → `instructions` (step 2 wins)
- `duration` + `durationUnit` → `time_limit` (converted to minutes)
- `language` → `language` (default: 'python')
- `starterCode` → `starter_code`
- `testCases[]` → each case mapped to `{ name, input, expectedOutput, isHidden, weight }`
- `skills`, `difficulty` → sent to server but not yet stored in schema

**Why:** The wizard was built before the sandbox schema existed. The initial form data in CreateTest.jsx must include all Step 2 keys (`instructions`, `language`, `starterCode`, `testCases: []`) or they'll be undefined when the user skips Step 2.
