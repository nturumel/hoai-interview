CREATE TABLE `Attachment` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`uploadedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `InvoiceProcessedDocument` (
	`invoiceId` text NOT NULL,
	`processedDocumentId` text NOT NULL,
	PRIMARY KEY(`invoiceId`, `processedDocumentId`),
	FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`processedDocumentId`) REFERENCES `Attachment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `MessageAttachment` (
	`messageId` text NOT NULL,
	`attachmentId` text NOT NULL,
	PRIMARY KEY(`messageId`, `attachmentId`),
	FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`attachmentId`) REFERENCES `Attachment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP TABLE `ProcessedDocument`;--> statement-breakpoint
ALTER TABLE `Message` DROP COLUMN `experimental_attachments`;