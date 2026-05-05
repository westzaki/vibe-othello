# Teacher Guidance

## Purpose

Teacher guidance chooses a move for play hints, advantage adjustment, and review suggestions.

The goal is not to surface a weak teaching example. The order of priority is:

1. strength
2. safety
3. learning theme
4. explainability

In other words, Teacher should first find strong candidate moves, then choose the one that is easiest to learn from.

## Candidate Policy

Teacher guidance keeps recommendations inside a strong score band.

Moves that are far behind the best searched move should not become recommendations just because they look educational, reduce mobility, or touch a familiar theme such as corners.

Risk is also checked before a move is promoted:

- moves that give the opponent a corner are penalized
- high refutation risk is penalized
- learning bonuses are small tie-breakers

## Modes

`normal` keeps recommendations close to search-score order.

`comeback` is used when the current player is behind. It still starts from strong candidates, but within that band it gives a small bonus to moves that pressure the opponent:

- the opponent has fewer legal moves after the candidate
- the opponent mobility delta is negative
- the mobility swing improves
- the opponent is close to a forced move or pass
- the opponent reply spread is large enough that one reply matters more than the rest

`auto` uses comeback behavior only when the current side appears disadvantaged. Play hints and default review analysis use `auto`.

Comeback mode is not a gamble mode. It should not recommend a clearly weaker move just because it creates pressure.

## Runtime Boundary

Heavy Teacher guidance is expected to run through the play/review workers.

Synchronous fallback paths keep `useTeacherGuidanceMove: false`, so comeback guidance is not re-run on the main thread after worker timeout or failure.

`src/cpu` and `src/game` remain unaware of Teacher guidance modes.

## Benchmark

A skipped development benchmark lives at:

```text
src/teacher/teacherComebackBenchmark.test.ts
```

To run it manually:

```sh
VITE_TEACHER_COMEBACK_BENCHMARK=1 npm run test:run -- src/teacher/teacherComebackBenchmark.test.ts
```

The benchmark uses a fixed 30-position seed pack of slightly disadvantaged positions.
It measures Teacher's first comeback response and the immediate Level 6 reply, then summarizes:

- average advantage swing after the Level 6 reply
- improved / held / worsened position counts
- average disc difference after the reply
- average Teacher guidance time
- average Level 6 reply time
- null move counts

For a quicker local sample, limit the number of fixed positions:

```sh
VITE_TEACHER_COMEBACK_BENCHMARK=1 VITE_TEACHER_COMEBACK_BENCHMARK_LIMIT=5 npm run test:run -- src/teacher/teacherComebackBenchmark.test.ts
```

This is a rough product-quality signal, not a formal competitive strength rating.
It intentionally avoids full game playouts so the benchmark can be run often while tuning Play hints and Review quality.

## Future Ideas

- parity
- frontier discs
- quiet moves
- transposition table for Teacher search
- visible refutation hints such as "the opponent can reply here"
