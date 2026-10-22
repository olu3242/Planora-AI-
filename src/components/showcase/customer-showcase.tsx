import { Building2, ShoppingBag, Store, Users } from "lucide-react";
import { customerCategories, type CustomerCategory } from "./content";

const icons = [Store, Users, Building2, ShoppingBag];
export function CustomerShowcase({ categories = customerCategories }: { categories?: readonly CustomerCategory[] }) {
  return <section id="customers" className="customer-section"><div className="marketing-container"><span className="eyebrow">Built for a wide range of organizations</span><h2>Finance teams like yours</h2><div className="customer-cards">{categories.map((item, i) => { const Icon = icons[i] ?? Building2; return <article key={item.title}><Icon size={34} strokeWidth={1.35}/><div><h3>{item.title}</h3><p>{item.text}</p></div></article>; })}</div><p className="customer-note">Designed for these teams. This is not a list of verified customers.</p></div></section>;
}
