import { ArrowLeft, BadgeCheck, CalendarDays, Check, CirclePlus, Clock3, LogOut, MessageCircle, Package, ShieldCheck, Star, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import SiteHeader from "@/components/SiteHeader";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const statusLabels: Record<string, string> = { pending: "بانتظار الموافقة", approved: "تمت الموافقة", handed_over: "تم التسليم", returned: "تم الإرجاع", completed: "مكتمل", cancelled: "ملغي", rejected: "مرفوض" };

function ReviewForm({ requestId, onDone }: { requestId: number; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const review = trpc.marketplace.review.useMutation({ onSuccess: () => { toast.success("شكرًا لمشاركة تجربتك"); onDone(); }, onError: error => toast.error(error.message) });
  const submit = (event: FormEvent) => { event.preventDefault(); review.mutate({ requestId, rating, body }); };
  return <form className="review-form" onSubmit={submit}><label>قيّم التجربة</label><div className="review-stars" dir="ltr">{[1, 2, 3, 4, 5].map(value => <button type="button" aria-label={`${value} نجوم`} className={value <= rating ? "selected" : ""} key={value} onClick={() => setRating(value)}><Star size={16} fill="currentColor" /></button>)}</div><input value={body} onChange={e => setBody(e.target.value)} minLength={5} maxLength={1500} required placeholder="اكتب ملاحظة مفيدة عن تجربتك" /><button className="button button-light button-small" type="submit" disabled={review.isPending}>{review.isPending ? "جارٍ الإرسال…" : "إرسال التقييم"}</button></form>;
}

export default function Dashboard() {
  const auth = useAuth();
  const utils = trpc.useUtils();
  const dashboard = trpc.marketplace.dashboard.useQuery(undefined, { enabled: auth.isAuthenticated, retry: false });
  const changeStatus = trpc.marketplace.changeBookingStatus.useMutation({ onSuccess: () => { toast.success("تم تحديث حالة الطلب"); void utils.marketplace.dashboard.invalidate(); }, onError: error => toast.error(error.message) });
  const visibility = trpc.marketplace.setListingVisibility.useMutation({ onSuccess: () => { toast.success("تم تحديث حالة الإعلان"); void utils.marketplace.dashboard.invalidate(); }, onError: error => toast.error(error.message) });
  if (auth.loading) return <div className="page-shell"><SiteHeader /><div className="loading-state">نجهز حسابك…</div></div>;
  if (!auth.isAuthenticated) return <div className="page-shell"><SiteHeader /><main className="page-container auth-prompt"><span className="auth-icon"><ShieldCheck size={28} /></span><span className="eyebrow">مساحتك في أجاري</span><h1>كل معاملاتك<br /><span className="text-accent">في مكان واحد.</span></h1><p>سجل الدخول لمتابعة طلبات الاستئجار والإعلانات والرسائل.</p><button className="button button-dark" onClick={startLogin}>سجّل الدخول <ArrowLeft size={16} /></button></main></div>;

  const data = dashboard.data;
  const nextStatuses = (item: { id: number; status: string; ownerId: number; renterId: number }) => {
    const owner = item.ownerId === auth.user?.id;
    const renter = item.renterId === auth.user?.id;
    if (item.status === "pending" && owner) return [{ label: "موافقة", status: "approved" as const, icon: Check }, { label: "رفض", status: "rejected" as const, icon: X }];
    if (item.status === "approved" && owner) return [{ label: "تم التسليم", status: "handed_over" as const, icon: Package }];
    if (item.status === "handed_over" && renter) return [{ label: "تم الإرجاع", status: "returned" as const, icon: Check }];
    if (item.status === "returned" && owner) return [{ label: "إكمال الطلب", status: "completed" as const, icon: BadgeCheck }];
    if (["pending", "approved"].includes(item.status)) return [{ label: "إلغاء", status: "cancelled" as const, icon: X }];
    return [];
  };

  return <div className="page-shell"><SiteHeader /><main className="page-container dashboard-page">
    <div className="breadcrumb"><Link href="/">الرئيسية</Link><span>/</span><span>حسابي</span></div>
    <div className="dashboard-welcome"><div><span className="eyebrow">مساحة أجاري الخاصة</span><h1>أهلًا، {auth.user?.name?.split(" ")[0] || "بك"}</h1><p>تابع طلباتك، إعلاناتك، وكل ما تشاركه مع مجتمع أجاري.</p></div><button className="button button-outline" onClick={() => void auth.logout()}>تسجيل الخروج <LogOut size={16} /></button></div>
    <div className="dashboard-metrics"><div><span className="metric-icon"><CalendarDays size={19} /></span><span><small>الطلبات</small><strong>{data?.bookings.length ?? 0}</strong></span></div><div><span className="metric-icon"><Package size={19} /></span><span><small>إعلاناتي</small><strong>{data?.myListings.length ?? 0}</strong></span></div><Link href="/messages"><span className="metric-icon"><MessageCircle size={19} /></span><span><small>الرسائل</small><strong>افتح الرسائل</strong></span><ArrowLeft size={15} /></Link></div>
    <div className="dashboard-columns"><section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">التحديثات الأخيرة</span><h2>طلبات الاستئجار</h2></div><Clock3 size={19} /></div>
      {dashboard.isLoading ? <div className="loading-state compact">نحمّل بياناتك…</div> : data?.bookings.length ? <div className="dashboard-list">{data.bookings.map(item => <article className="dashboard-row" key={item.id}><div className="request-thumb"><Package size={19} /></div><div className="request-main"><strong>{item.listingTitle}</strong><small>{item.startDate} — {item.endDate} · {item.totalDays} أيام · {item.totalPrice.toLocaleString("ar-SA")} ر.س</small><span className={`status-pill status-${item.status}`}>{statusLabels[item.status] ?? item.status}</span></div><div className="request-actions"><Link className="button button-light button-small" href="/messages"><MessageCircle size={14} /> رسالة</Link>{nextStatuses(item).map(action => { const Icon = action.icon; return <button key={action.status} className="button button-outline button-small" onClick={() => changeStatus.mutate({ id: item.id, status: action.status })}><Icon size={14} /> {action.label}</button>; })}</div>{item.status === "completed" && !(data.reviewedRequestIds ?? []).includes(item.id) && <ReviewForm key={item.id} requestId={item.id} onDone={() => void utils.marketplace.dashboard.invalidate()} />}</article>)}</div> : <div className="empty-inline"><CalendarDays size={23} /><p>لا توجد طلبات حتى الآن. اكتشف ما تحتاجه أو شارك إعلانك.</p><Link href="/explore" className="text-link">استكشف الإعلانات <ArrowLeft size={14} /></Link></div>}
    </section>
    <section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">أغراضك تستحق المشاركة</span><h2>إعلاناتي</h2></div><Link href="/list-item" className="button button-dark button-small"><CirclePlus size={15} /> إعلان جديد</Link></div>
      {data?.myListings.length ? <div className="my-listings">{data.myListings.map(item => <article className="my-listing-row" key={item.id}><div><strong>{item.title}</strong><small>{item.category} · {item.city} · {item.pricePerUnit.toLocaleString("ar-SA")} ر.س / {item.unit}</small></div><div className="my-listing-actions"><Link href={`/list-item?edit=${item.id}`} className="button button-light button-small">تعديل</Link><button className="button button-outline button-small" onClick={() => visibility.mutate({ id: item.id, visible: item.status !== "published" })}>{item.status === "published" ? "إخفاء" : "إظهار"}</button><span className={`status-pill ${item.status === "published" ? "status-approved" : "status-cancelled"}`}>{item.status === "published" ? "منشور" : "مخفي"}</span></div></article>)}</div> : <div className="empty-inline"><Package size={23} /><p>عندك شيء لا تستخدمه دائمًا؟ أضف إعلانك الأول.</p><Link href="/list-item" className="text-link">أضف إعلانًا <ArrowLeft size={14} /></Link></div>}
    </section></div>
  </main></div>;
}
