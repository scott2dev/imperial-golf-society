# Member Portal And Live Scoring Plan

This document turns the proposed member login and score-entry system into a buildable plan for the current Next 16 app.

## Goal

Members sign in with Google, join the outing they are playing that day, and use one designated scorekeeper per group to enter gross strokes for each player on each hole. The system then calculates points automatically from:

- the player's handicap
- the hole par
- the hole stroke index

Live points are visible only within that player's group during the round. After every group has finished, the captain can view the full outing leaderboard and prize winners.

## Recommended Stack

- `Next.js 16` App Router
- `Auth.js` with Google provider for sign-in
- `PostgreSQL` for outing, member, and score data
- `Prisma` or `Drizzle` as the database layer

Why this fits:

- Next 16 recommends enforcing auth close to the data layer and inside every Server Action / Route Handler.
- Google sign-in is simple to offer through an auth library instead of building auth ourselves.
- The current site is static, so we need a real database before live scoring is possible.

## Core Roles

- `member`: can view their own profile and the outings they are assigned to
- `scorekeeper`: a member assigned for a specific group on a specific outing who can enter scores for that group
- `captain`: can create outings, assign groups, monitor submission status, unlock final results, and view the full leaderboard

Important detail:

- `scorekeeper` should be an outing/group assignment, not a permanent global role
- `captain` can be a permanent role on the member record

## Suggested Data Model

### `members`

- `id`
- `email`
- `name`
- `google_sub`
- `handicap_index`
- `is_captain`
- `is_active`

### `courses`

- `id`
- `name`

### `course_holes`

- `id`
- `course_id`
- `hole_number`
- `par`
- `stroke_index`

### `outings`

- `id`
- `course_id`
- `title`
- `outing_date`
- `status` (`draft`, `live`, `completed`, `finalized`)

### `outing_players`

- `id`
- `outing_id`
- `member_id`
- `course_handicap`
- `playing_handicap`
- `group_number`
- `is_scorekeeper`
- `submitted_at`

### `hole_scores`

- `id`
- `outing_id`
- `member_id`
- `hole_number`
- `gross_strokes`
- `strokes_received`
- `net_strokes`
- `stableford_points`
- `entered_by_member_id`
- `updated_at`

### `outing_results`

- `id`
- `outing_id`
- `member_id`
- `total_points`
- `position`
- `is_locked`

## Scoring Logic

The cleanest first version is Stableford.

Suggested default rules:

- calculate each player's `playing_handicap` from their handicap for the day
- allocate strokes by hole using stroke index
- compute `net_strokes = gross_strokes - strokes_received`
- compute points from net score versus par

Typical Stableford mapping:

- `net double bogey or worse` = `0`
- `net bogey` = `1`
- `net par` = `2`
- `net birdie` = `3`
- `net eagle` = `4`
- `net albatross` = `5`

Important rule to confirm before coding:

- whether the society uses full handicap allowance, 95%, or another allowance
- whether handicaps should be rounded normally or handled another way
- whether any special competition rules apply on Captain's Weekend or sponsor days

## Privacy And Visibility Rules

During a live outing:

- members can see only the players in their own group
- scorekeepers can edit only their own group's scorecard
- captain can see group completion progress, but should not see the full leaderboard until the outing is complete if you want to preserve the reveal

After all groups submit, or after the captain explicitly closes scoring:

- captain can view the full leaderboard
- members can view final results if you want a public results page

## App Structure

Suggested private routes:

- `/login`
- `/portal`
- `/portal/outings`
- `/portal/outings/[outingId]`
- `/portal/outings/[outingId]/group`
- `/portal/captain/outings/[outingId]`

Suggested server areas:

- `src/lib/auth/*`
- `src/lib/dal/*`
- `src/app/actions/*`
- `src/app/api/*`

Recommended pattern:

- use Server Components to fetch protected data
- use Server Actions or Route Handlers for score mutations
- verify session and authorization inside every mutation
- keep authorization checks in the DAL, not only in layouts

## Main User Flow

### Member

1. Sign in with Google
2. Land on `/portal`
3. See today's outing if assigned
4. If in a group, view only that group's live scorecard and current points

### Scorekeeper

1. Open the outing group page
2. Enter gross strokes for each player hole by hole
3. Save after each hole or in small batches
4. Submit group at the end of the round

### Captain

1. Create outing and choose course
2. Assign members to groups
3. Mark one player in each group as scorekeeper
4. Watch submission progress
5. Close scoring
6. View winners and final leaderboard

## Phase Plan

### Phase 1

- add database
- add Google sign-in
- create member records
- protect a basic `/portal` route

### Phase 2

- create outings, courses, holes, and group assignments
- add captain-only outing setup screens

### Phase 3

- build scorekeeper score-entry screen
- calculate per-hole points automatically
- show live group-only standings

### Phase 4

- add captain results dashboard
- finalize outing and publish winners
- optionally sync final totals to the public `results` page

## Best First Build

If we want to keep risk low, the first working version should be:

- Google sign-in
- captain creates an outing
- captain assigns groups manually
- one scorekeeper enters hole-by-hole strokes
- Stableford points auto-calculate
- captain sees final leaderboard once all groups submit

That gets the real value live without overbuilding admin features.

## Key Open Decisions

- Which auth library do you want: `Auth.js` is the most straightforward fit here.
- Which database do you want: `Supabase Postgres`, `Neon`, or another hosted Postgres.
- Do members need to self-register, or should only pre-approved member emails be allowed?
- Should the captain see scores live, or only after all cards are in?
- Should final outing results become visible publicly on the main website?

## Recommendation

Build this in phases, starting with auth, member records, outings, and score entry for one group. Once that is solid, add captain controls and final leaderboard release rules.

The most important design choice is to treat score visibility and score editing as server-enforced permissions, not just hidden UI.
