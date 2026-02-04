import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export function useExportPDF() {
  const utils = trpc.useUtils();

  const exportToPDF = async (
    elementId: string, 
    filename: string, 
    addWatermark: boolean = true,
    requireCredits: boolean = false
  ) => {
    try {
      // If premium export is requested, check credits first
      if (!addWatermark && requireCredits) {
        const hasCredits = await utils.payment.hasCredits.fetch();
        
        if (!hasCredits) {
          toast.error("Sem créditos disponíveis. Compre créditos para exportar sem marca de água.");
          // Redirect to checkout
          window.location.href = '/checkout';
          return false;
        }
      }

      toast.info("A gerar PDF...");
      
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Elemento não encontrado");
      }

      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // A4 dimensions in mm
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Add watermark if needed
      if (addWatermark) {
        pdf.setFontSize(40);
        pdf.setTextColor(200, 200, 200);
        pdf.setFont('helvetica', 'bold');
        
        // Rotate and add watermark
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        pdf.saveGraphicsState();
        
        // Center watermark
        pdf.text('SHARE2INSPIRE', pageWidth / 2, pageHeight / 2, {
          align: 'center',
          angle: 45
        });
        
        pdf.restoreGraphicsState();
      }

      pdf.save(filename);
      
      // If premium export was successful, deduct credit
      if (!addWatermark && requireCredits) {
        try {
          await utils.payment.deductCredit.fetch();
          toast.success("PDF gerado com sucesso! 1 crédito utilizado.");
        } catch (error) {
          console.error("Error deducting credit:", error);
          toast.warning("PDF gerado, mas houve um erro ao deduzir o crédito.");
        }
      } else {
        toast.success("PDF gerado com sucesso!");
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao gerar PDF");
      return false;
    }
  };

  return { exportToPDF };
}
