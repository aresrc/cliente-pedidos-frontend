
'use client';

import { useState } from 'react';
import type { ReceiptData } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Download, Mail, Printer, X } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface SalesReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData;
}

// Extend jsPDF with autoTable, if using TypeScript
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export function SalesReceiptModal({ isOpen, onClose, receiptData }: SalesReceiptModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const handleDownloadPdf = () => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const tableColumn = ["Item", "Qty", "Unit Price", "Total Price"];
    const tableRows: any[] = [];

    receiptData.items.forEach(item => {
      const itemData = [
        item.name,
        item.quantity,
        `$${item.unitPrice.toFixed(2)}`,
        `$${item.totalPrice.toFixed(2)}`
      ];
      tableRows.push(itemData);
    });

    doc.setFontSize(18);
    doc.text(receiptData.restaurantName || "MenuQuick Restaurant", 14, 22);
    doc.setFontSize(12);
    doc.text(receiptData.receiptTitle || "Boleta de Venta", 14, 30);
    doc.setFontSize(10);
    doc.text(`Fecha: ${receiptData.date}`, 14, 36);
    if (receiptData.tableNumber) {
      doc.text(`Mesa: ${receiptData.tableNumber}`, 14, 42);
    }
    doc.text(`Pedido(s) ID(s): ${receiptData.orderIds.join(', ')}`, 14, receiptData.tableNumber ? 48 : 42);

    doc.autoTable({
      startY: receiptData.tableNumber ? 54 : 48,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [55, 71, 79] }, // Dark grey for header
      foot: [[{content: 'Total General:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold'}}, {content: `$${receiptData.grandTotal.toFixed(2)}`, styles: {fontStyle: 'bold'}}]],
      footStyles: { fontStyle: 'bold', fontSize: 12, fillColor: [236, 239, 241] }, // Light grey for footer
    });
    
    doc.save(`boleta_menuquick_${receiptData.orderIds.join('_') || 'sesion'}.pdf`);
    toast({
      title: "PDF Descargado",
      description: "La boleta ha sido descargada como PDF.",
    });
  };

  const handleSendEmail = () => {
    if (email && /\S+@\S+\.\S+/.test(email)) { // Simple email validation
      // Here you would typically send the PDF/data to a backend to handle email sending
      toast({
        title: "Correo Enviado (Simulado)",
        description: `La boleta se ha enviado a ${email}. (Esta es una simulación, no se envió un correo real.)`,
      });
    } else {
      toast({
        title: "Correo Inválido",
        description: "Por favor, ingrese una dirección de correo electrónico válida.",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">{receiptData.receiptTitle || "Boleta de Venta"}</DialogTitle>
          <DialogDescription>
            Resumen de tu consumo en {receiptData.restaurantName || "MenuQuick Restaurant"}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 px-1">
          <div className="text-sm text-muted-foreground mb-2">
            <p>Fecha: {receiptData.date}</p>
            {receiptData.tableNumber && <p>Mesa: {receiptData.tableNumber}</p>}
            <p>ID(s) Pedido(s): {receiptData.orderIds.join(', ')}</p>
          </div>
          <Separator className="my-3" />
          <ScrollArea className="h-[250px] pr-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Item</th>
                  <th className="text-center py-2 font-semibold">Qty</th>
                  <th className="text-right py-2 font-semibold">P. Unit.</th>
                  <th className="text-right py-2 font-semibold">P. Total</th>
                </tr>
              </thead>
              <tbody>
                {receiptData.items.map((item, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-2">{item.name}</td>
                    <td className="text-center py-2">{item.quantity}</td>
                    <td className="text-right py-2">${item.unitPrice.toFixed(2)}</td>
                    <td className="text-right py-2">${item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
          <Separator className="my-3" />
          <div className="flex justify-end items-center mt-4">
            <p className="text-lg font-bold text-primary">Total General: ${receiptData.grandTotal.toFixed(2)}</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t border-border">
            <div className="w-full sm:w-auto flex flex-col gap-2 items-start">
                <label htmlFor="email-input" className="text-xs text-muted-foreground">Enviar boleta por correo (simulado):</label>
                <div className="flex w-full gap-2">
                    <Input 
                        id="email-input"
                        type="email" 
                        placeholder="tu@correo.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-grow"
                    />
                    <Button variant="outline" size="icon" onClick={handleSendEmail} aria-label="Enviar por correo">
                        <Mail className="h-4 w-4"/>
                    </Button>
                </div>
            </div>
            <div className="flex w-full sm:w-auto justify-end gap-2 mt-2 sm:mt-0">
                <Button variant="default" onClick={handleDownloadPdf} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Download className="mr-2 h-4 w-4" /> Descargar PDF
                </Button>
                <Button variant="secondary" onClick={onClose}>
                    <X className="mr-2 h-4 w-4" /> Cerrar y Finalizar
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
