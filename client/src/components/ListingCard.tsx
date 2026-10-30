import { ArrowUpLeft, Heart, MapPin, Star } from "lucide-react";
import { Link } from "wouter";
import type { RentalListing } from "@/data/listings";

export default function ListingCard({ listing }: { listing: RentalListing }) {
  return (
    <article className="listing-card">
      <Link href={`/listing/${listing.id}`} className="listing-image-link" aria-label={`عرض ${listing.title}`}>
        <div className="listing-image-wrap">
          <img src={listing.image} alt={listing.title} loading="lazy" />
          {listing.badge && <span className="listing-badge">{listing.badge}</span>}
          {listing.isDemo && <span className="demo-image-tag">نموذج توضيحي</span>}
        </div>
      </Link>
      <div className="listing-card-info">
        <div className="listing-card-topline">
          <span className="listing-category">{listing.category}</span>
          {listing.isDemo ? <span className="demo-card-label">مثال للعرض</span> : listing.reviews > 0 ? <span className="listing-rating"><Star size={14} fill="currentColor" strokeWidth={0} /> {listing.rating.toFixed(1)} <span>({listing.reviews})</span></span> : <span className="listing-new-label">جديد</span>}
        </div>
        <Link href={`/listing/${listing.id}`} className="listing-title">{listing.title}</Link>
        <span className="listing-location"><MapPin size={14} /> {listing.neighborhood}، {listing.city}</span>
        <div className="listing-card-bottom">
          <div className="listing-price"><strong>{listing.price.toLocaleString("ar-SA")} ر.س</strong><span> / {listing.unit}</span></div>
          <Link href={`/listing/${listing.id}`} className="card-arrow" aria-label="التفاصيل"><ArrowUpLeft size={18} /></Link>
        </div>
      </div>
      <button className="favorite-button" aria-label="أضف للمفضلة" type="button"><Heart size={17} /></button>
    </article>
  );
}
