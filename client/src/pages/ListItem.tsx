import { ArrowRight, ImagePlus, Info, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import SiteHeader from "@/components/SiteHeader";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { categories } from "@/data/listings";
import { trpc } from "@/lib/trpc";

export default function ListItem() {
  const auth = useAuth();
  const editParam = new URLSearchParams(window.location.search).get("edit");
  const editId = editParam && /^[0-9]+$/.test(editParam) ? Number(editParam) : null;
  const existing = trpc.marketplace.listing.useQuery({ id: editId || 1 }, { enabled: Boolean(editId && auth.isAuthenticated), retry: false });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0].name);
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [pricePerUnit, setPrice] = useState("");
  const [unit, setUnit] = useState("يوم");
  const [description, setDescription] = useState("");
  const [imageUrlsText, setImageUrlsText] = useState("");
  const utils = trpc.useUtils();
  useEffect(() => {
    if (!existing.data) return;
    const item = existing.data;
    let images: string[] = [];
    try { images = JSON.parse(item.imageUrls) as string[]; } catch { images = []; }
    setTitle(item.title); setCategory(item.category); setCity(item.city); setNeighborhood(item.neighborhood);
    setPrice(String(item.pricePerUnit)); setUnit(item.unit); setDescription(item.description); setImageUrlsText(images.join("\n"));
  }, [existing.data]);
  const onSuccess = (message: string) => { toast.success(message); void utils.marketplace.dashboard.invalidate(); void utils.marketplace.listings.invalidate(); window.location.href = "/dashboard"; };
  const create = trpc.marketplace.createListing.useMutation({ onSuccess: () => onSuccess("تم نشر إعلانك بنجاح"), onError: error => toast.error(error.message) });
  const update = trpc.marketplace.updateListing.useMutation({ onSuccess: () => onSuccess("تم تحديث الإعلان"), onError: error => toast.error(error.message) });
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!auth.isAuthenticated) { startLogin(); return; }
    const imageUrls = imageUrlsText.split(/[\n,]+/).map(url => url.trim()).filter(Boolean);
    const values = { title, category, city, neighborhood, pricePerUnit: Number(pricePerUnit), unit, description, imageUrls };
    if (editId) update.mutate({ ...values, id: editId }); else create.mutate(values);
  };
  const isPending = create.isPending || update.isPending;
  if (auth.loading || (editId && existing.isLoading)) return <div className="page-shell"><SiteHeader /><div className="loading-state">نجهز بيانات الإعلان…</div></div>;
  if (!auth.isAuthenticated) return <div className="page-shell"><SiteHeader /><main className="page-container auth-prompt"><span className="auth-icon"><ShieldCheck size={28} /></span><span className="eyebrow">مشاركة سهلة وآمنة</span><h1>إعلانك يفتح<br /><span className="text-accent">فرصة جديدة.</span></h1><p>سجّل دخولك لإضافة إعلانك وإدارته من حسابك.</p><button className="button button-dark" onClick={startLogin}>سجّل الدخول <ArrowRight size={16} /></button></main></div>;

  return <div className="page-shell"><SiteHeader /><main className="page-container listing-form-page"><div className="breadcrumb"><Link href="/">الرئيسية</Link><span>/</span><Link href="/dashboard">حسابي</Link><span>/</span><span>{editId ? "تعديل الإعلان" : "أضف إعلانًا"}</span></div><div className="form-page-intro"><span className="eyebrow">مجتمع يشارك أكثر</span><h1>{editId ? <>عدّل تفاصيل <span className="text-accent">إعلانك.</span></> : <>ما الذي تود <span className="text-accent">تأجيره؟</span></>}</h1><p>أضف التفاصيل المهمة ليعرف الآخرون كيف يستفيدون من إعلانك.</p></div>
    <form className="listing-form-card" onSubmit={onSubmit}><div className="form-section-heading"><span>01</span><div><h2>تفاصيل العنصر</h2><p>معلومات واضحة تساعد المستأجر على الاختيار.</p></div></div><div className="form-grid"><label className="form-control form-span-2">عنوان الإعلان<input required minLength={4} maxLength={180} value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: شقة أنيقة قريبة من وسط المدينة" /></label><label className="form-control">القسم<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label className="form-control">المدينة<input required minLength={2} value={city} onChange={e => setCity(e.target.value)} placeholder="الرياض" /></label><label className="form-control">الحي<input required minLength={2} value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="العليا" /></label><div className="form-combo form-control"><label>السعر</label><div><input required type="number" min="1" value={pricePerUnit} onChange={e => setPrice(e.target.value)} placeholder="0" /><select value={unit} onChange={e => setUnit(e.target.value)}><option>يوم</option><option>ليلة</option><option>ساعة</option><option>مناسبة</option></select></div></div><label className="form-control form-span-2">وصف الإعلان<textarea required minLength={20} maxLength={8000} rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="ما الذي يميز إعلانك؟ ما التفاصيل التي يجب أن يعرفها المستأجر؟" /></label></div>
      <div className="form-section-heading form-heading-spaced"><span>02</span><div><h2>صور الإعلان</h2><p>أضف رابط صورة واضحة (رابطًا واحدًا في كل سطر، حتى 8 صور).</p></div></div><label className="form-control">روابط الصور<textarea required rows={3} value={imageUrlsText} onChange={e => setImageUrlsText(e.target.value)} placeholder="https://example.com/photo.jpg&#10;/manus-storage/your-image.webp" /><small className="field-hint"><ImagePlus size={13} /> تقبل روابط HTTPS أو المسارات الدائمة لتخزين أجاري.</small></label>
      <div className="publish-note"><Info size={17} /><p>تأكد من دقة الموقع والسعر والتوفر. إرسال إعلانك ينشره في السوق، ويمكنك إخفاؤه أو تعديله من لوحة حسابك.</p></div><button className="button button-dark form-submit" type="submit" disabled={isPending}>{isPending ? "جارٍ حفظ الإعلان…" : editId ? "حفظ التعديلات" : "انشر الإعلان"}<ArrowRight size={16} /></button><div className="form-privacy"><ShieldCheck size={14} /> لا تنشر معلومات الاتصال أو البيانات الحساسة في وصف الإعلان.</div>
    </form>
  </main></div>;
}
