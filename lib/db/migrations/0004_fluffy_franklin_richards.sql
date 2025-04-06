PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Message` (
	`id` text PRIMARY KEY NOT NULL,
	`chatId` text NOT NULL,
	`role` text NOT NULL,
	`content` blob NOT NULL,
	`createdAt` integer NOT NULL,
	`experimental_attachments` blob DEFAULT '[]',
	`parts` blob DEFAULT '[]',
	FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Message`("id", "chatId", "role", "content", "createdAt", "experimental_attachments", "parts") SELECT "id", "chatId", "role", "content", "createdAt", "experimental_attachments", "parts" FROM `Message`;--> statement-breakpoint
DROP TABLE `Message`;--> statement-breakpoint
ALTER TABLE `__new_Message` RENAME TO `Message`;--> statement-breakpoint
PRAGMA foreign_keys=ON;