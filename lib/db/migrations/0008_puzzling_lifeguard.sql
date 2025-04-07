PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Suggestion` (
	`id` text PRIMARY KEY NOT NULL,
	`documentId` text NOT NULL,
	`documentCreatedAt` integer NOT NULL,
	`originalText` text NOT NULL,
	`suggestedText` text NOT NULL,
	`description` text,
	`isResolved` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`documentId`,`documentCreatedAt`) REFERENCES `Document`(`id`,`createdAt`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Suggestion`("id", "documentId", "documentCreatedAt", "originalText", "suggestedText", "description", "isResolved", "createdAt", "userId") SELECT "id", "documentId", "documentCreatedAt", "originalText", "suggestedText", "description", "isResolved", "createdAt", "userId" FROM `Suggestion`;--> statement-breakpoint
DROP TABLE `Suggestion`;--> statement-breakpoint
ALTER TABLE `__new_Suggestion` RENAME TO `Suggestion`;--> statement-breakpoint
PRAGMA foreign_keys=ON;