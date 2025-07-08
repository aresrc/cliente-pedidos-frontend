
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Loader2, ShoppingBag, Ticket } from 'lucide-react';
import type { KDSOrder } from '@/lib/types';

const KDS_STORAGE_KEY = 'kdsOrders'; // Main KDS order list
const KDS_STAGED_ORDERS_KEY = 'kdsStagedOrders'; // Orders awaiting activation
const SESSION_ORDERS_STORAGE_KEY = 'menuQuickSessionOrderIds'; // Tracks activated order IDs for the user's session
const SESSION_TABLE_NUMBER_KEY = 'menuQuickSessionTableNumber'; // Stores the table number for the current session

export default function KDSActivateOrderPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedTable, setAssignedTable] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('No se proporcionó un ID de pedido.');
      setIsLoading(false);
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        // Retrieve staged orders
        const stagedOrdersRaw = localStorage.getItem(KDS_STAGED_ORDERS_KEY);
        const stagedOrders: Record<string, KDSOrder> = stagedOrdersRaw ? JSON.parse(stagedOrdersRaw) : {};

        const orderToActivate = stagedOrders[orderId];

        if (!orderToActivate) {
          const kdsOrdersRaw = localStorage.getItem(KDS_STORAGE_KEY);
          const kDSOrders: KDSOrder[] = kdsOrdersRaw ? JSON.parse(kDSOrdersRaw) : [];
          const existingOrder = kDSOrders.find(o => o.id === orderId);
          if (existingOrder) {
            setMessage(`Pedido ${orderId.slice(-6)} ya había sido activado y enviado a cocina.`);
            if (existingOrder.tableNumber) {
              setAssignedTable(existingOrder.tableNumber);
            }
             const sessionOrdersRaw = localStorage.getItem(SESSION_ORDERS_STORAGE_KEY);
             let sessionOrderIds: string[] = sessionOrdersRaw ? JSON.parse(sessionOrdersRaw) : [];
             if (!sessionOrderIds.includes(orderId)) {
               sessionOrderIds.push(orderId);
               localStorage.setItem(SESSION_ORDERS_STORAGE_KEY, JSON.stringify(sessionOrderIds));
             }
          } else {
            setError(`Pedido con ID ${orderId.slice(-6)} no encontrado en espera o ya procesado.`);
          }
          setIsLoading(false);
          return;
        }

        // Assign table number if this is the first activation for the session
        let tableNumber = localStorage.getItem(SESSION_TABLE_NUMBER_KEY);
        if (!tableNumber) {
          tableNumber = `T${Math.floor(100 + Math.random() * 900)}`;
          localStorage.setItem(SESSION_TABLE_NUMBER_KEY, tableNumber);
        }
        setAssignedTable(tableNumber);
        orderToActivate.tableNumber = tableNumber;


        // Retrieve current KDS orders
        const kdsOrdersRaw = localStorage.getItem(KDS_STORAGE_KEY);
        const kdsOrders: KDSOrder[] = kdsOrdersRaw ? JSON.parse(kdsOrdersRaw) : [];

        if (kdsOrders.some(o => o.id === orderId)) {
            setMessage(`Pedido ${orderId.slice(-6)} ya había sido enviado a cocina.`);
            if (orderToActivate.tableNumber) setAssignedTable(orderToActivate.tableNumber);
            delete stagedOrders[orderId];
            localStorage.setItem(KDS_STAGED_ORDERS_KEY, JSON.stringify(stagedOrders));
        } else {
            kdsOrders.unshift(orderToActivate); 
            localStorage.setItem(KDS_STORAGE_KEY, JSON.stringify(kdsOrders));

            delete stagedOrders[orderId];
            localStorage.setItem(KDS_STAGED_ORDERS_KEY, JSON.stringify(stagedOrders));
            
            setMessage(`Pedido #${orderId.slice(-6)} enviado a cocina correctamente.`);
            if (orderToActivate.tableNumber) setAssignedTable(orderToActivate.tableNumber);
        }

        const sessionOrdersRaw = localStorage.getItem(SESSION_ORDERS_STORAGE_KEY);
        let sessionOrderIds: string[] = sessionOrdersRaw ? JSON.parse(sessionOrdersRaw) : [];
        if (!sessionOrderIds.includes(orderId)) {
          sessionOrderIds.push(orderId);
          localStorage.setItem(SESSION_ORDERS_STORAGE_KEY, JSON.stringify(sessionOrderIds));
        }
        
      } catch (e) {
        console.error('Error al activar el pedido:', e);
        setError('Ocurrió un error al procesar el pedido.');
      } finally {
        setIsLoading(false);
      }
    }
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
       <Link href="/" className="absolute top-4 left-4 flex items-center gap-2 text-primary hover:text-primary/80">
            <ShoppingBag className="h-7 w-7" />
            <h1 className="text-xl font-bold">MenuQuick</h1>
        </Link>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-primary">Activación de Pedido KDS</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Procesando la activación del pedido escaneado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Activando pedido...</p>
            </div>
          )}
          {!isLoading && message && (
            <>
              <div className="p-4 bg-green-100 border border-green-300 rounded-md text-green-700 flex items-center">
                <CheckCircle className="h-6 w-6 mr-3" />
                <div>
                  <p className="font-semibold">¡Éxito!</p>
                  <p>{message}</p>
                </div>
              </div>
              {assignedTable && (
                <div className="p-3 mt-2 bg-blue-50 border border-blue-200 rounded-md text-blue-700 flex items-center justify-center">
                    <Ticket className="h-5 w-5 mr-2"/>
                    <p className="font-semibold">Mesa Asignada: {assignedTable}</p>
                </div>
              )}
            </>
          )}
          {!isLoading && error && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-md text-red-700 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-3" />
              <div>
                <p className="font-semibold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}
          {!isLoading && (
            <div className="flex flex-col gap-2 mt-6">
              <Button asChild className="w-full">
                <Link href="/kds">Ir al KDS</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Volver al Menú Principal</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
