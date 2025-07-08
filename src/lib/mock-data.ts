import type { MenuData } from './types';
import { Soup, Pizza, CakeSlice, Coffee, Salad, Beef, FishSymbol, Cookie, Grape, Wine, GlassWater, Vegan } from 'lucide-react';

export const mockMenuData: MenuData = {
  categories: [
    {
      name: 'Appetizers',
      icon: Grape,
      items: [
        { id: 'app1', name: 'Bruschetta', description: 'Grilled bread rubbed with garlic and topped with olive oil and salt. Variations may include toppings of tomato, vegetables, beans, cured meat, or cheese.', price: 8.99, category: 'Appetizers', image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'bruschetta bread' },
        { id: 'app2', name: 'Spring Rolls', description: 'Crispy fried rolls filled with vegetables and glass noodles.', price: 7.50, category: 'Appetizers', image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'spring rolls' },
        { id: 'app3', name: 'Caesar Salad', description: 'Romaine lettuce and croutons dressed with lemon juice, olive oil, egg, Worcestershire sauce, anchovies, garlic, Dijon mustard, Parmesan cheese, and black pepper.', price: 9.00, category: 'Appetizers', icon: Salad, image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'caesar salad' },
      ],
    },
    {
      name: 'Entrees',
      icon: Pizza,
      items: [
        { id: 'ent1', name: 'Margherita Pizza', description: 'Classic pizza with tomatoes, mozzarella, basil, salt, and olive oil.', price: 14.99, category: 'Entrees', image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'margherita pizza' },
        { id: 'ent2', name: 'Grilled Salmon', description: 'Fresh salmon fillet grilled to perfection, served with asparagus.', price: 22.50, category: 'Entrees', icon: FishSymbol, image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'grilled salmon' },
        { id: 'ent3', name: 'Steak Frites', description: 'Grilled sirloin steak served with a side of crispy french fries.', price: 25.00, category: 'Entrees', icon: Beef, image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'steak frites' },
        { id: 'ent4', name: 'Vegan Burger', description: 'Plant-based patty with lettuce, tomato, onion, and vegan mayo on a whole wheat bun.', price: 16.00, category: 'Entrees', icon: Vegan, image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'vegan burger' },
      ],
    },
    {
      name: 'Desserts',
      icon: CakeSlice,
      items: [
        { id: 'des1', name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with a gooey molten center.', price: 9.99, category: 'Desserts', image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'chocolate cake' },
        { id: 'des2', name: 'Cheesecake', description: 'Creamy New York style cheesecake with a graham cracker crust.', price: 8.50, category: 'Desserts', image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'cheesecake slice' },
        { id: 'des3', name: 'Assorted Cookies', description: 'A plate of freshly baked chocolate chip, oatmeal raisin, and sugar cookies.', price: 6.00, category: 'Desserts', icon: Cookie, image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'cookies plate' },
      ],
    },
    {
      name: 'Drinks',
      icon: Coffee,
      items: [
        { id: 'dri1', name: 'Espresso', description: 'Strong black coffee brewed by forcing steam through ground coffee beans.', price: 3.00, category: 'Drinks', image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'espresso cup' },
        { id: 'dri2', name: 'Latte', description: 'Espresso with steamed milk and a thin layer of foam.', price: 4.50, category: 'Drinks', image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'latte art' },
        { id: 'dri3', name: 'Red Wine', description: 'Glass of house Cabernet Sauvignon.', price: 7.00, category: 'Drinks', icon: Wine, image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'red wine' },
        { id: 'dri4', name: 'Sparkling Water', description: 'Chilled sparkling mineral water.', price: 2.50, category: 'Drinks', icon: GlassWater, image: 'https://placehold.co/300x200.png', 'data-ai-hint': 'sparkling water' },
      ],
    },
  ],
};
