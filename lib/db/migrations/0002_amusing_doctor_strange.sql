CREATE TABLE `InvoiceDocument` (
	`invoiceId` text NOT NULL,
	`documentId` text NOT NULL,
	`documentUrl` text NOT NULL,
	`documentName` text NOT NULL,
	PRIMARY KEY(`invoiceId`, `documentId`),
	FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP TABLE `ProcessedDocument`;