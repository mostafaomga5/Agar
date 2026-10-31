import { ArrowRight, Check, ImagePlus, Info, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import SiteHeader from "@/components/SiteHeader";
import CategoryIcon from "@/components/CategoryIcon";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { categories } from "@/data/listings";
import { trpc } from "@/lib/trpc";
import { rentalUnitsForCategory } from "@shared/rental";

const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذرت قراءة الصورة من جهازك"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      if (comma < 0) reject(new Error("تعذر تجهيز الصورة للرفع"));
      else resolve(result.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}

function parseImageUrls(value: string): string[] {
  return value.split(/[\n,]+/).map(url => url.trim()).filter(Boolean);
}

export default function ListItem() {
  const auth = useAuth();
  const editParam = new URLSearchParams(window.location.search).get("edit");
  const editId = editParam && /^[0-9]+$/.test(editParam) ? Number(editParam) : null;
  const existing = trpc.marketplace.ownedListing.useQuery({ id: editId || 1 }, { enabled: Boolean(editId && auth.isAuthenticated), retry: false });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0].name);
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [pricePerUnit, setPrice] = useState("");
  const [unit, setUnit] = useState("يوم");
  const [description, setDescription] = useState("");
  const [imageUrlsText, setImageUrlsText] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const utils = trpc.useUtils();
  const selectedPreviews = useMemo(() => imageFiles.map(file => URL.createObjectURL(file)), [imageFiles]);
  const imageUrls = useMemo(() => parseImageUrls(imageUrlsText), [imageUrlsText]);
  const allowedUnits = rentalUnitsForCategory(category);

  useEffect(() => () => selectedPreviews.forEach(url => URL.revokeObjectURL(url)), [selectedPreviews]);
  useEffect(() => {
    if (!existing.data) return;
    const item = existing.data;
    let images: string[] = [];
    try { images = JSON.parse(item.imageUrls) as string[]; } catch { images = []; }
    const units = rentalUnitsForCategory(item.category);
    setTitle(item.title);
    setCategory(item.category);
    setCity(item.city);
    setNeighborhood(item.neighborhood);
    setPrice(String(item.pricePerUnit));
    setUnit(units.includes(item.unit) ? item.unit : units[0] ?? "يوم");
    setDescription(item.description);
    setImageUrlsText(images.join("\n"));
  }, [existing.data]);

  const onSuccess = (message: string) => {
    toast.success(message);
    void utils.marketplace.dashboard.invalidate();
    void utils.marketplace.listings.invalidate();
    window.location.href = "/dashboard";
  };
  const create = trpc.marketplace.createListing.useMutation({ onSuccess: () => onSuccess("تم نشر إعلانك بنجاح") });
  const update = trpc.marketplace.updateListing.useMutation({ onSuccess: () => onSuccess("تم تحديث الإعلان") });
  const uploadImage = trpc.marketplace.uploadListingImage.useMutation();

  const onFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!incoming.length) return;
    const accepted: File[] = [];
    for (const file of incoming) {
      if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
        toast.error(`صيغة ${file.name} غير مدعومة. استخدم JPEG أو PNG أو WebP.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`حجم ${file.name} أكبر من 6 ميغابايت.`);
        continue;
      }
      accepted.push(file);
    }
    setImageFiles(current => {
      const remaining = Math.max(0, MAX_IMAGES - imageUrls.length - current.length);
      if (accepted.length > remaining) toast.info(`يمكن إضافة ${MAX_IMAGES} صور كحد أقصى للإعلان.`);
      return [...current, ...accepted.slice(0, remaining)];
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!auth.isAuthenticated) { startLogin(); return; }
    if (imageUrls.length + imageFiles.length < 1) {
      toast.error("أضف صورة واحدة على الأقل للإعلان");
      return;
    }
    if (imageUrls.length + imageFiles.length > MAX_IMAGES) {
      toast.error(`الحد الأقصى ${MAX_IMAGES} صور لكل إعلان`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const storedUrls: string[] = [];
      for (const [index, file] of imageFiles.entries()) {
        const base64 = await fileToBase64(file);
        const stored = await uploadImage.mutateAsync({ contentType: file.type as "image/jpeg" | "image/png" | "image/webp", base64 });
        storedUrls.push(stored.url);
        setUploadProgress(index + 1);
      }
      const values = {
        title: title.trim(), category, city: city.trim(), neighborhood: neighborhood.trim(),
        pricePerUnit: Number(pricePerUnit), unit, description: description.trim(), imageUrls: [...imageUrls, ...storedUrls],
      };
      if (editId) await update.mutateAsync({ ...values, id: editId });
      else await create.mutateAsync(values);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الإعلان أو رفع صوره");
    } finally {
      setIsUploading(false);
    }
  };

  const isPending = create.isPending || update.isPending || uploadImage.isPending || isUploading;
  if (auth.loading || (editId && existing.isLoading)) return <div className="page-shell"><SiteHeader /><div className="loading-state">نجهز بيانات الإعلان…</div></div>;
  if (!auth.isAuthenticated) return <div className="page-shell"><SiteHeader /><main className="page-container auth-prompt"><span className="auth-icon"><ShieldCheck size={28} /></span><span className="eyebrow">مشاركة سهلة وآمنة</span><h1>إعلانك يفتح<br /><span className="text-accent">فرصة جديدة.</span></h1><p>سجّل دخولك لإضافة إعلانك وإدارته من حسابك.</p><button className="button button-dark" onClick={startLogin}>سجّل الدخول <ArrowRight size={16} /></button></main></div>;
  if (editId && (existing.isError || !existing.data)) return <div className="page-shell"><SiteHeader /><main className="page-container empty-state"><h2>تعذر العثور على الإعلان أو أنك لا تملكه</h2><Link href="/dashboard" className="button button-dark">العودة إلى حسابي <ArrowRight size={16} /></Link></main></div>;

  return <div className="page-shell">
    <SiteHeader />
    <main className="page-container listing-form-page">
      <div className="breadcrumb"><Link href="/">الرئيسية</Link><span>/</span><Link href="/dashboard">حسابي</Link><span>/</span><span>{editId ? "تعديل الإعلان" : "أضف إعلانًا"}</span></div>
      <div className="form-page-intro"><span className="eyebrow">مجتمع يشارك أكثر</span><h1>{editId ? <>عدّل تفاصيل <span className="text-accent">إعلانك.</span></> : <>ما الذي تود <span className="text-accent">تأجيره؟</span></>}</h1><p>أضف التفاصيل المهمة، واختر مدة تناسب طبيعة ما تعرضه.</p></div>
      <form className="listing-form-card" onSubmit={onSubmit}>
        <div className="form-section-heading"><span>01</span><div><h2>تفاصيل العنصر</h2><p>معلومات واضحة تساعد المستأجر على الاختيار.</p></div></div>
        <div className="form-grid">
          <label className="form-control form-span-2">عنوان الإعلان<input required minLength={4} maxLength={180} value={title} onChange={event => setTitle(event.target.value)} placeholder="مثال: شقة أنيقة قريبة من وسط المدينة" /></label>
          <fieldset className="form-control form-span-2 category-picker"><legend>اختر القسم</legend><div className="category-option-grid" role="radiogroup" aria-label="قسم الإعلان">
            {categories.map(item => <button key={item.name} className={`category-option-button ${category === item.name ? "selected" : ""}`} type="button" role="radio" aria-checked={category === item.name} onClick={() => { setCategory(item.name); setUnit(rentalUnitsForCategory(item.name)[0] ?? "يوم"); }}>
              <CategoryIcon icon={item.icon} size={22} /><span>{item.name}</span>{category === item.name && <Check className="category-option-check" size={14} />}
            </button>)}
          </div></fieldset>
          <label className="form-control">المدينة<input required minLength={2} maxLength={96} value={city} onChange={event => setCity(event.target.value)} placeholder="الرياض" /></label>
          <label className="form-control">الحي<input required minLength={2} maxLength={128} value={neighborhood} onChange={event => setNeighborhood(event.target.value)} placeholder="العليا" /></label>
          <div className="form-combo form-control"><label htmlFor="listing-price">السعر لكل {unit}</label><div><input id="listing-price" required type="number" min="1" max="1000000" value={pricePerUnit} onChange={event => setPrice(event.target.value)} placeholder="0" /><select aria-label="وحدة التسعير" value={unit} onChange={event => setUnit(event.target.value)}>{allowedUnits.map(option => <option key={option} value={option}>{option}</option>)}</select></div><small className="field-hint">خيارات المدة مناسبة للقسم المختار.</small></div>
          <label className="form-control form-span-2">وصف الإعلان<textarea required minLength={20} maxLength={8000} rows={5} value={description} onChange={event => setDescription(event.target.value)} placeholder="ما الذي يميز إعلانك؟ اذكر حالته والمواصفات وطريقة الاستلام." /></label>
        </div>

        <div className="form-section-heading form-heading-spaced"><span>02</span><div><h2>صور الإعلان</h2><p>اختر صورًا واضحة من جهازك أو أضف روابط صور، حتى {MAX_IMAGES} صور.</p></div></div>
        <label className="image-upload-drop">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFilesSelected} aria-label="اختيار صور الإعلان من الجهاز" />
          <span className="image-upload-icon"><ImagePlus size={24} /></span><strong>اختر صورًا من جهازك</strong><small>JPEG أو PNG أو WebP · حتى 6 ميغابايت للصورة</small>
        </label>
        {(imageUrls.length > 0 || selectedPreviews.length > 0) && <div className="image-preview-grid" aria-label="الصور المختارة للإعلان">
          {imageUrls.map((url, index) => <div className="image-preview" key={`${url}-${index}`}><img src={url} alt={`صورة الإعلان ${index + 1}`} /><button type="button" aria-label={`حذف الصورة ${index + 1}`} onClick={() => setImageUrlsText(imageUrls.filter((_, itemIndex) => itemIndex !== index).join("\n"))}><Trash2 size={14} /></button></div>)}
          {selectedPreviews.map((url, index) => <div className="image-preview" key={`${url}-${index}`}><img src={url} alt={`معاينة صورة مختارة ${index + 1}`} /><button type="button" aria-label={`إزالة الصورة المختارة ${index + 1}`} onClick={() => setImageFiles(files => files.filter((_, fileIndex) => fileIndex !== index))}><Trash2 size={14} /></button></div>)}
        </div>}
        <label className="form-control image-url-field">روابط صور (اختياري)<textarea rows={2} value={imageUrlsText} onChange={event => setImageUrlsText(event.target.value)} placeholder="https://example.com/photo.jpg&#10;/manus-storage/your-image.webp" /><small className="field-hint"><ImagePlus size={13} /> رابط HTTPS أو مسار تخزين أجاري دائم، رابط واحد في كل سطر.</small></label>
        <div className="image-count-note">{imageUrls.length + imageFiles.length} / {MAX_IMAGES} صور</div>
        {isUploading && <div className="upload-progress" role="status">جارٍ رفع الصور إلى التخزين الآمن… {uploadProgress} / {imageFiles.length}</div>}
        <div className="publish-note"><Info size={17} /><p>تأكد من دقة الموقع والسعر والتوفر. يُحفظ الإعلان بعد رفع صوره ويمكنك إخفاؤه أو تعديله من لوحة حسابك.</p></div>
        <button className="button button-dark form-submit" type="submit" disabled={isPending}>{isUploading ? "جارٍ رفع الصور وحفظ الإعلان…" : isPending ? "جارٍ حفظ الإعلان…" : editId ? "حفظ التعديلات" : "انشر الإعلان"}<ArrowRight size={16} /></button>
        <div className="form-privacy"><ShieldCheck size={14} /> لا تنشر معلومات الاتصال أو البيانات الحساسة في وصف الإعلان.</div>
      </form>
    </main>
  </div>;
}
