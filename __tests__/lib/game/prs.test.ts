import { detectPrs, type PrSetInput } from '@/lib/game/prs';

// SPEC.md 8.4 — weight-based PRs, per exercise, detected when a workout is
// finished. detectPrs compares the finishing workout's sets against the max
// weight from all previously finished workouts (per exercise).

function makeSet(overrides: Partial<PrSetInput> & Pick<PrSetInput, 'id' | 'exerciseId' | 'weightKg'>): PrSetInput {
  return { setNumber: 1, ...overrides };
}

function prevMax(entries: [exerciseId: number, maxWeightKg: number][] = []): ReadonlyMap<number, number> {
  return new Map(entries);
}

describe('detectPrs', () => {
  it('returns no events for an empty workout', () => {
    expect(detectPrs([], prevMax())).toEqual([]);
  });

  it('counts the first-ever weighted set for an exercise as a PR (baseline)', () => {
    const events = detectPrs([makeSet({ id: 1, exerciseId: 7, weightKg: 60 })], prevMax());
    expect(events).toEqual([{ exerciseId: 7, setId: 1, weightKg: 60 }]);
  });

  it('detects a PR when the workout max beats the historical max', () => {
    const events = detectPrs([makeSet({ id: 1, exerciseId: 7, weightKg: 105 })], prevMax([[7, 100]]));
    expect(events).toEqual([{ exerciseId: 7, setId: 1, weightKg: 105 }]);
  });

  it('requires strictly greater: equalling the historical max is not a PR', () => {
    expect(detectPrs([makeSet({ id: 1, exerciseId: 7, weightKg: 100 })], prevMax([[7, 100]]))).toEqual([]);
  });

  it('is not a PR when below the historical max', () => {
    expect(detectPrs([makeSet({ id: 1, exerciseId: 7, weightKg: 95 })], prevMax([[7, 100]]))).toEqual([]);
  });

  it('detects fractional improvements (weights are reals)', () => {
    const events = detectPrs([makeSet({ id: 1, exerciseId: 7, weightKg: 100.5 })], prevMax([[7, 100]]));
    expect(events).toHaveLength(1);
  });

  it('never qualifies bodyweight sets (0 kg), even as a first-ever set', () => {
    expect(detectPrs([makeSet({ id: 1, exerciseId: 7, weightKg: 0 })], prevMax())).toEqual([]);
  });

  it('never qualifies non-positive weights against an existing max', () => {
    expect(detectPrs([makeSet({ id: 1, exerciseId: 7, weightKg: 0 })], prevMax([[7, 100]]))).toEqual([]);
  });

  it('treats a first weighted set as a PR even when the historical max is 0 (bodyweight history)', () => {
    const events = detectPrs([makeSet({ id: 1, exerciseId: 7, weightKg: 20 })], prevMax([[7, 0]]));
    expect(events).toEqual([{ exerciseId: 7, setId: 1, weightKg: 20 }]);
  });

  it('emits at most one PR event per exercise per workout', () => {
    // Three sets in one session, each beating the last — still a single event.
    const events = detectPrs(
      [
        makeSet({ id: 1, exerciseId: 7, weightKg: 102, setNumber: 1 }),
        makeSet({ id: 2, exerciseId: 7, weightKg: 106, setNumber: 2 }),
        makeSet({ id: 3, exerciseId: 7, weightKg: 110, setNumber: 3 }),
      ],
      prevMax([[7, 100]]),
    );
    expect(events).toHaveLength(1);
  });

  it('flags the single heaviest qualifying set of the workout', () => {
    const events = detectPrs(
      [
        makeSet({ id: 1, exerciseId: 7, weightKg: 100, setNumber: 1 }),
        makeSet({ id: 2, exerciseId: 7, weightKg: 110, setNumber: 2 }),
        makeSet({ id: 3, exerciseId: 7, weightKg: 105, setNumber: 3 }),
      ],
      prevMax([[7, 95]]),
    );
    expect(events).toEqual([{ exerciseId: 7, setId: 2, weightKg: 110 }]);
  });

  it('breaks ties between equally heavy sets toward the earliest set number', () => {
    // You hit the PR the first time you lifted that weight.
    const events = detectPrs(
      [
        makeSet({ id: 5, exerciseId: 7, weightKg: 110, setNumber: 2 }),
        makeSet({ id: 4, exerciseId: 7, weightKg: 110, setNumber: 1 }),
      ],
      prevMax([[7, 100]]),
    );
    expect(events).toEqual([{ exerciseId: 7, setId: 4, weightKg: 110 }]);
  });

  it('evaluates each exercise independently', () => {
    const events = detectPrs(
      [
        makeSet({ id: 1, exerciseId: 7, weightKg: 105, setNumber: 1 }), // beats 100 → PR
        makeSet({ id: 2, exerciseId: 8, weightKg: 40, setNumber: 1 }), // below 60 → no PR
        makeSet({ id: 3, exerciseId: 9, weightKg: 80, setNumber: 1 }), // first ever → PR
      ],
      prevMax([
        [7, 100],
        [8, 60],
      ]),
    );
    expect(events).toEqual([
      { exerciseId: 7, setId: 1, weightKg: 105 },
      { exerciseId: 9, setId: 3, weightKg: 80 },
    ]);
  });

  it('ignores an exercise whose sets are all bodyweight this workout, despite weighted history', () => {
    const events = detectPrs(
      [
        makeSet({ id: 1, exerciseId: 7, weightKg: 0, setNumber: 1 }),
        makeSet({ id: 2, exerciseId: 7, weightKg: 0, setNumber: 2 }),
      ],
      prevMax([[7, 100]]),
    );
    expect(events).toEqual([]);
  });
});
