import { Menu, Plus, Search, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Brand } from "@/components/Brand";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="top-strip"><span>خلِّ الأشياء تدور وتستفيد منها أكثر</span><span className="top-strip-dot" /> <span>استأجر بذكاء، وانشر إعلانك مجانًا</span></div>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand-link"><Brand /></Link>
          <nav className={`main-nav ${open ? "nav-open" : ""}`} aria-label="التنقل الرئيسي">
            <Link href="/explore" onClick={() => setOpen(false)}>اكتشف</Link>
            <a href="/#categories" onClick={() => setOpen(false)}>الأقسام</a>
            <a href="/#how-it-works" onClick={() => setOpen(false)}>كيف يعمل أجاري</a>
            <Link href="/dashboard" onClick={() => setOpen(false)}>حسابي</Link>
            <button className="nav-close" type="button" onClick={() => setOpen(false)} aria-label="إغلاق القائمة"><X size={20} /></button>
          </nav>
          <div className="header-actions">
            <Link href="/explore" className="icon-button search-shortcut" aria-label="بحث"><Search size={19} /></Link>
            <Link href="/list-item" className="button button-outline list-button"><Plus size={16} /><span>أضف إعلانًا</span></Link>
            <Link href="/dashboard" className="button button-dark account-button"><UserRound size={16} /><span>حسابي</span></Link>
          </div>
          <button className="mobile-menu" type="button" onClick={() => setOpen(!open)} aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}>{open ? <X size={23} /> : <Menu size={23} />}</button>
        </div>
      </header>
    </>
  );
}
