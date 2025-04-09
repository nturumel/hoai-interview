CREATE TABLE `Chat` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`title` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Document` (
	`id` text NOT NULL,
	`createdAt` integer NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`kind` text DEFAULT 'text' NOT NULL,
	`userId` text NOT NULL,
	PRIMARY KEY(`id`, `createdAt`)
);
--> statement-breakpoint
CREATE TABLE `Invoice` (
	`id` text PRIMARY KEY NOT NULL,
	`vendorId` text NOT NULL,
	`invoiceNumber` text NOT NULL,
	`customerName` text NOT NULL,
	`customerAddress` text NOT NULL,
	`invoiceDate` integer NOT NULL,
	`dueDate` integer NOT NULL,
	`totalAmount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`lastEditedBy` text,
	FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vendor_invoice_idx` ON `Invoice` (`vendorId`,`invoiceNumber`,`totalAmount`);--> statement-breakpoint
CREATE TABLE `InvoiceDocument` (
	`invoiceId` text NOT NULL,
	`documentUrl` text NOT NULL,
	`documentName` text NOT NULL,
	PRIMARY KEY(`invoiceId`, `documentUrl`),
	FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `LineItem` (
	`id` text PRIMARY KEY NOT NULL,
	`invoiceId` text NOT NULL,
	`description` text NOT NULL,
	`quantity` real NOT NULL,
	`unitPrice` real NOT NULL,
	`amount` real NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Message` (
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
CREATE TABLE `Suggestion` (
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
CREATE TABLE `Vendor` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`address` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer DEFAULT '"2025-04-09T15:19:37.946Z"' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Vote` (
	`chatId` text NOT NULL,
	`messageId` text NOT NULL,
	`isUpvoted` integer NOT NULL,
	PRIMARY KEY(`chatId`, `messageId`),
	FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON UPDATE no action ON DELETE no action
);
