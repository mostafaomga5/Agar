import { TRPCError } from "@trpc/server";
import { and, avg, count, desc, eq, gt, gte, inArray, like, lt, lte, notInArray, or } from "drizzle-orm";
import { getDb } from "./db";
import { listings, messages, rentalRequests, reviews, users } from "../drizzle/schema";

export type ListingInput = {
  title: string;
  category: string;
  city: string;
  neighborhood: string;
  pricePerUnit: number;
  unit: string;
  description: string;
  imageUrls: string[];
};

function databaseUnavailable(): never {
  throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "الخدمة غير متاحة مؤقتًا. حاول مرة أخرى لاحقًا." });
}

export async function listListings(filters: { category?: string; city?: string; query?: string; minPrice?: number; maxPrice?: number; dateFrom?: string; dateTo?: string }) {
  const db = await getDb();
  if (!db) return [];
  if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "الحد الأدنى للسعر يجب ألا يتجاوز الحد الأعلى" });
  }
  if (filters.dateFrom && filters.dateTo && filters.dateFrom >= filters.dateTo) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "تاريخ النهاية يجب أن يأتي بعد تاريخ البداية" });
  }
  const clauses = [eq(listings.status, "published")];
  if (filters.category) clauses.push(eq(listings.category, filters.category));
  if (filters.city) clauses.push(like(listings.city, `%${filters.city}%`));
  if (filters.minPrice !== undefined) clauses.push(gte(listings.pricePerUnit, filters.minPrice));
  if (filters.maxPrice !== undefined) clauses.push(lte(listings.pricePerUnit, filters.maxPrice));
  if (filters.query) {
    const term = `%${filters.query}%`;
    clauses.push(or(like(listings.title, term), like(listings.description, term), like(listings.category, term))!);
  }
  if (filters.dateFrom && filters.dateTo) {
    const unavailable = await db.select({ listingId: rentalRequests.listingId }).from(rentalRequests)
      .where(and(inArray(rentalRequests.status, ["pending", "approved", "handed_over"]), lt(rentalRequests.startDate, filters.dateTo), gt(rentalRequests.endDate, filters.dateFrom)));
    const blockedIds = [...new Set(unavailable.map(row => row.listingId))];
    if (blockedIds.length) clauses.push(notInArray(listings.id, blockedIds));
  }
  const rows = await db.select({
    id: listings.id,
    ownerId: listings.ownerId,
    title: listings.title,
    category: listings.category,
    city: listings.city,
    neighborhood: listings.neighborhood,
    pricePerUnit: listings.pricePerUnit,
    unit: listings.unit,
    description: listings.description,
    imageUrls: listings.imageUrls,
    createdAt: listings.createdAt,
    ownerName: users.name,
  }).from(listings).leftJoin(users, eq(listings.ownerId, users.id)).where(and(...clauses)).orderBy(desc(listings.createdAt)).limit(60);
  const ratingRows = await db.select({ ownerId: reviews.recipientId, rating: avg(reviews.rating), reviewCount: count(reviews.id) })
    .from(reviews).groupBy(reviews.recipientId);
  const ratingMap = new Map(ratingRows.map(row => [row.ownerId, { rating: Number(row.rating ?? 0), reviewCount: Number(row.reviewCount ?? 0) }]));
  return rows.map(row => ({ ...row, ...(ratingMap.get(row.ownerId) ?? { rating: 0, reviewCount: 0 }) }));
}

export async function getListing(id: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const rows = await db.select({
    id: listings.id,
    ownerId: listings.ownerId,
    title: listings.title,
    category: listings.category,
    city: listings.city,
    neighborhood: listings.neighborhood,
    pricePerUnit: listings.pricePerUnit,
    unit: listings.unit,
    description: listings.description,
    imageUrls: listings.imageUrls,
    createdAt: listings.createdAt,
    ownerName: users.name,
  }).from(listings).leftJoin(users, eq(listings.ownerId, users.id)).where(and(eq(listings.id, id), eq(listings.status, "published"))).limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "الإعلان غير موجود" });
  const [summary] = await db.select({ rating: avg(reviews.rating), reviewCount: count(reviews.id) }).from(reviews).where(eq(reviews.recipientId, rows[0].ownerId));
  const publicReviews = await db.select({ rating: reviews.rating, body: reviews.body, createdAt: reviews.createdAt, authorName: users.name })
    .from(reviews).innerJoin(users, eq(reviews.authorId, users.id)).where(eq(reviews.recipientId, rows[0].ownerId)).orderBy(desc(reviews.createdAt)).limit(6);
  return { ...rows[0], rating: Number(summary?.rating ?? 0), reviewCount: Number(summary?.reviewCount ?? 0), publicReviews };
}

