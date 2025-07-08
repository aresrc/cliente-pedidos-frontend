
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { KDSOrder, KDSOrderStatus } from '@/lib/types';
import { KDSOrderCard } from '@/components/kds/KDSOrderCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';

const KDS_STORAGE_KEY = 'kdsOrders';

export default function KDSPage() {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadOrdersFromLocalStorage = useCallback(() => {
    setIsLoading(true);
    if (typeof window !== 'undefined') {
      try {
        const storedOrders = localStorage.getItem(KDS_STORAGE_KEY);
        let parsedOrders: KDSOrder[] = storedOrders ? JSON.parse(storedOrders) : [];
        // Filter out 'served' orders for KDS view
        parsedOrders = parsedOrders.filter(order => order.status !== 'served');
        // Sort by timestamp, newest first
        parsedOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setOrders(parsedOrders);
      } catch (error) {
        console.error("Error loading KDS orders from localStorage:", error);
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
    const intervalId = setInterval(loadOrdersFromLocalStorage, 3000); // Poll for updates
    return () => clearInterval(intervalId);
  }, [loadOrdersFromLocalStorage]);

  const saveOrdersToLocalStorage = (updatedOrders: KDSOrder[]) => {
    if (typeof window !== 'undefined') {
      try {
        // When saving from KDS, ensure we don't overwrite 'served' status if it was updated elsewhere
        const currentStoredOrdersRaw = localStorage.getItem(KDS_STORAGE_KEY);
        const currentStoredOrders: KDSOrder[] = currentStoredOrdersRaw ? JSON.parse(currentStoredOrdersRaw) : [];
        
        const ordersToSave = currentStoredOrders.map(existingOrder => {
          const updatedVersion = updatedOrders.find(uo => uo.id === existingOrder.id);
          if (updatedVersion) {
            // If KDS is trying to update an order that a waiter marked as served, keep 'served'
            return existingOrder.status === 'served' && updatedVersion.status !== 'served' ? existingOrder : updatedVersion;
          }
          return existingOrder;
        });

        // Add any new orders from updatedOrders not yet in currentStoredOrders (e.g. newly activated)
        updatedOrders.forEach(newOrder => {
          if (!ordersToSave.find(o => o.id === newOrder.id)) {
            ordersToSave.push(newOrder);
          }
        });

        localStorage.setItem(KDS_STORAGE_KEY, JSON.stringify(ordersToSave));
      } catch (error) {
        console.error("Error saving KDS orders to localStorage:", error);
        toast({
          title: "Error Saving Orders",
          description: "Could not update orders in local storage.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: KDSOrderStatus) => {
    setOrders(prevOrders => {
      const updatedOrders = prevOrders.map(order =>
        order.id === orderId ? { ...order, status } : order
      );
      // When KDS updates, it should persist its changes without overwriting 'served'
      // The saveOrdersToLocalStorage will handle merging correctly
      saveOrdersToLocalStorage(updatedOrders); 
      return updatedOrders.filter(o => o.status !== 'served'); // Re-filter for KDS view
    });
    toast({
      title: "Order Updated",
      description: `Order #${orderId.slice(-4)} status changed to ${status}.`,
    });
  };

  const handleClearOrder = (orderId: string) => {
    // "Clearing" from KDS means removing it from active display, effectively deleting it if not served.
    // If it was served, it's already filtered out. If it's pending/preparing/ready, this removes it.
    setOrders(prevOrders => {
      const updatedOrders = prevOrders.filter(order => order.id !== orderId);
      
      // Update localStorage by removing this order from the main list
      const currentStoredOrdersRaw = localStorage.getItem(KDS_STORAGE_KEY);
      let allStoredOrders: KDSOrder[] = currentStoredOrdersRaw ? JSON.parse(currentStoredOrdersRaw) : [];
      allStoredOrders = allStoredOrders.filter(o => o.id !== orderId);
      localStorage.setItem(KDS_STORAGE_KEY, JSON.stringify(allStoredOrders));

      return updatedOrders;
    });
    toast({
      title: "Order Cleared",
      description: `Order #${orderId.slice(-4)} has been removed from the KDS.`,
    });
  };
  

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background text-foreground p-4">
        <RefreshCw className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Loading KDS Orders...</p>
      </div>
    );
  }
  
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');


  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <header className="bg-card shadow-md p-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80">
             <ShoppingBag className="h-7 w-7" />
            <h1 className="text-2xl font-bold">MenuQuick KDS</h1>
          </Link>
          <Button onClick={loadOrdersFromLocalStorage} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Orders
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto max-w-full p-4 sm:p-6 lg:p-8">
        {orders.filter(o => o.status !== 'served').length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-[60vh]">
            <AlertTriangle className="h-16 w-16 text-primary mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-foreground">No Active Orders</h2>
            <p className="text-muted-foreground">New orders will appear here once customers generate a QR code.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pending Column */}
            <section>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-yellow-500 text-yellow-600">
                Pending ({pendingOrders.length})
              </h2>
              {pendingOrders.length === 0 ? <p className="text-muted-foreground italic">No pending orders.</p> : null}
              <div className="space-y-4">
                {pendingOrders.map(order => (
                  <KDSOrderCard 
                    key={order.id} 
                    order={order} 
                    onUpdateStatus={handleUpdateOrderStatus}
                    onClearOrder={handleClearOrder}
                  />
                ))}
              </div>
            </section>

            {/* Preparing Column */}
            <section>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-blue-500 text-blue-600">
                Preparing ({preparingOrders.length})
              </h2>
              {preparingOrders.length === 0 ? <p className="text-muted-foreground italic">No orders being prepared.</p> : null}
              <div className="space-y-4">
                {preparingOrders.map(order => (
                  <KDSOrderCard 
                    key={order.id} 
                    order={order} 
                    onUpdateStatus={handleUpdateOrderStatus}
                    onClearOrder={handleClearOrder}
                  />
                ))}
              </div>
            </section>

            {/* Ready Column */}
            <section>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-green-500 text-green-600">
                Ready ({readyOrders.length})
              </h2>
              {readyOrders.length === 0 ? <p className="text-muted-foreground italic">No orders ready for pickup.</p> : null}
              <div className="space-y-4">
                {readyOrders.map(order => (
                  <KDSOrderCard 
                    key={order.id} 
                    order={order} 
                    onUpdateStatus={handleUpdateOrderStatus}
                    onClearOrder={handleClearOrder} // Kitchen can still clear/cancel a ready order
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
