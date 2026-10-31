import { Building2, Camera, CarFront, Grid2X2, Plane, Shirt, Sofa, Sparkles, Wrench, type LucideIcon } from "lucide-react";

const categoryIcons: Record<string, LucideIcon> = {
  home: Building2,
  car: CarFront,
  shirt: Shirt,
  camera: Camera,
  tool: Wrench,
  sofa: Sofa,
  sparkles: Sparkles,
  plane: Plane,
  grid: Grid2X2,
};

export default function CategoryIcon({ icon, size = 21 }: { icon: string; size?: number }) {
  const Icon = categoryIcons[icon] ?? Grid2X2;
  return <span className="category-icon category-icon-soft"><Icon size={size} strokeWidth={1.8} aria-hidden="true" /></span>;
}
