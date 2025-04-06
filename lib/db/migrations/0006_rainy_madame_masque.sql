PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Document` (
	`id` text NOT NULL,
	`createdAt` integer NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`kind` text DEFAULT 'text' NOT NULL,
	`userId` text NOT NULL,
	PRIMARY KEY(`id`, `createdAt`)
);
--> statement-breakpoint
INSERT INTO `__new_Document`("id", "createdAt", "title", "content", "kind", "userId") SELECT "id", "createdAt", "title", "content", "kind", "userId" FROM `Document`;--> statement-breakpoint
DROP TABLE `Document`;--> statement-breakpoint
ALTER TABLE `__new_Document` RENAME TO `Document`;--> statement-breakpoint
PRAGMA foreign_keys=ON;