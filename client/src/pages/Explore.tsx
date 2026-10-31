import { ArrowUpLeft, Filter, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import ListingCard from "@/components/ListingCard";
import { categories, listings as sampleListings, type RentalListing } from "@/data/listings";
import { trpc } from "@/lib/trpc";
import { ALL_RENTAL_UNITS, rentalUnitsForCategory } from "@shared/rental";

const categoryNames = ["الكل", ...categories.map(category => category.name)];
const today = () => { const local = new Date(); local.setMinutes(local.getMinutes() - local.getTimezoneOffset()); return local.toISOString().slice(0, 10); };
const nextDay = (date: string) => {
  if (!date) return today();
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
};

export default function Explore() {
  const params = new URLSearchParams(window.location.search);
  const [category, setCategory] = useState(params.get("category") || "الكل");
  const [city, setCity] = useState(params.get("city") || "");
  const [query, setQuery] = useState(params.get("query") || "");
  const [unit, setUnit] = useState(params.get("unit") || "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minPriceText, setMinPriceText] = useState("");
  const [maxPriceText, setMaxPriceText] = useState("");
  const [sort, setSort] = useState("recommended");
  const unitOptions = category === "الكل" ? ALL_RENTAL_UNITS : rentalUnitsForCategory(category);
  const unitIsValid = unitOptions.includes(unit);
  useEffect(() => {
    if (unit && !unitIsValid) setUnit("");
    if (!unitIsValid && ["price-low", "price-high"].includes(sort)) setSort("recommended");
  }, [unitIsValid, unit, sort]);

  const minPrice = unitIsValid && minPriceText ? Number(minPriceText) : undefined;
  const maxPrice = unitIsValid && maxPriceText ? Number(maxPriceText) : undefined;
  const search = trpc.marketplace.listings.useQuery({
    category: category === "الكل" ? undefined : category,
    city: city.trim() || undefined,
    query: query.trim() || undefined,
    unit: unitIsValid ? unit : undefined,
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
        rating: Number(item.rating ?? 0), reviews: Number(item.reviewCount ?? 0), image: images[0] || sampleListings[0].image, images,
        owner: item.ownerName || "عضو أجاري", description: item.description,
      };
    });
    const needsRealResults = Boolean(unitIsValid || dateFrom || dateTo || minPriceText || maxPriceText);
    const base = live.length || needsRealResults ? live : sampleListings;
    const filtered = base.filter(item =>
      (category === "الكل" || item.category === category) &&
      (!unitIsValid || item.unit === unit) &&
      (!city || `${item.city} ${item.neighborhood}`.includes(city.trim())) &&
      (!query || `${item.title} ${item.description} ${item.category}`.includes(query.trim())),
    );
    if (sort === "price-low" && unitIsValid) filtered.sort((a, b) => a.price - b.price);
    if (sort === "price-high" && unitIsValid) filtered.sort((a, b) => b.price - a.price);
    if (sort === "rating") filtered.sort((a, b) => b.rating - a.rating);
    return filtered;
  }, [search.data, category, city, query, unit, unitIsValid, sort, dateFrom, dateTo, minPriceText, maxPriceText]);

  const onSearch = (event: FormEvent) => { event.preventDefault(); };
  const needsRealResults = Boolean(unitIsValid || dateFrom || dateTo || minPriceText || maxPriceText);
  const showingExamples = !search.isLoading && (search.data?.length ?? 0) === 0 && !needsRealResults;
  const resetFilters = () => { setCategory("الكل"); setCity(""); setQuery(""); setUnit(""); setMinPriceText(""); setMaxPriceText(""); setDateFrom(""); setDateTo(""); setSort("recommended"); };

  return <div className="page-shell"><SiteHeader /><main className="page-container explore-page">
    <div className="breadcrumb"><Link href="/">الرئيسية</Link><span>/</span><span>اكتشف</span></div>
    <div className="explore-heading"><div><span className="eyebrow">كل ما يدور في بالك</span><h1>اكتشف <span className="text-accent">أجاري</span></h1><p>اختيارات قريبة، ومساحة أكبر للتجربة.</p></div><Link href="/list-item" className="button button-outline"><ArrowUpLeft size={16} /> أضف إعلانك</Link></div>
    <form className="explore-search" onSubmit={onSearch}><Search size={19} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث عن عقار، سيارة، معدات..." /><span className="search-divider" /><input value={city} onChange={event => setCity(event.target.value)} placeholder="المدينة أو الحي" /><button className="button button-dark" type="submit">بحث</button></form>
    <div className="explore-filter-row">
      <label>وحدة التسعير<select value={unit} onChange={event => setUnit(event.target.value)}><option value="">كل الوحدات</option>{unitOptions.map(option => <option key={option} value={option}>{option}</option>)}</select></label>
      <label>السعر الأدنى<input type="number" min="1" value={minPriceText} onChange={event => setMinPriceText(event.target.value)} placeholder={unitIsValid ? "أي سعر" : "اختر الوحدة"} disabled={!unitIsValid} /></label>
      <label>السعر الأعلى<input type="number" min={minPriceText || 1} value={maxPriceText} onChange={event => setMaxPriceText(event.target.value)} placeholder={unitIsValid ? "أي سعر" : "اختر الوحدة"} disabled={!unitIsValid} /></label>
      <label>تاريخ الاستلام<input type="date" value={dateFrom} min={today()} onChange={event => { setDateFrom(event.target.value); if (dateTo && event.target.value && dateTo <= event.target.value) setDateTo(""); }} /></label>
      <label>تاريخ الإرجاع<input type="date" value={dateTo} min={nextDay(dateFrom)} onChange={event => setDateTo(event.target.value)} /></label>
    </div>
    <p className="unit-filter-hint">فلتر السعر يقارن الإعلانات ذات وحدة التسعير نفسها فقط.</p>
    <div className="explore-category-row"><Filter size={17} /><span>تصفح حسب القسم</span>{categoryNames.map(item => <button key={item} type="button" className={`category-chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="results-toolbar"><div><span className="eyebrow">لأن لكل حاجة خيار</span><h2>{category === "الكل" ? "إعلانات مميزة" : category}</h2><small>{showingExamples ? "نماذج توضيحية لتجربة الواجهة" : `${search.data?.length ?? 0} إعلان متاح`}{city && ` في ${city}`}{unitIsValid && ` · لكل ${unit}`}</small></div><label className="sort-select"><SlidersHorizontal size={16} /><span>ترتيب حسب</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="recommended">المناسب لك</option><option value="price-low" disabled={!unitIsValid}>الأقل سعرًا (اختر الوحدة)</option><option value="price-high" disabled={!unitIsValid}>الأعلى سعرًا (اختر الوحدة)</option><option value="rating">الأعلى تقييمًا</option></select></label></div>
    {search.isLoading && !search.data ? <div className="loading-state">نبحث لك عن خيارات مناسبة…</div> : results.length ? <div className="listing-grid explore-grid">{results.map(item => <ListingCard key={item.id} listing={item} />)}</div> : <div className="empty-state"><Search size={32} /><h3>ما لقينا نتائج تطابق بحثك</h3><p>{dateFrom && dateTo ? "لا توجد إعلانات منشورة متاحة في الفترة المختارة." : "جرّب تعديل السعر أو المدينة أو اختر قسمًا ووحدة مختلفة."}</p><button className="button button-light" type="button" onClick={resetFilters}>عرض كل الإعلانات</button></div>}
    {showingExamples && <div className="demo-note"><span className="demo-note-dot" /> الأمثلة الظاهرة للتوضيح فقط؛ ستظهر إعلانات الأعضاء المنشورة هنا.</div>}
  </main></div>;
}
