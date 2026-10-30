import {
  date,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/** Users created by the existing Manus OAuth integration. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const listings = mysqlTable(
  "rental_listings",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id),
    title: varchar("title", { length: 180 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    city: varchar("city", { length: 96 }).notNull(),
    neighborhood: varchar("neighborhood", { length: 128 }).notNull(),
    pricePerUnit: int("pricePerUnit").notNull(),
    unit: varchar("unit", { length: 32 }).notNull().default("يوم"),
    description: text("description").notNull(),
    imageUrls: text("imageUrls").notNull(),
    status: mysqlEnum("status", ["published", "hidden"]).default("published").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    categoryStatusIdx: index("rental_listings_category_status_idx").on(table.category, table.status),
    cityStatusIdx: index("rental_listings_city_status_idx").on(table.city, table.status),
    ownerIdx: index("rental_listings_owner_idx").on(table.ownerId),
  }),
);

export const rentalRequests = mysqlTable(
  "rental_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    listingId: int("listingId").notNull().references(() => listings.id),
    renterId: int("renterId").notNull().references(() => users.id),
    startDate: date("startDate", { mode: "string" }).notNull(),
    endDate: date("endDate", { mode: "string" }).notNull(),
    totalDays: int("totalDays").notNull(),
    unitPrice: int("unitPrice").notNull(),
    serviceFee: int("serviceFee").notNull(),
    totalPrice: int("totalPrice").notNull(),
    note: text("note"),
    status: mysqlEnum("status", ["pending", "approved", "handed_over", "returned", "completed", "cancelled", "rejected"]).default("pending").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    renterIdx: index("rental_requests_renter_idx").on(table.renterId),
    listingDateIdx: index("rental_requests_listing_dates_idx").on(table.listingId, table.startDate, table.endDate),
    statusIdx: index("rental_requests_status_idx").on(table.status),
  }),
);

export const messages = mysqlTable(
  "rental_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    requestId: int("requestId").notNull().references(() => rentalRequests.id),
    senderId: int("senderId").notNull().references(() => users.id),
    recipientId: int("recipientId").notNull().references(() => users.id),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    requestTimeIdx: index("rental_messages_request_time_idx").on(table.requestId, table.createdAt),
  }),
);

export const reviews = mysqlTable(
  "rental_reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    requestId: int("requestId").notNull().references(() => rentalRequests.id),
    authorId: int("authorId").notNull().references(() => users.id),
    recipientId: int("recipientId").notNull().references(() => users.id),
    rating: int("rating").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    requestIdx: index("rental_reviews_request_idx").on(table.requestId),
    recipientIdx: index("rental_reviews_recipient_idx").on(table.recipientId),
  }),
);

export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;
export type RentalRequest = typeof rentalRequests.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;
