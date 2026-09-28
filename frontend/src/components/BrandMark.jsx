import { BookOpen } from "lucide-react";

export default function BrandMark({ small = false }) {
  return <span className={`brand-mark ${small ? "brand-mark-small" : ""}`}><BookOpen size={small ? 25 : 36} strokeWidth={1.8} /></span>;
}