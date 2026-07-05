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
