import { ArrowRight, BadgeCheck, CalendarDays, ChevronLeft, Heart, MapPin, ShieldCheck, Star } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import SiteHeader from "@/components/SiteHeader";
import { listings as samples, type RentalListing } from "@/data/listings";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function ListingDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const numericId = /^[0-9]+$/.test(id) ? Number(id) : null;
  const auth = useAuth();
  const live = trpc.marketplace.listing.useQuery({ id: numericId || 1 }, { enabled: numericId !== null, retry: false });
  const sample = samples.find(item => item.id === id);
  const listing = useMemo<RentalListing | undefined>(() => {
    if (numericId && live.data) {
      let images: string[] = [];
      try { images = JSON.parse(live.data.imageUrls) as string[]; } catch { images = []; }
      return {
        id: String(live.data.id), title: live.data.title, category: live.data.category, city: live.data.city,
        neighborhood: live.data.neighborhood, price: live.data.pricePerUnit, unit: live.data.unit,
        rating: Number(live.data.rating ?? 0), reviews: Number(live.data.reviewCount ?? 0), image: images[0] || samples[0].image,
        owner: live.data.ownerName || "عضو أجاري", description: live.data.description,
      };
    }
    return sample;
  }, [live.data, numericId, sample]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  const booking = trpc.marketplace.createBooking.useMutation({ onSuccess: result => toast.success(`وصل طلبك للمالك — ${result.totalPrice.toLocaleString("ar-SA")} ر.س شامل رسوم الخدمة.`), onError: error => toast.error(error.message) });
  const days = from && to ? Math.max(0, Math.ceil((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000)) : 0;
  const fee = listing ? Math.round(listing.price * days * 0.05) : 0;
  const total = listing ? listing.price * days + fee : 0;
  const onBook = (event: FormEvent) => {
    event.preventDefault();
    if (!listing) return;
    if (!auth.isAuthenticated) { startLogin(); return; }
    if (!numericId) { toast.info("هذا إعلان توضيحي للعرض. الحجز متاح للإعلانات الحقيقية بعد نشرها."); return; }
    booking.mutate({ listingId: numericId, startDate: from, endDate: to, note });
  };

  if (!listing) return <div className="page-shell"><SiteHeader /><main className="page-container empty-state not-found-inline"><h2>{live.isLoading ? "نحمّل تفاصيل الإعلان…" : "الإعلان غير موجود"}</h2><Link href="/explore" className="button button-dark">العودة إلى الاكتشاف <ArrowRight size={16} /></Link></main></div>;
  const publicReviews = numericId ? live.data?.publicReviews ?? [] : [];

  return <div className="page-shell"><SiteHeader /><main className="page-container detail-page"><div className="breadcrumb"><Link href="/">الرئيسية</Link><span>/</span><Link href="/explore">الاكتشاف</Link><span>/</span><span>{listing.category}</span></div>
    <div className="detail-heading"><div><span className="eyebrow">{listing.category} · أجاري</span><h1>{listing.title}</h1><div className="detail-location"><MapPin size={15} /> {listing.neighborhood}، {listing.city}<span className="detail-dot" />{listing.isDemo ? <span>مثال توضيحي</span> : listing.reviews > 0 ? <><Star size={15} fill="currentColor" /> {listing.rating.toFixed(1)} <span>({listing.reviews} تقييم)</span></> : <span>إعلان جديد</span>}</div></div><button className="button button-outline" type="button"><Heart size={16} /> حفظ</button></div>
    <div className="detail-gallery"><img className="detail-main-image" src={listing.image} alt={listing.title} /><div className="detail-photo-side"><img src={listing.image} alt="تفاصيل الإعلان" /><div className="detail-photo-note"><ShieldCheck size={19} /><span>استأجر وأنت مطمئن<small>اطّلع على التفاصيل قبل إرسال طلبك</small></span></div></div></div>
    {listing.isDemo && <div className="demo-note detail-demo-note"><span className="demo-note-dot" /> مثال توضيحي فقط، وليس إعلانًا حقيقيًا متاحًا للحجز.</div>}
    <div className="detail-layout"><section className="detail-copy"><div className="owner-row"><div className="owner-avatar">{listing.owner.slice(0, 1)}</div><div><strong>{listing.owner}</strong><small><BadgeCheck size={13} /> {listing.isDemo ? "بيانات للعرض" : "عضو أجاري"}</small></div><span className="owner-response">{listing.reviews ? `${listing.rating.toFixed(1)} / 5 · ${listing.reviews} تقييم` : "لا توجد مراجعات بعد"}</span></div><div className="detail-separator" /><h2>عن هذا الإعلان</h2><p className="detail-description">{listing.description}</p><div className="detail-features"><div><ShieldCheck size={19} /><span>تواصل مباشر<small>نسّق التفاصيل مع المالك</small></span></div><div><CalendarDays size={19} /><span>مدة مرنة<small>حدد الأيام التي تناسبك</small></span></div><div><Star size={19} /><span>تقييمات واضحة<small>تجارب الأعضاء السابقين</small></span></div></div><div className="detail-separator" /><h2>تجارب أعضاء أجاري</h2>{publicReviews.length ? <div className="review-list">{publicReviews.map((review, index) => <article key={`${review.createdAt}-${index}`} className="public-review"><div className="public-review-heading"><strong>{review.authorName || "عضو أجاري"}</strong><span><Star size={13} fill="currentColor" /> {review.rating} / 5</span></div><p>{review.body}</p></article>)}</div> : <p className="muted-copy">{listing.isDemo ? "المراجعات الظاهرة في أمثلة العرض ليست بيانات حقيقية." : "لم ينشر هذا العضو مراجعات بعد. ستظهر هنا بعد اكتمال تجارب الاستئجار."}</p>}<div className="detail-separator" /><h2>معلومات مفيدة</h2><p className="muted-copy">تأكد من الاتفاق على طريقة الاستلام والإرجاع مع المالك عبر الرسائل المرتبطة بطلب الحجز.</p></section>
      <aside className="booking-card"><div className="booking-price"><strong>{listing.price.toLocaleString("ar-SA")} ر.س</strong><span> / {listing.unit}</span></div><div className="booking-rating">{listing.reviews > 0 ? <><Star size={14} fill="currentColor" /> {listing.rating.toFixed(1)} · {listing.reviews} تقييم</> : listing.isDemo ? "بيانات نموذجية" : "لا توجد تقييمات بعد"}</div><form onSubmit={onBook}><div className="booking-dates"><label>من<input aria-label="تاريخ بداية الاستئجار" type="date" required value={from} min={new Date().toISOString().slice(0, 10)} onChange={e => setFrom(e.target.value)} /></label><label>إلى<input aria-label="تاريخ نهاية الاستئجار" type="date" required value={to} min={from || new Date().toISOString().slice(0, 10)} onChange={e => setTo(e.target.value)} /></label></div><label className="booking-note-label">رسالة للمالك <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="أخبره بما تحتاجه (اختياري)" rows={3} /></label>{days > 0 && <div className="booking-summary"><div><span>{listing.price.toLocaleString("ar-SA")} × {days} أيام</span><b>{(listing.price * days).toLocaleString("ar-SA")} ر.س</b></div><div><span>رسوم الخدمة (5%)</span><b>{fee.toLocaleString("ar-SA")} ر.س</b></div><div className="booking-total"><strong>الإجمالي التقديري</strong><strong>{total.toLocaleString("ar-SA")} ر.س</strong></div></div>}<button className="button button-dark book-button" type="submit" disabled={booking.isPending}>{booking.isPending ? "جارٍ إرسال الطلب…" : auth.isAuthenticated ? "أرسل طلب الاستئجار" : "سجّل الدخول وتابع"}<ChevronLeft size={16} /></button><p className="booking-footnote"><ShieldCheck size={14} /> لن يتم خصم أي مبلغ هنا</p></form></aside>
    </div><Link href="/explore" className="back-link"><ArrowRight size={16} /> العودة إلى جميع الإعلانات</Link></main></div>;
}
