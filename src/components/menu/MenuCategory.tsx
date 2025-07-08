import type { MenuCategory as MenuCategoryType, MenuItem } from '@/lib/types';
import { MenuItemCard } from './MenuItemCard';

interface MenuCategoryProps {
  category: MenuCategoryType;
  onAddItem: (item: MenuItem) => void;
}

export function MenuCategory({ category, onAddItem }: MenuCategoryProps) {
  const CategoryIcon = category.icon;
  return (
    <section className="mb-12">
      <div className="flex items-center mb-6">
        {CategoryIcon && <CategoryIcon className="h-8 w-8 mr-3 text-accent" />}
        <h2 className="text-3xl font-semibold text-accent">{category.name}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {category.items.map((item) => (
          <MenuItemCard key={item.id} item={item} onAddItem={onAddItem} />
        ))}
      </div>
    </section>
  );
}
