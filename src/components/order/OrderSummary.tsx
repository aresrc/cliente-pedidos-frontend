
import type { OrderItem, KDSOrder, KDSOrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, MinusCircle, Trash2, QrCode, ShoppingBag, CreditCard, Hourglass, CheckCircle2 as CheckCircleIcon, ChefHat, AlertCircle, Info, Eye, XCircle, Utensils, Send, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

interface OrderSummaryProps {
  currentCartItems: OrderItem[];
  stagedOrderForClient: KDSOrder | null; 
  activeKitchenOrders: KDSOrder[]; 
  onUpdateCartItemQuantity: (itemId: string, quantity: number) => void;
  onRemoveCartItem: (itemId: string) => void;
  onSendCartToKitchen: () => void;
  onShowExistingQR: (orderId: string) => void;
  onCancelStagedOrder: () => void;
  onPayment: () => void;
}

export function OrderSummary({
  currentCartItems,
  stagedOrderForClient,
  activeKitchenOrders,
  onUpdateCartItemQuantity,
  onRemoveCartItem,
  onSendCartToKitchen,
  onShowExistingQR,
  onCancelStagedOrder,
  onPayment,
}: OrderSummaryProps) {
  
  const overallKDSOrderStatus: KDSOrderStatus | 'mixed' | 'all_served' | null = useMemo(() => {
    if (!activeKitchenOrders || activeKitchenOrders.length === 0) return null;
    const statuses = activeKitchenOrders.map(o => o.status);
    if (statuses.every(s => s === 'served')) return 'all_served';
    // If at least one is 'ready' and others are 'served' or also 'ready', consider it 'ready' for status display
    if (statuses.some(s => s === 'ready') && statuses.every(s => s === 'ready' || s === 'served')) return 'ready';
    if (statuses.some(s => s === 'ready') && statuses.some(s => s !== 'ready' && s !== 'served')) return 'mixed'; // e.g. one ready, one preparing
    if (statuses.some(s => s === 'preparing') && statuses.every(s => s === 'preparing' || s === 'pending' || s === 'served')) return 'preparing'; // if some served but others preparing, overall is preparing
    if (statuses.every(s => s === 'pending')) return 'pending';
    // Default to mixed if no other specific state matches but there are active orders
    if (activeKitchenOrders.length > 0) return 'mixed'; 
    return null;
  }, [activeKitchenOrders]);

  const isAnyKDSOrderServed = useMemo(() => activeKitchenOrders.some(order => order.status === 'served'), [activeKitchenOrders]);

  const getKDSStatusMessageAndIcon = () => {
    if (!overallKDSOrderStatus && !stagedOrderForClient) return null;

    let message = '';
    let variant: "default" | "secondary" | "destructive" | "outline" = 'default';
    let icon = <Hourglass className="mr-2 h-4 w-4 animate-spin" />;
    let badgeClass = 'border-yellow-500 text-yellow-600 bg-yellow-100';
    let tableNumberMessage = '';

    const firstActiveOrderWithTable = activeKitchenOrders.find(o => o.tableNumber);
    if (firstActiveOrderWithTable?.tableNumber) {
        tableNumberMessage = ` (Mesa ${firstActiveOrderWithTable.tableNumber})`;
    }


    if (stagedOrderForClient && activeKitchenOrders.length === 0) {
       message = `Pedido #${stagedOrderForClient.id.slice(-6)} esperando activación...`;
       icon = <Hourglass className="mr-2 h-4 w-4 animate-pulse" />;
       badgeClass = 'border-primary/50 text-primary bg-primary/10';
    } else if (overallKDSOrderStatus) {
      switch (overallKDSOrderStatus) {
        case 'pending':
          message = `Pedido(s) en Cocina - Pendiente${tableNumberMessage}`;
          icon = <Hourglass className="mr-2 h-4 w-4 animate-spin" />;
          break;
        case 'preparing':
          message = `Pedido(s) en Preparación${tableNumberMessage}`;
          variant = 'secondary';
          icon = <ChefHat className="mr-2 h-4 w-4 animate-spin" />;
          badgeClass = 'border-blue-500 text-blue-600 bg-blue-100';
          break;
        case 'ready': // This state implies some are ready, others might be served. Pay button now depends on 'served'.
          message = `¡Pedido(s) Listo(s)/Servido(s)!${tableNumberMessage}`;
          variant = 'outline'; 
          icon = <CheckCircleIcon className="mr-2 h-4 w-4 text-green-500" />;
          badgeClass = 'border-green-500 text-green-600 bg-green-100';
          break;
        case 'all_served':
          message = `¡Todo(s) su(s) pedido(s) ha(n) sido servido(s)!${tableNumberMessage}`;
          variant = 'outline';
          icon = <Utensils className="mr-2 h-4 w-4 text-slate-500" />;
          badgeClass = 'border-slate-500 text-slate-600 bg-slate-100';
          break;
        case 'mixed':
          if (activeKitchenOrders.some(s => s.status === 'ready' || s.status === 'served')) {
            message = `Pedidos: Unos listos/servidos, otros en proceso${tableNumberMessage}`;
            icon = <AlertCircle className="mr-2 h-4 w-4 text-orange-500" />;
            badgeClass = 'border-orange-500 text-orange-600 bg-orange-100';
          } else { 
            message = `Pedido(s) en Cocina - Procesando${tableNumberMessage}`;
            icon = <ChefHat className="mr-2 h-4 w-4 animate-spin" />;
            badgeClass = 'border-blue-500 text-blue-600 bg-blue-100';
          }
          break;
      }
    } else {
        return null; 
    }
    return (
      <Badge variant={variant} className={`mb-2 w-full justify-center py-2 text-sm ${badgeClass}`}>
        {icon} {message}
      </Badge>
    );
  };

  const totalCartCost = useMemo(() => {
    return currentCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [currentCartItems]);
  
  const totalStagedCost = useMemo(() => {
    return stagedOrderForClient ? stagedOrderForClient.totalCost : 0;
  }, [stagedOrderForClient]);

  const totalActiveOrdersCost = useMemo(() => {
    return activeKitchenOrders.reduce((sum, order) => sum + order.totalCost, 0);
  }, [activeKitchenOrders]);

  const grandTotalCost = totalCartCost + totalStagedCost + totalActiveOrdersCost;

  const getOrderStatusBadge = (status: KDSOrderStatus) => {
    switch (status) {
      case 'pending': return <Badge variant="default" className="capitalize text-xs bg-yellow-100 text-yellow-600 border-yellow-500">Pendiente</Badge>;
      case 'preparing': return <Badge variant="secondary" className="capitalize text-xs bg-blue-100 text-blue-600 border-blue-500">En Preparación</Badge>;
      case 'ready': return <Badge variant="outline" className="capitalize text-xs bg-green-100 text-green-600 border-green-500">Listo</Badge>;
      case 'served': return <Badge variant="outline" className="capitalize text-xs bg-slate-100 text-slate-600 border-slate-500">Servido</Badge>;
      default: return <Badge className="capitalize text-xs">{status}</Badge>;
    }
  };

  const sendCartButtonText = 
    (activeKitchenOrders.length === 0 && !stagedOrderForClient)
      ? "Enviar Carrito a Cocina (Generar QR)"
      : "Añadir y Enviar Nuevos Artículos a Cocina";
  
  const sendCartButtonIcon = 
    (activeKitchenOrders.length === 0 && !stagedOrderForClient)
      ? <QrCode className="mr-2 h-5 w-5" />
      : <Send className="mr-2 h-5 w-5" />;


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl text-primary">
          <ShoppingBag className="mr-2 h-6 w-6" />
          Tu Sesión de Pedidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(activeKitchenOrders.length > 0 || stagedOrderForClient) && (
          <div className="mb-4 text-center">
            {getKDSStatusMessageAndIcon()}
          </div>
        )}
        
        {(currentCartItems.length === 0 && !stagedOrderForClient && activeKitchenOrders.length === 0) ? (
          <p className="text-muted-foreground">Tu sesión está vacía. ¡Añade artículos del menú!</p>
        ) : (
          <ScrollArea className="h-[350px] pr-4"> 
            <ul className="space-y-4">
              {currentCartItems.length > 0 && (
                <>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Carrito Actual:</p>
                  {currentCartItems.map((item) => (
                    <li key={`cart-${item.id}`} className="flex justify-between items-center p-2 rounded-md bg-background hover:bg-muted/50">
                      <div>
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdateCartItemQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} aria-label={`Decrease quantity of ${item.name}`}>
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span className="w-5 text-center text-sm">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdateCartItemQuantity(item.id, item.quantity + 1)} aria-label={`Increase quantity of ${item.name}`}>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemoveCartItem(item.id)} aria-label={`Remove ${item.name} from order`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                  <Separator className="my-3" />
                </>
              )}

              {stagedOrderForClient && (
                 <>
                  <div className="p-3 border border-dashed border-primary rounded-md bg-primary/10">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-primary flex items-center">
                        <Hourglass className="mr-2 h-4 w-4 animate-pulse" />
                        Pedido #{stagedOrderForClient.id.slice(-6)} - Esperando Activación
                        </p>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-primary/80 hover:text-primary"
                            onClick={() => onShowExistingQR(stagedOrderForClient.id)}
                            aria-label={`Ver QR para pedido #${stagedOrderForClient.id.slice(-6)}`}
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive/80 hover:text-destructive"
                            onClick={onCancelStagedOrder}
                            aria-label={`Cancelar pedido #${stagedOrderForClient.id.slice(-6)}`}
                          >
                            <XCircle className="h-5 w-5" />
                          </Button>
                        </div>
                    </div>
                    <ul className="space-y-1">
                    {stagedOrderForClient.items.map(item => (
                      <li key={`staged-${item.id}-${stagedOrderForClient.id}`} className="flex justify-between items-center text-sm ml-2">
                        <p className="text-foreground">{item.name} <span className="text-muted-foreground text-xs">(x{item.quantity})</span></p>
                        <p className="text-muted-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                      </li>
                    ))}
                    </ul>
                    <p className="text-right text-sm font-semibold text-primary mt-1">Subtotal: ${stagedOrderForClient.totalCost.toFixed(2)}</p>
                  </div>
                  <Separator className="my-3" />
                 </>
              )}

              {activeKitchenOrders.length > 0 && (
                 <>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Pedidos Activos en Cocina/Servidos:</p>
                  {activeKitchenOrders.map(order => (
                    <div key={`active-${order.id}`} className="mb-3 p-3 border border-border rounded-md bg-card">
                       <div className="flex justify-between items-center mb-1">
                        <div className="flex flex-col">
                            <p className="text-xs font-medium text-foreground">Pedido #{order.id.slice(-6)}</p>
                            {order.tableNumber && (
                                <p className="text-xs text-primary flex items-center">
                                    <Ticket size={14} className="mr-1"/> Mesa: {order.tableNumber}
                                </p>
                            )}
                        </div>
                        {getOrderStatusBadge(order.status)}
                       </div>
                      <ul className="space-y-1">
                      {order.items.map(item => (
                        <li key={`active-item-${item.id}-${order.id}`} className="flex justify-between items-center text-sm ml-2">
                          <p className="text-foreground">{item.name} <span className="text-muted-foreground text-xs">(x{item.quantity})</span></p>
                          <p className="text-muted-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                        </li>
                      ))}
                      </ul>
                      <p className="text-right text-sm font-semibold text-foreground mt-1">Subtotal: ${order.totalCost.toFixed(2)}</p>
                    </div>
                  ))}
                 </>
              )}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
      {(currentCartItems.length > 0 || stagedOrderForClient || activeKitchenOrders.length > 0) && (
        <CardFooter className="flex-col items-stretch space-y-3 pt-3">
          <Separator />
          <div className="flex justify-between items-center text-xl font-bold">
            <span className="text-foreground">Total General:</span>
            <span className="text-primary">${grandTotalCost.toFixed(2)}</span>
          </div>
          
          {isAnyKDSOrderServed && (
            <Button onClick={onPayment} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
              <CreditCard className="mr-2 h-5 w-5" /> Pagar Todos los Pedidos de la Sesión
            </Button>
          )}
          
          {currentCartItems.length > 0 && (
            <Button onClick={onSendCartToKitchen} size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!!stagedOrderForClient}>
              {sendCartButtonIcon} {sendCartButtonText}
            </Button>
          )}
          
          {currentCartItems.length === 0 && stagedOrderForClient && !isAnyKDSOrderServed && (
             <Button size="lg" className="w-full bg-muted text-muted-foreground cursor-not-allowed" disabled>
              <Info className="mr-2 h-5 w-5" /> Esperando activación del pedido anterior...
            </Button>
          )}

          {activeKitchenOrders.length > 0 && !isAnyKDSOrderServed && currentCartItems.length === 0 && !stagedOrderForClient && (
             <Button size="lg" className="w-full bg-muted text-muted-foreground cursor-not-allowed" disabled>
              <Hourglass className="mr-2 h-5 w-5 animate-spin" /> Pedido(s) en Cocina en Progreso...
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
