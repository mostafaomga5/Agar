export type RentalListing = {
  id: string;
  title: string;
  category: string;
  city: string;
  neighborhood: string;
  price: number;
  unit: string;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  owner: string;
  description: string;
  isDemo?: boolean;
};

export const listings: RentalListing[] = [
  { id: "apt-riyadh", title: "شقة عصرية بإطلالة على المدينة", category: "العقارات", city: "الرياض", neighborhood: "حي العليا", price: 420, unit: "ليلة", rating: 0, reviews: 0, image: "/manus-storage/async-images/ffFd7GKDuTjdfza7RYsflI/image-2.webp", badge: "اختيار أجاري", owner: "سارة المري", description: "إقامة هادئة في قلب المدينة، بتصميم أنيق ومساحة رحبة وإطلالة جميلة. مثالية لإقامة العمل أو عطلة نهاية الأسبوع.", isDemo: true },
  { id: "car-gcc", title: "سيارة SUV مريحة للرحلات", category: "السيارات", city: "الرياض", neighborhood: "حي النخيل", price: 310, unit: "يوم", rating: 0, reviews: 0, image: "/manus-storage/async-images/ffFd7GKDuTjdfza7RYsflI/image-3.webp", badge: "متاح اليوم", owner: "عبدالله الشمري", description: "سيارة واسعة ونظيفة وجاهزة لمشاويرك داخل المدينة أو الرحلات القصيرة. تشمل مساعدة المالك عند الاستلام.", isDemo: true },
  { id: "camera-pro", title: "كاميرا احترافية مع عدسة", category: "الإلكترونيات", city: "جدة", neighborhood: "الروضة", price: 185, unit: "يوم", rating: 0, reviews: 0, image: "/manus-storage/async-images/ffFd7GKDuTjdfza7RYsflI/image-4.webp", owner: "نورة الحربي", description: "كاميرا عالية الجودة مناسبة للمشاريع الإبداعية والفعاليات والرحلات. تتوفر حقيبة حماية وملحقات أساسية.", isDemo: true },
  { id: "abaya-evening", title: "عباية سهرة بتفاصيل أنيقة", category: "الأزياء", city: "جدة", neighborhood: "حي الشاطئ", price: 120, unit: "مناسبة", rating: 0, reviews: 0, image: "/manus-storage/async-images/ffFd7GKDuTjdfza7RYsflI/image-5.webp", badge: "قطعة مميزة", owner: "لمى العتيبي", description: "قطعة راقية لمناسبتك القادمة، بقماش مريح وقصة انسيابية. متاحة للمقاس المتوسط والكبير.", isDemo: true },
  { id: "lounge-home", title: "جلسة خارجية لأمسيات لطيفة", category: "الأثاث والمنزل", city: "الدمام", neighborhood: "الشاطئ الغربي", price: 240, unit: "يوم", rating: 0, reviews: 0, image: "/manus-storage/async-images/ffFd7GKDuTjdfza7RYsflI/image-2.webp", owner: "منصة دار", description: "جلسة متكاملة بطاولة وكراسي مريحة؛ خيار عملي للضيوف والمناسبات المنزلية. التوصيل متاح داخل المدينة.", isDemo: true },
  { id: "camera-event", title: "كاميرا فورية للفعاليات", category: "المناسبات", city: "الرياض", neighborhood: "حي الورود", price: 95, unit: "يوم", rating: 0, reviews: 0, image: "/manus-storage/async-images/ffFd7GKDuTjdfza7RYsflI/image-4.webp", owner: "تركي الغامدي", description: "التقط أجمل لحظاتك وشاركها فورًا مع ضيوفك. سهلة الاستخدام ومثالية لحفلات التخرج وأعياد الميلاد.", isDemo: true },
];

export const categories = [
  { name: "العقارات", icon: "home" },
  { name: "السيارات", icon: "car" },
  { name: "الأزياء", icon: "shirt" },
  { name: "الإلكترونيات", icon: "camera" },
  { name: "المعدات", icon: "tool" },
  { name: "الأثاث والمنزل", icon: "sofa" },
  { name: "المناسبات", icon: "sparkles" },
  { name: "الرحلات", icon: "plane" },
];