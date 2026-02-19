# Demo Prefill Alignment Audit

Date: 2026-02-19

## Objective

Ensure demo-mode prefilled answers are aligned with the assistant's actual questions instead of advancing blindly by turn index.

## Baseline Findings (Before Fix)

1. Prefill was index-based (`demoTurnIndex`) and non-adaptive.
2. Assistant questions are dynamic (based on unfilled fields), so fixed-order answers drifted quickly.
3. This could block Step 1 because required fields include:
   - `modelSummary.modelType`
   - `modelSummary.modelOwner`

## Implemented Fixes

1. Replaced turn-index prefill selection with intent-based adaptive selection.
   - `src/components/wizard/StepIntake.tsx`
   - `src/lib/demo-answers.ts`
2. Added intent-tagged demo answer bank with explicit, field-oriented wording.
   - `public/demo/demo-answers.json`
3. Added selector regression tests.
   - `tests/demo-answers.test.ts`

## Adaptive Selection Design

1. Parse assistant content into question sentences.
2. Prioritize the most recent question sentence.
3. Detect intent via regex rules (owner, developer, estimation technique, upstream/downstream, regulatory, monitoring, etc.).
4. Return matching prefilled response for that intent.
5. Use rotating fallback responses only when no intent match exists.

## Post-Fix Verification

Validation commands:

1. `npm run typecheck` passed.
2. `npm run test` passed (including new demo selector tests).

Behavioral replay (gpt-4o, 14-turn scripted run with current logic):

1. Early critical alignment now stable:
   - Type question -> `model_identity`
   - Estimation question -> `estimation_technique`
   - Developer/owner question -> `developer_owner`
2. Required Step 1 fields were captured:
   - `modelSummary.modelType`: filled
   - `modelSummary.modelOwner`: filled

## Remaining Risk

The assistant may still re-ask certain fields if its extraction does not emit a field update for a semantically valid response. The adaptive selector now keeps answer intent aligned, but final field-population coverage remains partly model-output dependent.
