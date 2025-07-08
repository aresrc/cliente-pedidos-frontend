
'use client';

import type { KDSOrder, KDSOrderStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Utensils, Clock, Info } from 'lucide-react';
import { formatDistanceToNowStrict, format } from 'date-fns';

interface WaiterOrderCardProps {
  order: KDSOrder;
  onMarkAsServed: (orderId: string) => void;
}

export function WaiterOrderCard({ order, onMarkAsServed }: WaiterOrderCardProps) {
  const orderTimeAgo = formatDistanceToNowStrict(new Date(order.timestamp), { addSuffix: true });
  const servedTime = order.servedAt ? format(new Date(order.servedAt), 'p') : ''; // 'p' for short time like 2:30 PM

  const getStatusColorClass = (status: KDSOrderStatus) => {
    switch (status) {
      case 'ready': return 'bg-green-500 text-white';
      case 'served': return 'bg-slate-500 text-white';
      default: return 'bg-gray-400 text-white'; // Should not happen in waiter view for these cards
    }
  }

  return (
    <Card className={`shadow-md w-full bg-card ${order.status === 'served' ? 'opacity-75' : 'hover:shadow-lg transition-shadow'}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-foreground">Order #{order.id.slice(-6)}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground flex items-center">
              <Clock className="h-3 w-3 mr-1" /> Ordered: {orderTimeAgo}
              {order.status === 'served' && order.servedAt && (
                <span className="ml-2 flex items-center"><Info className="h-3 w-3 mr-1" /> Served: {servedTime}</span>
              )}
            </CardDescription>
          </div>
          <Badge className={`capitalize ${getStatusColorClass(order.status)}`}>
            {order.status === 'ready' ? 'Ready for Pickup' : order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[100px] pr-3 mb-2">
          <ul className="space-y-1 text-sm">
            {order.items.map(item => (
              <li key={item.id} className="flex justify-between text-foreground">
                <span>{item.name}</span>
                <span className="font-medium">x {item.quantity}</span>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <div className="text-right font-semibold text-primary">
          Total: ${order.totalCost.toFixed(2)}
        </div>
      </CardContent>
      {order.status === 'ready' && (
        <CardFooter className="flex justify-end pt-4 border-t border-border">
          <Button onClick={() => onMarkAsServed(order.id)} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Utensils className="mr-2 h-4 w-4" /> Mark as Served
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
