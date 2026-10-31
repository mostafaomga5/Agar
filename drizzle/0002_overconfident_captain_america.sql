ALTER TABLE `rental_requests` ADD `startTime` time;--> statement-breakpoint
ALTER TABLE `rental_requests` ADD `endTime` time;--> statement-breakpoint
ALTER TABLE `rental_requests` ADD `totalUnits` int;--> statement-breakpoint
ALTER TABLE `rental_requests` ADD `rentalUnit` varchar(32);