export async function createListing(ownerId: number, input: ListingInput) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db.insert(listings).values({ ...input, imageUrls: JSON.stringify(input.imageUrls), ownerId, status: "published" });
  return { id: Number(result[0].insertId) };
}

export async function updateListing(ownerId: number, input: ListingInput & { id: number }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const rows = await db.select({ id: listings.id }).from(listings).where(and(eq(listings.id, input.id), eq(listings.ownerId, ownerId))).limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "الإعلان غير موجود أو لا تملك صلاحية تعديله" });
  const { id, imageUrls, ...fields } = input;
  await db.update(listings).set({ ...fields, imageUrls: JSON.stringify(imageUrls) }).where(eq(listings.id, id));
  return { success: true };
}

export async function setListingVisibility(ownerId: number, id: number, visible: boolean) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db.update(listings).set({ status: visible ? "published" : "hidden" }).where(and(eq(listings.id, id), eq(listings.ownerId, ownerId)));
  if (!result[0].affectedRows) throw new TRPCError({ code: "NOT_FOUND", message: "الإعلان غير موجود أو لا تملك صلاحية تعديله" });
  return { success: true };
}

export async function createBooking(renterId: number, input: { listingId: number; startDate: string; endDate: string; note?: string }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const [listing] = await db.select().from(listings).where(and(eq(listings.id, input.listingId), eq(listings.status, "published"))).limit(1);
  if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "الإعلان غير موجود أو لم يعد متاحًا" });
  if (listing.ownerId === renterId) throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكنك طلب استئجار إعلانك الخاص" });
  const start = new Date(`${input.startDate}T00:00:00Z`).getTime();
  const end = new Date(`${input.endDate}T00:00:00Z`).getTime();
  const totalDays = Math.ceil((end - start) / 86_400_000);
  if (!Number.isFinite(start) || !Number.isFinite(end) || totalDays < 1 || totalDays > 90) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "اختر فترة صحيحة من يوم إلى 90 يومًا" });
  }
  const overlaps = await db.select({ id: rentalRequests.id }).from(rentalRequests)
    .where(and(
      eq(rentalRequests.listingId, input.listingId),
      inArray(rentalRequests.status, ["pending", "approved", "handed_over"]),
      lt(rentalRequests.startDate, input.endDate),
      gt(rentalRequests.endDate, input.startDate),
    )).limit(1);
  if (overlaps[0]) throw new TRPCError({ code: "CONFLICT", message: "الفترة المختارة تتعارض مع طلب آخر. جرّب تواريخ مختلفة." });
  const subtotal = listing.pricePerUnit * totalDays;
  const serviceFee = Math.round(subtotal * 0.05);
  const totalPrice = subtotal + serviceFee;
  const result = await db.insert(rentalRequests).values({
    listingId: input.listingId,
    renterId,
    startDate: input.startDate,
    endDate: input.endDate,
    totalDays,
    unitPrice: listing.pricePerUnit,
    serviceFee,
    totalPrice,
    note: input.note?.trim() || null,
    status: "pending",
  });
  return { id: Number(result[0].insertId), totalDays, subtotal, serviceFee, totalPrice, status: "pending" as const };
}

