CREATE TABLE `clientTherapistRelationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`therapistId` int NOT NULL,
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean DEFAULT true,
	CONSTRAINT `clientTherapistRelationships_id` PRIMARY KEY(`id`),
	CONSTRAINT `clientTherapistRelationships_clientId_therapistId_unique` UNIQUE(`clientId`,`therapistId`)
);
--> statement-breakpoint
CREATE TABLE `dayRatings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ratingDate` timestamp NOT NULL,
	`clientRating` enum('negative','mostly_negative','neutral','mostly_positive','positive'),
	`therapistRating` enum('negative','mostly_negative','neutral','mostly_positive','positive'),
	`therapistId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dayRatings_id` PRIMARY KEY(`id`),
	CONSTRAINT `dayRatings_userId_ratingDate_unique` UNIQUE(`userId`,`ratingDate`)
);
--> statement-breakpoint
CREATE TABLE `inviteTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`inviterId` int NOT NULL,
	`inviterRole` enum('client','therapist') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`usedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inviteTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `inviteTokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `journalEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`text` text NOT NULL,
	`entryDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`therapistComments` text,
	`isHighlighted` boolean DEFAULT false,
	CONSTRAINT `journalEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('daily_reminder','new_entry','batch_digest') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`metadata` text,
	CONSTRAINT `notificationLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isEnabled` boolean DEFAULT true,
	`reminderTime` varchar(5),
	`reminderTimeEnd` varchar(5),
	`notifyIfNoEntries` boolean DEFAULT true,
	`notifyIfFewEntries` boolean DEFAULT true,
	`minEntriesThreshold` int DEFAULT 3,
	`therapistNotificationMode` enum('per_client','batch_digest'),
	`batchDigestTime` varchar(5),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `telegramId` bigint;--> statement-breakpoint
ALTER TABLE `users` ADD `userRole` enum('client','therapist') DEFAULT 'client';--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_telegramId_unique` UNIQUE(`telegramId`);