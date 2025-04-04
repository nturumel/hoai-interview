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
CREATE TABLE `ProcessedDocument` (
	`id` text PRIMARY KEY NOT NULL,
	`invoiceId` text NOT NULL,
	`documentUrl` text NOT NULL,
	`documentHash` text NOT NULL,
	`uploadedAt` integer NOT NULL,
	FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `document_hash_idx` ON `ProcessedDocument` (`documentHash`);--> statement-breakpoint
CREATE TABLE `Vendor` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`address` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `Document` ADD `userId` text NOT NULL;--> statement-breakpoint
ALTER TABLE `Message` ADD `experimental_attachments` blob DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `Message` ADD `parts` blob DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `Suggestion` ADD `userId` text NOT NULL;