export async function getDashboard(userId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const [myListings, bookings] = await Promise.all([
    db.select().from(listings).where(eq(listings.ownerId, userId)).orderBy(desc(listings.createdAt)),
    db.select({
      id: rentalRequests.id,
      listingId: rentalRequests.listingId,
      renterId: rentalRequests.renterId,
      startDate: rentalRequests.startDate,
      endDate: rentalRequests.endDate,
      totalDays: rentalRequests.totalDays,
      totalPrice: rentalRequests.totalPrice,
      status: rentalRequests.status,
      createdAt: rentalRequests.createdAt,
      listingTitle: listings.title,
      ownerId: listings.ownerId,
      renterName: users.name,
    }).from(rentalRequests)
      .innerJoin(listings, eq(rentalRequests.listingId, listings.id))
      .innerJoin(users, eq(rentalRequests.renterId, users.id))
      .where(or(eq(rentalRequests.renterId, userId), eq(listings.ownerId, userId)))
      .orderBy(desc(rentalRequests.createdAt)),
  ]);
  const authoredReviews = await db.select({ requestId: reviews.requestId }).from(reviews).where(eq(reviews.authorId, userId));
  return { myListings, bookings, reviewedRequestIds: authoredReviews.map(review => review.requestId) };
}

export async function transitionBooking(userId: number, id: number, nextStatus: "approved" | "rejected" | "handed_over" | "returned" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const [booking] = await db.select({ request: rentalRequests, ownerId: listings.ownerId })
    .from(rentalRequests).innerJoin(listings, eq(rentalRequests.listingId, listings.id))
    .where(eq(rentalRequests.id, id)).limit(1);
  if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "طلب الاستئجار غير موجود" });
  const { request, ownerId } = booking;
  const isOwner = ownerId === userId;
  const isRenter = request.renterId === userId;
  if (!isOwner && !isRenter) throw new TRPCError({ code: "FORBIDDEN", message: "لا تملك صلاحية تحديث هذا الطلب" });
  const allowed =
    (nextStatus === "approved" || nextStatus === "rejected") && isOwner && request.status === "pending" ||
    nextStatus === "handed_over" && isOwner && request.status === "approved" ||
    nextStatus === "returned" && isRenter && request.status === "handed_over" ||
    nextStatus === "completed" && isOwner && request.status === "returned" ||
    nextStatus === "cancelled" && (isOwner || isRenter) && ["pending", "approved"].includes(request.status);
  if (!allowed) throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن نقل الطلب إلى هذه الحالة الآن" });
  await db.update(rentalRequests).set({ status: nextStatus }).where(eq(rentalRequests.id, id));
  return { success: true };
}

async function requireBookingParticipant(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, requestId: number, userId: number) {
  const [row] = await db.select({ request: rentalRequests, ownerId: listings.ownerId })
    .from(rentalRequests).innerJoin(listings, eq(rentalRequests.listingId, listings.id))
    .where(eq(rentalRequests.id, requestId)).limit(1);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "طلب الاستئجار غير موجود" });
  if (row.request.renterId !== userId && row.ownerId !== userId) throw new TRPCError({ code: "FORBIDDEN", message: "هذه المحادثة خاصة بأطراف الطلب" });
  return { request: row.request, ownerId: row.ownerId };
}

export async function listMessages(userId: number, requestId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await requireBookingParticipant(db, requestId, userId);
  return db.select({ id: messages.id, senderId: messages.senderId, content: messages.content, createdAt: messages.createdAt, senderName: users.name })
    .from(messages).innerJoin(users, eq(messages.senderId, users.id)).where(eq(messages.requestId, requestId)).orderBy(messages.createdAt);
}

export async function sendMessage(userId: number, requestId: number, content: string) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const { request, ownerId } = await requireBookingParticipant(db, requestId, userId);
  const recipientId = request.renterId === userId ? ownerId : request.renterId;
  await db.insert(messages).values({ requestId, senderId: userId, recipientId, content: content.trim() });
  return { success: true };
}

export async function createReview(userId: number, requestId: number, rating: number, body: string) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const { request, ownerId } = await requireBookingParticipant(db, requestId, userId);
  if (request.status !== "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "يمكن التقييم بعد اكتمال الاستئجار فقط" });
  const recipientId = request.renterId === userId ? ownerId : request.renterId;
  const existing = await db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.requestId, requestId), eq(reviews.authorId, userId))).limit(1);
  if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "سبق أن أرسلت تقييمك لهذا الطلب" });
  await db.insert(reviews).values({ requestId, authorId: userId, recipientId, rating, body: body.trim() });
  return { success: true };
}
