
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { KDSOrder, KDSOrderStatus } from '@/lib/types';
import { WaiterOrderCard } from '@/components/waiter/WaiterOrderCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, ShoppingBag, ConciergeBell } from 'lucide-react';
import Link from 'next/link';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

const KDS_STORAGE_KEY = 'kdsOrders';

export default function WaiterPage() {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadOrdersFromLocalStorage = useCallback(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      try {
        const storedOrders = localStorage.getItem(KDS_STORAGE_KEY);
        const parsedOrders: KDSOrder[] = storedOrders ? JSON.parse(storedOrders) : [];
        // Sort by timestamp, newest first
        parsedOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setOrders(parsedOrders);
      } catch (error) {
        console.error("Error loading orders from localStorage:", error);
        toast({
          title: "Error Loading Orders",
          description: "Could not retrieve orders from local storage.",
          variant: "destructive",
        });
        setOrders([]);
      }
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadOrdersFromLocalStorage();
    // Periodically refresh to catch updates from KDS or other waiter instances
    const intervalId = setInterval(loadOrdersFromLocalStorage, 5000);
    return () => clearInterval(intervalId);
  }, [loadOrdersFromLocalStorage]);

  const saveOrdersToLocalStorage = (updatedOrders: KDSOrder[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(KDS_STORAGE_KEY, JSON.stringify(updatedOrders));
      } catch (error) {
        console.error("Error saving orders to localStorage:", error);
        toast({
          title: "Error Saving Orders",
          description: "Could not update orders in local storage.",
          variant: "destructive",
        });
      }
    }
  };

  const handleMarkAsServed = (orderId: string) => {
    setOrders(prevOrders => {
      const updatedOrders = prevOrders.map(order =>
        order.id === orderId ? { ...order, status: 'served', servedAt: new Date().toISOString() } : order
      );
      saveOrdersToLocalStorage(updatedOrders);
      return updatedOrders;
    });
    toast({
      title: "Order Served",
      description: `Order #${orderId.slice(-4)} marked as served.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground p-4">
        <RefreshCw className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Loading Orders...</p>
      </div>
    );
  }
  
  const readyForPickupOrders = orders.filter(o => o.status === 'ready');
  // Show recently served, e.g., last 10 or last 30 mins. For simplicity, let's show all served for now.
  const recentlyServedOrders = orders.filter(o => o.status === 'served').sort((a,b) => new Date(b.servedAt!).getTime() - new Date(a.servedAt!).getTime());


  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <header className="bg-card shadow-md p-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80">
             <ConciergeBell className="h-7 w-7" />
            <h1 className="text-2xl font-bold">MenuQuick Waiter View</h1>
          </Link>
          <Button onClick={loadOrdersFromLocalStorage} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Orders
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto max-w-full p-4 sm:p-6 lg:p-8">
        {orders.length === 0 || (readyForPickupOrders.length === 0 && recentlyServedOrders.length === 0) ? (
          <div className="flex flex-col items-center justify-center text-center h-[60vh]">
            <AlertTriangle className="h-16 w-16 text-primary mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-foreground">No Orders to Display</h2>
            <p className="text-muted-foreground">Orders ready for pickup or recently served will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-green-500 text-green-600">
                Ready for Pickup ({readyForPickupOrders.length})
              </h2>
              {readyForPickupOrders.length === 0 ? <p className="text-muted-foreground italic">No orders ready for pickup.</p> : null}
              <div className="space-y-4">
                {readyForPickupOrders.map(order => (
                  <WaiterOrderCard 
                    key={order.id} 
                    order={order} 
                    onMarkAsServed={handleMarkAsServed}
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-gray-400 text-gray-500">
                Recently Served ({recentlyServedOrders.length})
              </h2>
              {recentlyServedOrders.length === 0 ? <p className="text-muted-foreground italic">No orders recently served.</p> : null}
              <div className="space-y-4">
                {recentlyServedOrders.map(order => (
                  <WaiterOrderCard 
                    key={order.id} 
                    order={order}
                    onMarkAsServed={() => {}} // No action for already served
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
