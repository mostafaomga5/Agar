import { ArrowUpLeft, Filter, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import ListingCard from "@/components/ListingCard";
import { categories, listings as sampleListings, type RentalListing } from "@/data/listings";
import { trpc } from "@/lib/trpc";

const categoryNames = ["الكل", ...categories.map(category => category.name)];

export default function Explore() {
  const params = new URLSearchParams(window.location.search);
  const [category, setCategory] = useState(params.get("category") || "الكل");
  const [city, setCity] = useState(params.get("city") || "");
  const [query, setQuery] = useState(params.get("query") || "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minPriceText, setMinPriceText] = useState("");
  const [maxPriceText, setMaxPriceText] = useState("");
  const [sort, setSort] = useState("recommended");
  const minPrice = minPriceText ? Number(minPriceText) : undefined;
  const maxPrice = maxPriceText ? Number(maxPriceText) : undefined;
  const search = trpc.marketplace.listings.useQuery({
    category: category === "الكل" ? undefined : category,
    city: city || undefined,
    query: query || undefined,
    minPrice,
    maxPrice,
    dateFrom: dateFrom && dateTo ? dateFrom : undefined,
    dateTo: dateFrom && dateTo ? dateTo : undefined,
  });

  const results = useMemo(() => {
    const live: RentalListing[] = (search.data ?? []).map(item => {
      let images: string[] = [];
      try { images = JSON.parse(item.imageUrls) as string[]; } catch { images = []; }
      return {
        id: String(item.id), title: item.title, category: item.category, city: item.city,
        neighborhood: item.neighborhood, price: item.pricePerUnit, unit: item.unit,
        rating: Number(item.rating ?? 0), reviews: Number(item.reviewCount ?? 0), image: images[0] || sampleListings[0].image,
        owner: item.ownerName || "عضو أجاري", description: item.description,
      };
    });
    const needsRealAvailability = Boolean(dateFrom || dateTo || minPriceText || maxPriceText);
    const base = live.length ? live : needsRealAvailability ? [] : sampleListings;
    const filtered = base.filter(item =>
      (category === "الكل" || item.category === category) &&
      (!city || `${item.city} ${item.neighborhood}`.includes(city)) &&
      (!query || `${item.title} ${item.description} ${item.category}`.includes(query)),
    );
    if (sort === "price-low") filtered.sort((a, b) => a.price - b.price);
    if (sort === "price-high") filtered.sort((a, b) => b.price - a.price);
    if (sort === "rating") filtered.sort((a, b) => b.rating - a.rating);
    return filtered;
  }, [search.data, category, city, query, sort, dateFrom, dateTo, minPriceText, maxPriceText]);

  const onSearch = (event: FormEvent) => { event.preventDefault(); };
  const showingExamples = !search.isLoading && (search.data?.length ?? 0) === 0 && !dateFrom && !dateTo && !minPriceText && !maxPriceText;

  return <div className="page-shell"><SiteHeader /><main className="page-container explore-page">
    <div className="breadcrumb"><Link href="/">الرئيسية</Link><span>/</span><span>اكتشف</span></div>
    <div className="explore-heading"><div><span className="eyebrow">كل ما يدور في بالك</span><h1>اكتشف <span className="text-accent">أجاري</span></h1><p>اختيارات قريبة، ومساحة أكبر للتجربة.</p></div><Link href="/list-item" className="button button-outline"><ArrowUpLeft size={16} /> أضف إعلانك</Link></div>
    <form className="explore-search" onSubmit={onSearch}><Search size={19} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث عن عقار، سيارة، معدات..." /><span className="search-divider" /><input value={city} onChange={e => setCity(e.target.value)} placeholder="المدينة أو الحي" /><button className="button button-dark" type="submit">بحث</button></form>
    <div className="explore-filter-row"><label>السعر الأدنى<input type="number" min="1" value={minPriceText} onChange={e => setMinPriceText(e.target.value)} placeholder="أي سعر" /></label><label>السعر الأعلى<input type="number" min={minPriceText || 1} value={maxPriceText} onChange={e => setMaxPriceText(e.target.value)} placeholder="أي سعر" /></label><label>تاريخ الاستلام<input type="date" value={dateFrom} min={new Date().toISOString().slice(0, 10)} onChange={e => setDateFrom(e.target.value)} /></label><label>تاريخ الإرجاع<input type="date" value={dateTo} min={dateFrom || new Date().toISOString().slice(0, 10)} onChange={e => setDateTo(e.target.value)} /></label></div>
    <div className="explore-category-row"><Filter size={17} /><span>تصفح حسب القسم</span>{categoryNames.map(item => <button key={item} type="button" className={`category-chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="results-toolbar"><div><span className="eyebrow">لأن لكل حاجة خيار</span><h2>{category === "الكل" ? "إعلانات مميزة" : category}</h2><small>{showingExamples ? "نماذج توضيحية لتجربة الواجهة" : `${search.data?.length ?? 0} إعلان متاح`}{city && ` في ${city}`}</small></div><label className="sort-select"><SlidersHorizontal size={16} /><span>ترتيب حسب</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="recommended">المناسب لك</option><option value="price-low">الأقل سعرًا</option><option value="price-high">الأعلى سعرًا</option><option value="rating">الأعلى تقييمًا</option></select></label></div>
    {search.isLoading && !search.data ? <div className="loading-state">نبحث لك عن خيارات مناسبة…</div> : results.length ? <div className="listing-grid explore-grid">{results.map(item => <ListingCard key={item.id} listing={item} />)}</div> : <div className="empty-state"><Search size={32} /><h3>ما لقينا نتائج تطابق بحثك</h3><p>{dateFrom && dateTo ? "لا توجد إعلانات منشورة متاحة في الفترة المختارة." : "جرّب تعديل السعر أو المدينة أو اختر قسمًا مختلفًا."}</p><button className="button button-light" onClick={() => { setCategory("الكل"); setCity(""); setQuery(""); setMinPriceText(""); setMaxPriceText(""); setDateFrom(""); setDateTo(""); }}>عرض كل الإعلانات</button></div>}
    {showingExamples && <div className="demo-note"><span className="demo-note-dot" /> الأمثلة الظاهرة للتوضيح فقط؛ ستظهر إعلانات الأعضاء المنشورة هنا.</div>}
  </main></div>;
}
