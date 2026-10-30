import { ArrowLeft, ArrowUpLeft, Building2, CalendarDays, CarFront, Check, ChevronDown, Grid2X2, HeartHandshake, MapPin, Monitor, Search, ShieldCheck, Shirt, Sofa, Sparkles, Wrench, Plane, Star } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { Brand } from "@/components/Brand";
import ListingCard from "@/components/ListingCard";
import SiteHeader from "@/components/SiteHeader";
import { categories, listings } from "@/data/listings";

const categoryIcons = [Building2, CarFront, Shirt, Monitor, Wrench, Sofa, Sparkles, Plane];

export default function Home() {
  const [category, setCategory] = useState("الكل");
  const [city, setCity] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = listings.filter(item => category === "الكل" || item.category === category);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (category !== "الكل") params.set("category", category);
    if (city) params.set("city", city);
    if (searchTerm) params.set("query", searchTerm);
    window.location.href = `/explore${params.size ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="hero-wrap page-container">
          <div className="hero-banner">
            <div className="hero-overlay" />
            <div className="hero-content">
              <div className="eyebrow hero-eyebrow"><span className="eyebrow-mark" /> أشياء قريبة. فرص أوسع.</div>
              <h1>كل ما تحتاجه،<br /><em>تقدر تستأجره.</em></h1>
              <p>من مكانك القادم إلى سيارتك التالية، اكتشف خيارات متنوعة قريبة منك وصمّم تجربتك على راحتك.</p>
              <a className="hero-scroll" href="#categories">ابدأ الاكتشاف <ArrowLeft size={17} /></a>
            </div>
            <div className="hero-trust"><ShieldCheck size={19} /><span>استئجار بثقة<br /><small>تواصل مباشر وواضح</small></span></div>
            <div className="hero-art-note"><span>AGARLY / 01</span><span>شارك أكثر، امتلك أقل</span></div>
          </div>
          <form className="search-panel" onSubmit={onSearch}>
            <div className="search-field search-field-category"><span className="field-icon"><Grid2X2 size={18} /></span><label htmlFor="category-search">ماذا تبحث عنه؟</label><select id="category-search" value={category} onChange={e => setCategory(e.target.value)}><option value="الكل">كل الأقسام</option>{categories.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select><ChevronDown className="select-chevron" size={15} /></div>
            <div className="search-field search-field-place"><span className="field-icon"><MapPin size={18} /></span><label htmlFor="city-search">الموقع</label><input id="city-search" value={city} onChange={e => setCity(e.target.value)} placeholder="المدينة أو الحي" /></div>
            <div className="search-field search-field-keyword"><span className="field-icon"><Search size={18} /></span><label htmlFor="query-search">كلمة مفتاحية</label><input id="query-search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ما الشيء الذي تحتاجه؟" /></div>
            <button className="button button-gold search-submit" type="submit"><Search size={17} /> ابحث الآن</button>
          </form>
        </section>
        <section className="category-section page-container" id="categories"><div className="section-head category-heading"><div><span className="eyebrow">مساحة أكبر للاختيار</span><h2>استأجر على <span className="text-accent">كيفك</span></h2></div><Link href="/explore" className="text-link">كل الأقسام <ArrowUpLeft size={16} /></Link></div><div className="category-track">{categories.map((item, index) => { const Icon = categoryIcons[index] ?? Grid2X2; return <Link href={`/explore?category=${encodeURIComponent(item.name)}`} className="category-tile" key={item.name}><span className="category-icon"><Icon size={22} strokeWidth={1.65} /></span><span className="category-name">{item.name}</span><small>اكتشف القسم</small></Link>; })}</div></section>
        <section className="featured-section page-container"><div className="section-head"><div><span className="eyebrow">اختيارات تستحق التجربة</span><h2>أشياء مميزة <span className="text-accent">بالقرب منك</span></h2></div><Link href="/explore" className="text-link">اكتشف جميع الإعلانات <ArrowUpLeft size={16} /></Link></div><div className="listing-grid home-listing-grid">{filtered.slice(0, 4).map(listing => <ListingCard key={listing.id} listing={listing} />)}</div><div className="listing-grid home-listing-grid extra-listings">{filtered.slice(4, 6).map(listing => <ListingCard key={listing.id} listing={listing} />)}</div><div className="center-action"><Link className="button button-light" href="/explore">استكشف المزيد <ArrowLeft size={16} /></Link></div></section>
        <section className="how-section page-container" id="how-it-works"><div className="how-intro"><span className="eyebrow">بكل بساطة</span><h2>من الحاجة<br />إلى <span className="text-accent">التجربة.</span></h2><p>لا داعي للشراء إذا كان بإمكانك الاستئجار. ثلاث خطوات بسيطة، وأنت جاهز.</p><Link href="/explore" className="button button-dark">ابدأ رحلتك <ArrowLeft size={16} /></Link></div><div className="steps-column"><div className="step-card"><span className="step-no">01</span><span className="step-icon"><Search size={22} /></span><div><h3>اكتشف ما تحتاج</h3><p>ابحث في مجموعة واسعة من الإعلانات القريبة منك.</p></div><Check className="step-check" size={18} /></div><div className="step-card"><span className="step-no">02</span><span className="step-icon"><CalendarDays size={22} /></span><div><h3>اختر المدة المناسبة</h3><p>حدد فترة الاستئجار واتفق مباشرة مع المالك.</p></div><Check className="step-check" size={18} /></div><div className="step-card"><span className="step-no">03</span><span className="step-icon"><HeartHandshake size={22} /></span><div><h3>استلم واستمتع</h3><p>كل شيء واضح من الطلب إلى التسليم والتقييم.</p></div><Check className="step-check" size={18} /></div></div></section>
        <section className="trust-band page-container"><div className="trust-item"><span><ShieldCheck size={22} /></span><div><strong>أمان ووضوح</strong><small>تفاصيل واضحة قبل كل طلب</small></div></div><div className="trust-divider" /><div className="trust-item"><span><MapPin size={22} /></span><div><strong>أشياء حولك</strong><small>اكتشف خيارات أقرب إليك</small></div></div><div className="trust-divider" /><div className="trust-item"><span><Star size={22} /></span><div><strong>مجتمع موثوق</strong><small>تقييمات ومراجعات حقيقية</small></div></div></section>
        <section className="host-cta page-container"><div className="host-cta-content"><span className="eyebrow">عندك شيء يستحق المشاركة؟</span><h2>خلِّ أغراضك<br /><span>تجيب لك دخل.</span></h2><p>أضف إعلانك مجانًا وابدأ بمشاركة ما لا تستخدمه دائمًا مع أشخاص يحتاجونه.</p><Link href="/list-item" className="button button-gold">أضف إعلانك الآن <ArrowLeft size={17} /></Link></div><div className="host-cta-art"><div className="host-arch" /><div className="host-stats"><span><strong>أقسام متعددة</strong><small>للمشاركة والتأجير</small></span><span className="stats-separator" /><span><strong>قريب منك</strong><small>ابدأ من مدينتك</small></span></div><div className="host-ornament">A</div></div></section>
      </main>
      <footer className="site-footer page-container"><div className="footer-main"><div className="footer-brand"><Link href="/"><Brand /></Link><p>كل ما تحتاجه، تقدر تستأجره.<br />أشياء أكثر، فرص أوسع.</p></div><div className="footer-links"><div><strong>اكتشف</strong><Link href="/explore">جميع الإعلانات</Link><a href="#categories">الأقسام</a><a href="#how-it-works">كيف يعمل أجاري</a></div><div><strong>مجتمع أجاري</strong><Link href="/list-item">أضف إعلانك</Link><Link href="/dashboard">حسابي</Link><Link href="/messages">الرسائل</Link></div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} أجاري — كل الحقوق محفوظة</span><span dir="ltr">RENT WHAT YOU NEED</span><span>صُنع بروح المشاركة <Sparkles size={13} /></span></div></footer>
    </div>
  );
}
