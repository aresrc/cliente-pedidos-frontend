
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink } from "lucide-react";

interface QRCodeDisplayProps {
  qrCodeDataUrl: string; // This is the URL for the QR image (e.g., from api.qrserver.com)
  orderId: string; 
}

export function QRCodeDisplay({ qrCodeDataUrl, orderId }: QRCodeDisplayProps) {
  const { toast } = useToast();

  // The actual activation URL is encoded within qrCodeDataUrl's 'data' param
  // For display and copy, we can show the simple orderId.
  // If needed, we could parse qrCodeDataUrl to extract the activation URL for a "Copy Link" button.

  const handleCopyToClipboard = (textToCopy: string, type: string) => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({
          title: `${type} Copiado`,
          description: `El ${type.toLowerCase()} ha sido copiado al portapapeles.`,
        });
      })
      .catch(err => {
        console.error(`Error al copiar ${type.toLowerCase()}: `, err);
        toast({
          title: "Error al Copiar",
          description: `No se pudo copiar el ${type.toLowerCase()}.`,
          variant: "destructive",
        });
      });
  };

  return (
    <DialogContent className="sm:max-w-md bg-background text-foreground">
      <DialogHeader>
        <DialogTitle className="text-2xl text-primary">Código QR de tu Pedido</DialogTitle>
        <DialogDescription className="text-muted-foreground">
          El personal del restaurante escaneará este código QR para enviar tu pedido a la cocina.
          También puedes mostrarles el ID de Pedido.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <img 
          src={qrCodeDataUrl} 
          alt="Order Activation QR Code" 
          width={250} 
          height={250}
          className="rounded-lg border-4 border-primary shadow-lg"
          data-ai-hint="qr code" 
        />
        <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">ID de Pedido (para referencia):</p>
            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
              <span className="text-lg font-mono text-accent">{orderId}</span>
              <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(orderId, "ID de Pedido")} aria-label="Copiar ID de pedido">
                <Copy className="h-5 w-5 text-primary" />
              </Button>
            </div>
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          Este QR contiene un enlace para que el personal active tu pedido.
        </p>
      </div>
    </DialogContent>
  );
}
