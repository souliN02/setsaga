import { EQUIPMENT, MUSCLE_GROUPS, type Equipment, type MuscleGroup } from '@/lib/db/schema';

const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  full_body: 'Full body',
};

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  other: 'Other',
};

export function formatMuscleGroup(muscleGroup: MuscleGroup): string {
  return MUSCLE_GROUP_LABELS[muscleGroup];
}

export function formatEquipment(equipment: Equipment): string {
  return EQUIPMENT_LABELS[equipment];
}

export const MUSCLE_GROUP_OPTIONS = MUSCLE_GROUPS.map((value) => ({
  value,
  label: MUSCLE_GROUP_LABELS[value],
}));

export const EQUIPMENT_OPTIONS = EQUIPMENT.map((value) => ({
  value,
  label: EQUIPMENT_LABELS[value],
}));

// Single choke point for weight display (SPEC.md section 11) — a future unit
// toggle changes only this function.
export function formatWeight(weightKg: number): string {
  const rounded = Math.round(weightKg * 100) / 100;
  return `${rounded} kg`;
}

/** Elapsed duration from ms: "0:07", "45:12", "1:23:45". */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const two = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${minutes}:${two(seconds)}`;
}
