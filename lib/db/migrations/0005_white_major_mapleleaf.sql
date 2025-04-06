ALTER TABLE `Invoice` ADD `customerAddress` text NOT NULL;--> statement-breakpoint
ALTER TABLE `Invoice` ADD `currency` text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `Vendor` ADD `address` text NOT NULL;