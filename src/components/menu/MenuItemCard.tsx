import Image from 'next/image';
import type { MenuItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

interface MenuItemCardProps {
  item: MenuItem;
  onAddItem: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onAddItem }: MenuItemCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={item.image || `https://placehold.co/400x300.png`}
            alt={item.name}
            data-ai-hint={item['data-ai-hint'] as string || 'food plate'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            priority={false}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-xl mb-1 text-foreground">{item.name}</CardTitle>
        <CardDescription className="text-muted-foreground h-16 overflow-hidden text-ellipsis">{item.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 pt-0">
        <p className="text-lg font-semibold text-primary">${item.price.toFixed(2)}</p>
        <Button onClick={() => onAddItem(item)} size="sm" aria-label={`Add ${item.name} to order`}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add
        </Button>
      </CardFooter>
    </Card>
  );
}
