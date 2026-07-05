CREATE TABLE `achievements` (
	`badgeId` text PRIMARY KEY NOT NULL,
	`unlockedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`muscleGroup` text NOT NULL,
	`equipment` text NOT NULL,
	`isCustom` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_name_unique` ON `exercises` (`name`);--> statement-breakpoint
CREATE TABLE `sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workoutId` integer NOT NULL,
	`exerciseId` integer NOT NULL,
	`setNumber` integer NOT NULL,
	`reps` integer NOT NULL,
	`weightKg` real NOT NULL,
	`isPr` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`workoutId`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sets_workoutId_idx` ON `sets` (`workoutId`);--> statement-breakpoint
CREATE INDEX `sets_exerciseId_idx` ON `sets` (`exerciseId`);--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`startedAt` integer NOT NULL,
	`finishedAt` integer,
	`name` text,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `workouts_finishedAt_idx` ON `workouts` (`finishedAt`);