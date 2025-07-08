
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/shared/Header';
import { MenuCategory } from '@/components/menu/MenuCategory';
import { OrderSummary } from '@/components/order/OrderSummary';
import { QRCodeDisplay } from '@/components/order/QRCodeDisplay';
import { SmartSuggestions } from '@/components/ai/SmartSuggestions';
import { SalesReceiptModal } from '@/components/order/SalesReceiptModal';
import { mockMenuData } from '@/lib/mock-data';
import type { MenuItem, OrderItem, MenuData, KDSOrder, KDSOrderItem, ReceiptData, ConsolidatedReceiptItem } from '@/lib/types';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";

const KDS_STORAGE_KEY = 'kdsOrders'; 
const KDS_STAGED_ORDERS_KEY = 'kdsStagedOrders'; 
const SESSION_ORDERS_STORAGE_KEY = 'menuQuickSessionOrderIds'; 
const STAGED_ORDER_CLIENT_KEY_PREFIX = 'stagedOrderForClient_';
const SESSION_TABLE_NUMBER_KEY = 'menuQuickSessionTableNumber';


export default function MenuQuickPage() {
  const [menuData] = useState<MenuData>(mockMenuData);
  const [currentCartItems, setCurrentCartItems] = useState<OrderItem[]>([]);
  const [sessionOrderIds, setSessionOrderIds] = useState<string[]>([]); 
  const [activeKdsDisplayOrders, setActiveKdsDisplayOrders] = useState<KDSOrder[]>([]); 
  const [stagedOrderForClient, setStagedOrderForClient] = useState<KDSOrder | null>(null); 

  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [qrCodeOrderIdForModal, setQrCodeOrderIdForModal] = useState('');
  const [qrCodeDataUrlForModal, setQrCodeDataUrlForModal] = useState('');
  
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptDataForModal, setReceiptDataForModal] = useState<ReceiptData | null>(null);

  const [timeOfDay, setTimeOfDay] = useState<string>('');
  const { toast } = useToast();

  const getUniqueClientId = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (!sessionStorage.getItem('menuQuickClientId')) {
        sessionStorage.setItem('menuQuickClientId', Math.random().toString(36).substring(2, 15));
      }
      return sessionStorage.getItem('menuQuickClientId') || 'default';
    }
    return 'default';
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSessionIds = localStorage.getItem(SESSION_ORDERS_STORAGE_KEY);
      if (storedSessionIds) {
        setSessionOrderIds(JSON.parse(storedSessionIds));
      }
      const clientId = getUniqueClientId();
      const storedStagedOrder = localStorage.getItem(`${STAGED_ORDER_CLIENT_KEY_PREFIX}${clientId}`);
      if (storedStagedOrder) {
        const parsedStagedOrder: KDSOrder = JSON.parse(storedStagedOrder);
        const currentSessionOrderIds = storedSessionIds ? JSON.parse(storedSessionIds) : [];
        if (!currentSessionOrderIds.includes(parsedStagedOrder.id)) {
          setStagedOrderForClient(parsedStagedOrder);
        } else {
           localStorage.removeItem(`${STAGED_ORDER_CLIENT_KEY_PREFIX}${clientId}`); 
        }
      }
    }
    const getCurrentTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 18) return 'afternoon';
      if (hour >= 18 && hour < 23) return 'evening';
      return 'night';
    };
    setTimeOfDay(getCurrentTimeOfDay());
  }, [getUniqueClientId]); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_ORDERS_STORAGE_KEY, JSON.stringify(sessionOrderIds));
    }
  }, [sessionOrderIds]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clientId = getUniqueClientId();
      if (stagedOrderForClient) {
        localStorage.setItem(`${STAGED_ORDER_CLIENT_KEY_PREFIX}${clientId}`, JSON.stringify(stagedOrderForClient));
      } else {
        localStorage.removeItem(`${STAGED_ORDER_CLIENT_KEY_PREFIX}${clientId}`);
      }
    }
  }, [stagedOrderForClient, getUniqueClientId]);

  useEffect(() => {
    const fetchAndUpdateActiveOrders = () => {
      if (typeof window === 'undefined') return;

      const storedSessionIdsRaw = localStorage.getItem(SESSION_ORDERS_STORAGE_KEY);
      const latestSessionOrderIds: string[] = storedSessionIdsRaw ? JSON.parse(storedSessionIdsRaw) : [];
      
      if (JSON.stringify(latestSessionOrderIds) !== JSON.stringify(sessionOrderIds)) {
          setSessionOrderIds(latestSessionOrderIds);
      }
      
      const storedKdsOrdersRaw = localStorage.getItem(KDS_STORAGE_KEY);
      const allKdsOrders: KDSOrder[] = storedKdsOrdersRaw ? JSON.parse(storedKdsOrdersRaw) : [];
      
      const currentSessionKdsOrders = allKdsOrders.filter(order => latestSessionOrderIds.includes(order.id));
      currentSessionKdsOrders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      if (stagedOrderForClient && latestSessionOrderIds.includes(stagedOrderForClient.id)) {
        setStagedOrderForClient(null); 
      }

      const stillActiveOrServedIdsInKDS = currentSessionKdsOrders.map(o => o.id);
      const removedIds = latestSessionOrderIds.filter(id => 
        !stillActiveOrServedIdsInKDS.includes(id) && 
        (!stagedOrderForClient || id !== stagedOrderForClient.id) 
      );
      if (removedIds.length > 0) {
        setSessionOrderIds(prevIds => prevIds.filter(id => !removedIds.includes(id)));
         toast({
          title: "Actualización de Pedido",
          description: `Uno o más de tus pedidos activos fueron eliminados del sistema de cocina.`,
        });
      }
      
      setActiveKdsDisplayOrders(prevDisplayOrders => {
          const relevantPrevOrders = prevDisplayOrders.filter(order => 
            latestSessionOrderIds.includes(order.id) || 
            (stagedOrderForClient && order.id === stagedOrderForClient.id)
          );
          
          const hasChanged = currentSessionKdsOrders.length !== relevantPrevOrders.filter(o => !stagedOrderForClient || o.id !== stagedOrderForClient.id).length ||
                             currentSessionKdsOrders.some(newOrder => {
                                 const oldOrder = relevantPrevOrders.find(o => o.id === newOrder.id);
                                 return !oldOrder || oldOrder.status !== newOrder.status || oldOrder.tableNumber !== newOrder.tableNumber;
                             });
          if (hasChanged) {
              currentSessionKdsOrders.forEach(newOrder => {
                  const oldOrder = relevantPrevOrders.find(o => o.id === newOrder.id);
                  if (newOrder.status === 'ready' && (!oldOrder || oldOrder.status !== 'ready')) {
                      toast({
                          title: "¡Pedido Listo!",
                          description: `El pedido #${newOrder.id.slice(-4)} ${newOrder.tableNumber ? `en Mesa ${newOrder.tableNumber} ` : ''}está listo para recoger.`,
                      });
                  } else if (newOrder.status === 'served' && (!oldOrder || oldOrder.status !== 'served')) {
                       toast({
                          title: "¡Pedido Servido!",
                          description: `El pedido #${newOrder.id.slice(-4)} ${newOrder.tableNumber ? `en Mesa ${newOrder.tableNumber} ` : ''}ha sido servido. ¡Buen provecho!`,
                      });
                  }
              });
              return currentSessionKdsOrders;
          }
          return relevantPrevOrders.filter(o => latestSessionOrderIds.includes(o.id) || (stagedOrderForClient && o.id === stagedOrderForClient.id));
      });
    };

    fetchAndUpdateActiveOrders();
    const intervalId = setInterval(fetchAndUpdateActiveOrders, 2500); 

    return () => clearInterval(intervalId);
  }, [sessionOrderIds, toast, stagedOrderForClient]); 
  
  const allMenuItems = useMemo(() => menuData.categories.flatMap(category => category.items), [menuData]);

  const handleAddItemToCart = (itemToAdd: MenuItem) => {
    setCurrentCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === itemToAdd.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === itemToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...itemToAdd, quantity: 1 }];
    });
    toast({
      title: "Artículo Añadido al Carrito",
      description: `${itemToAdd.name} ha sido añadido a tu carrito actual.`,
    });
  };

  const handleAddSuggestedItemByName = (itemName: string) => {
    const itemToAdd = allMenuItems.find(item => item.name === itemName);
    if (itemToAdd) {
      handleAddItemToCart(itemToAdd);
    } else {
      toast({
        title: "Error",
        description: `No se pudo encontrar ${itemName} en el menú.`,
        variant: "destructive",
      });
    }
  };

  const handleUpdateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(itemId);
      return;
    }
    setCurrentCartItems((prevItems) =>
      prevItems.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    const itemToRemove = currentCartItems.find(item => item.id === itemId);
    setCurrentCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    if (itemToRemove) {
      toast({
        title: "Artículo Eliminado del Carrito",
        description: `${itemToRemove.name} ha sido eliminado de tu carrito actual.`,
      });
    }
  };

  const generateQrCodeDataUrl = (orderIdForQr: string) => {
    if (typeof window === 'undefined') return '';
    const activationUrl = `${window.location.origin}/kds-activate-order?orderId=${encodeURIComponent(orderIdForQr)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(activationUrl)}&size=250x250&format=svg&color=5D4037&bgcolor=F2E7D8`;
  };
  
  const handleSendCartToKitchen = () => {
    if (currentCartItems.length === 0) {
      toast({
        title: "Carrito Vacío",
        description: "Por favor, añade artículos a tu carrito antes de enviar a cocina.",
        variant: "destructive"
      });
      return;
    }

    if (stagedOrderForClient) {
      toast({
        title: "Pedido en Espera Existente",
        description: "Ya tienes un pedido esperando activación. Por favor, activa o cancela ese pedido antes de crear uno nuevo.",
        variant: "destructive"
      });
      return;
    }

    const kdsOrderItems: KDSOrderItem[] = currentCartItems.map(item => ({ 
      id: item.id,
      name: item.name, 
      quantity: item.quantity, 
      price: item.price 
    }));
    const currentOrderTotalCost = currentCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newOrderId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    
    const newKdsOrder: KDSOrder = {
      id: newOrderId,
      items: kdsOrderItems,
      totalCost: currentOrderTotalCost,
      timestamp: new Date().toISOString(),
      status: 'pending', 
    };

    if (typeof window !== 'undefined') {
      const currentSessionTableNumber = localStorage.getItem(SESSION_TABLE_NUMBER_KEY);

      if (sessionOrderIds.length === 0 || !currentSessionTableNumber) { 
        try {
          const existingStagedOrdersRaw = localStorage.getItem(KDS_STAGED_ORDERS_KEY);
          const existingStagedOrders: Record<string, KDSOrder> = existingStagedOrdersRaw ? JSON.parse(existingStagedOrdersRaw) : {};
          existingStagedOrders[newOrderId] = newKdsOrder; 
          localStorage.setItem(KDS_STAGED_ORDERS_KEY, JSON.stringify(existingStagedOrders));
          
          setStagedOrderForClient(newKdsOrder); 
          setQrCodeOrderIdForModal(newOrderId);
          setQrCodeDataUrlForModal(generateQrCodeDataUrl(newOrderId));
          setShowQRCodeModal(true);
          setCurrentCartItems([]); 

          toast({
            title: "QR Generado",
            description: "Presenta el QR al personal para enviar tu pedido a cocina y asignar una mesa.",
          });
        } catch (error) {
          console.error("Failed to save staged KDS order to localStorage:", error);
          toast({
            title: "Error de Almacenamiento",
            description: "No se pudo preparar el pedido para enviar a cocina.",
            variant: "destructive",
          });
        }
      } else { 
        try {
          if (currentSessionTableNumber) {
            newKdsOrder.tableNumber = currentSessionTableNumber;
          }

          const kdsOrdersRaw = localStorage.getItem(KDS_STORAGE_KEY);
          let kdsOrders: KDSOrder[] = kdsOrdersRaw ? JSON.parse(kdsOrdersRaw) : [];
          kdsOrders.unshift(newKdsOrder); 
          localStorage.setItem(KDS_STORAGE_KEY, JSON.stringify(kdsOrders));

          setSessionOrderIds(prevIds => [...prevIds, newKdsOrder.id]);
          
          setCurrentCartItems([]);
          toast({
            title: "Nuevos Artículos Enviados",
            description: `Tus artículos adicionales han sido enviados a la cocina ${currentSessionTableNumber ? `para la Mesa ${currentSessionTableNumber}` : ''}.`,
          });
        } catch (error) {
          console.error("Failed to save direct KDS order to localStorage:", error);
          toast({
            title: "Error de Almacenamiento",
            description: "No se pudo enviar el pedido adicional a cocina.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleShowExistingQR = (orderId: string) => {
    if (typeof window === 'undefined') return;
  
    let orderToShow: KDSOrder | undefined;
    if (stagedOrderForClient && stagedOrderForClient.id === orderId) {
      orderToShow = stagedOrderForClient;
    } else {
      const stagedOrdersRaw = localStorage.getItem(KDS_STAGED_ORDERS_KEY);
      const stagedOrders: Record<string, KDSOrder> = stagedOrdersRaw ? JSON.parse(stagedOrdersRaw) : {};
      orderToShow = stagedOrders[orderId];
    }
  
    if (orderToShow) {
      setQrCodeOrderIdForModal(orderId);
      setQrCodeDataUrlForModal(generateQrCodeDataUrl(orderId));
      setShowQRCodeModal(true);
    } else {
      toast({
        title: "Error",
        description: "No se pudo encontrar el pedido para mostrar el QR.",
        variant: "destructive",
      });
    }
  };

  const handleCancelStagedOrder = () => {
    if (!stagedOrderForClient) return;
    if (typeof window !== 'undefined') {
      try {
        const existingStagedOrdersRaw = localStorage.getItem(KDS_STAGED_ORDERS_KEY);
        let allStagedOrders: Record<string, KDSOrder> = existingStagedOrdersRaw ? JSON.parse(existingStagedOrdersRaw) : {};
        delete allStagedOrders[stagedOrderForClient.id];
        localStorage.setItem(KDS_STAGED_ORDERS_KEY, JSON.stringify(allStagedOrders));

        const clientId = getUniqueClientId();
        localStorage.removeItem(`${STAGED_ORDER_CLIENT_KEY_PREFIX}${clientId}`);
        
        setStagedOrderForClient(null);
        toast({
          title: "Pedido en Espera Cancelado",
          description: `El pedido #${stagedOrderForClient.id.slice(-6)} ha sido cancelado.`,
        });
      } catch (error) {
        console.error("Failed to cancel staged KDS order:", error);
        toast({
          title: "Error al Cancelar",
          description: "No se pudo cancelar el pedido en espera.",
          variant: "destructive",
        });
      }
    }
  };
  
  const generateReceiptData = (): ReceiptData | null => {
    const ordersForReceipt = activeKdsDisplayOrders.filter(
      o => sessionOrderIds.includes(o.id) && (o.status === 'served' || o.status === 'ready')
    );
  
    if (ordersForReceipt.length === 0 && !stagedOrderForClient) { // Staged not paid
      return null;
    }
  
    const consolidatedItemsMap = new Map<string, ConsolidatedReceiptItem>();
    let grandTotal = 0;
    const orderIdsProcessed: string[] = [];
    const tableNumberForReceipt = localStorage.getItem(SESSION_TABLE_NUMBER_KEY) || undefined;
  
    // Consolidate items from active orders (served or ready)
    ordersForReceipt.forEach(order => {
      orderIdsProcessed.push(order.id.slice(-6)); // Store short IDs for receipt display
      order.items.forEach(item => {
        grandTotal += item.price * item.quantity;
        if (consolidatedItemsMap.has(item.id)) {
          const existing = consolidatedItemsMap.get(item.id)!;
          existing.quantity += item.quantity;
          existing.totalPrice += item.price * item.quantity;
        } else {
          consolidatedItemsMap.set(item.id, {
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
          });
        }
      });
    });
  
    const items: ConsolidatedReceiptItem[] = Array.from(consolidatedItemsMap.values());
  
    return {
      items,
      grandTotal,
      tableNumber: tableNumberForReceipt,
      orderIds: orderIdsProcessed.length > 0 ? orderIdsProcessed : (stagedOrderForClient ? [stagedOrderForClient.id.slice(-6)] : []),
      date: new Date().toLocaleString(),
      restaurantName: "MenuQuick Restaurant",
      receiptTitle: "Boleta de Venta"
    };
  };

  const handlePayment = () => {
    const ordersConsideredForPayment = activeKdsDisplayOrders.filter(o => 
      sessionOrderIds.includes(o.id) && (o.status === 'served' || o.status === 'ready')
    );

    if (ordersConsideredForPayment.length === 0) { 
         toast({ title: "Sin Pedidos Servidos/Listos", description: "No hay pedidos servidos o listos para pagar.", variant: "destructive" });
         return;
    }
    
    const receiptData = generateReceiptData();
    if (receiptData) {
      setReceiptDataForModal(receiptData);
      setShowReceiptModal(true);
    } else {
       // This case should ideally not be hit if the button is enabled correctly
       toast({ title: "Error al generar boleta", description: "No se encontraron pedidos para la boleta.", variant: "destructive" });
    }
  };

  const handleFinalizeSession = () => {
     if (typeof window !== 'undefined') {
      try {
        // Remove paid orders (served/ready) from main KDS storage
        const existingKdsOrdersRaw = localStorage.getItem(KDS_STORAGE_KEY);
        let allKdsOrders: KDSOrder[] = existingKdsOrdersRaw ? JSON.parse(existingKdsOrdersRaw) : [];
        
        const paidOrderIds = activeKdsDisplayOrders
          .filter(o => sessionOrderIds.includes(o.id) && (o.status === 'served' || o.status === 'ready'))
          .map(o => o.id);

        allKdsOrders = allKdsOrders.filter(order => !paidOrderIds.includes(order.id));
        localStorage.setItem(KDS_STORAGE_KEY, JSON.stringify(allKdsOrders));
        
        // Clear any staged order for this client
        if (stagedOrderForClient) { 
          const existingStagedOrdersRaw = localStorage.getItem(KDS_STAGED_ORDERS_KEY);
          let allStagedOrders: Record<string, KDSOrder> = existingStagedOrdersRaw ? JSON.parse(existingStagedOrdersRaw) : {};
          delete allStagedOrders[stagedOrderForClient.id];
          localStorage.setItem(KDS_STAGED_ORDERS_KEY, JSON.stringify(allStagedOrders));
          const clientId = getUniqueClientId();
          localStorage.removeItem(`${STAGED_ORDER_CLIENT_KEY_PREFIX}${clientId}`); 
        }
        
        localStorage.removeItem(SESSION_ORDERS_STORAGE_KEY); 
        localStorage.removeItem(SESSION_TABLE_NUMBER_KEY); 

      } catch (error) {
        console.error("Failed to update KDS/Staged orders in localStorage after payment:", error);
         toast({
          title: "Error de Almacenamiento",
          description: "No se pudo actualizar el estado de los pedidos después del pago.",
          variant: "destructive",
        });
      }
    }

    setCurrentCartItems([]);
    setSessionOrderIds([]);
    setActiveKdsDisplayOrders([]);
    setStagedOrderForClient(null);
    setShowQRCodeModal(false); 
    setQrCodeOrderIdForModal('');
    setQrCodeDataUrlForModal('');
    setShowReceiptModal(false);
    setReceiptDataForModal(null);

    toast({
      title: "¡Pago Exitoso y Sesión Reiniciada!",
      description: `Gracias por tu preferencia. ¡Esperamos verte pronto!`,
    });
  };


  const combinedItemsForAISuggestions = useMemo(() => {
    const activeItems = activeKdsDisplayOrders.flatMap(order => order.items.map(item => ({ name: item.name })));
    const stagedItems = stagedOrderForClient ? stagedOrderForClient.items.map(item => ({ name: item.name })) : [];
    const cartItems = currentCartItems.map(item => ({ name: item.name }));
    return [...activeItems, ...stagedItems, ...cartItems];
  }, [activeKdsDisplayOrders, currentCartItems, stagedOrderForClient]);

  const isAnyOrderActiveOrStaged = sessionOrderIds.length > 0 || !!stagedOrderForClient;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:flex lg:gap-12">
          <div className="lg:w-2/3 space-y-10">
            {timeOfDay && (
              <SmartSuggestions
                timeOfDay={timeOfDay}
                currentOrderItems={combinedItemsForAISuggestions}
                onAddSuggestedItem={handleAddSuggestedItemByName}
                menuItems={allMenuItems}
                isOrderActive={isAnyOrderActiveOrStaged}
              />
            )}
            {menuData.categories.map((category) => (
              <MenuCategory key={category.name} category={category} onAddItem={handleAddItemToCart} />
            ))}
          </div>

          <div className="lg:w-1/3 mt-10 lg:mt-0 lg:sticky lg:top-10 self-start">
            <OrderSummary
              currentCartItems={currentCartItems}
              stagedOrderForClient={stagedOrderForClient}
              activeKitchenOrders={activeKdsDisplayOrders} 
              onUpdateCartItemQuantity={handleUpdateCartItemQuantity}
              onRemoveCartItem={handleRemoveCartItem}
              onSendCartToKitchen={handleSendCartToKitchen} 
              onShowExistingQR={handleShowExistingQR}
              onCancelStagedOrder={handleCancelStagedOrder}
              onPayment={handlePayment}
            />
          </div>
        </div>
      </main>

      <footer className="py-6 text-center border-t border-border">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} MenuQuick. Todos los derechos reservados.</p>
      </footer>

      <Dialog open={showQRCodeModal} onOpenChange={(isOpen) => {
          setShowQRCodeModal(isOpen);
          if (!isOpen) { 
            setQrCodeDataUrlForModal(''); 
            setQrCodeOrderIdForModal('');
          }
        }}
      >
        {qrCodeDataUrlForModal && qrCodeOrderIdForModal && (
          <QRCodeDisplay qrCodeDataUrl={qrCodeDataUrlForModal} orderId={qrCodeOrderIdForModal} />
        )}
      </Dialog>

      {receiptDataForModal && (
        <SalesReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            handleFinalizeSession();
          }}
          receiptData={receiptDataForModal}
        />
      )}
    </div>
  );
}
