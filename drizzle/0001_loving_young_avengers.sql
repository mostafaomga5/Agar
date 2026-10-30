CREATE TABLE `rental_listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`category` varchar(64) NOT NULL,
	`city` varchar(96) NOT NULL,
	`neighborhood` varchar(128) NOT NULL,
	`pricePerUnit` int NOT NULL,
	`unit` varchar(32) NOT NULL DEFAULT 'يوم',
	`description` text NOT NULL,
	`imageUrls` text NOT NULL,
	`status` enum('published','hidden') NOT NULL DEFAULT 'published',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rental_listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`renterId` int NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`totalDays` int NOT NULL,
	`unitPrice` int NOT NULL,
	`serviceFee` int NOT NULL,
	`totalPrice` int NOT NULL,
	`note` text,
	`status` enum('pending','approved','handed_over','returned','completed','cancelled','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rental_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`authorId` int NOT NULL,
	`recipientId` int NOT NULL,
	`rating` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rental_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rental_listings` ADD CONSTRAINT `rental_listings_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_messages` ADD CONSTRAINT `rental_messages_requestId_rental_requests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `rental_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_messages` ADD CONSTRAINT `rental_messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_messages` ADD CONSTRAINT `rental_messages_recipientId_users_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_requests` ADD CONSTRAINT `rental_requests_listingId_rental_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `rental_listings`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_requests` ADD CONSTRAINT `rental_requests_renterId_users_id_fk` FOREIGN KEY (`renterId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_reviews` ADD CONSTRAINT `rental_reviews_requestId_rental_requests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `rental_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_reviews` ADD CONSTRAINT `rental_reviews_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rental_reviews` ADD CONSTRAINT `rental_reviews_recipientId_users_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `rental_listings_category_status_idx` ON `rental_listings` (`category`,`status`);--> statement-breakpoint
CREATE INDEX `rental_listings_city_status_idx` ON `rental_listings` (`city`,`status`);--> statement-breakpoint
CREATE INDEX `rental_listings_owner_idx` ON `rental_listings` (`ownerId`);--> statement-breakpoint
CREATE INDEX `rental_messages_request_time_idx` ON `rental_messages` (`requestId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `rental_requests_renter_idx` ON `rental_requests` (`renterId`);--> statement-breakpoint
CREATE INDEX `rental_requests_listing_dates_idx` ON `rental_requests` (`listingId`,`startDate`,`endDate`);--> statement-breakpoint
CREATE INDEX `rental_requests_status_idx` ON `rental_requests` (`status`);--> statement-breakpoint
CREATE INDEX `rental_reviews_request_idx` ON `rental_reviews` (`requestId`);--> statement-breakpoint
CREATE INDEX `rental_reviews_recipient_idx` ON `rental_reviews` (`recipientId`);