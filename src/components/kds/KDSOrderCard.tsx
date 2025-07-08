
'use client';

import type { KDSOrder, KDSOrderStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlayCircle, CheckCircle2, Trash2, Clock, Ticket } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';

interface KDSOrderCardProps {
  order: KDSOrder;
  onUpdateStatus: (orderId: string, status: KDSOrderStatus) => void;
  onClearOrder: (orderId: string) => void;
}

export function KDSOrderCard({ order, onUpdateStatus, onClearOrder }: KDSOrderCardProps) {
  const timeAgo = formatDistanceToNowStrict(new Date(order.timestamp), { addSuffix: true });

  const getStatusBadgeVariant = (status: KDSOrderStatus) => {
    switch (status) {
      case 'pending': return 'default'; 
      case 'preparing': return 'secondary'; 
      case 'ready': return 'outline'; 
      default: return 'default';
    }
  };
  
  const getStatusColorClass = (status: KDSOrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 text-white';
      case 'preparing': return 'bg-blue-500 text-white';
      case 'ready': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  }


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow w-full bg-card">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-foreground">Order #{order.id.slice(-6)}</CardTitle>
            <div className="flex items-center gap-2">
                <CardDescription className="text-xs text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1" /> {timeAgo}
                </CardDescription>
                {order.tableNumber && (
                <CardDescription className="text-xs text-muted-foreground flex items-center font-medium text-primary">
                    <Ticket className="h-3 w-3 mr-1" /> Mesa: {order.tableNumber}
                </CardDescription>
                )}
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(order.status)} className={`capitalize ${getStatusColorClass(order.status)}`}>
            {order.status}
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
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-border">
        {order.status === 'pending' && (
          <Button onClick={() => onUpdateStatus(order.id, 'preparing')} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto">
            <PlayCircle className="mr-2 h-4 w-4" /> Start Preparing
          </Button>
        )}
        {order.status === 'preparing' && (
          <Button onClick={() => onUpdateStatus(order.id, 'ready')} size="sm" className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Ready
          </Button>
        )}
        {order.status === 'ready' && (
          <Button onClick={() => onClearOrder(order.id)} size="sm" variant="destructive" className="w-full sm:w-auto">
            <Trash2 className="mr-2 h-4 w-4" /> Clear Order
          </Button>
        )}
        {order.status !== 'ready' && order.status !== 'pending' && (
           <Button onClick={() => onClearOrder(order.id)} size="sm" variant="outline" className="w-full sm:w-auto">
             <Trash2 className="mr-2 h-4 w-4" /> Cancel Order
           </Button>
        )}
         {order.status === 'pending' && (
           <Button onClick={() => onClearOrder(order.id)} size="sm" variant="outline" className="w-full sm:w-auto">
            <Trash2 className="mr-2 h-4 w-4" /> Cancel Order
           </Button>
         )}
      </CardFooter>
    </Card>
  );
}
