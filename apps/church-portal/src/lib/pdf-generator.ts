import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

const fetchQrBase64 = async (url: string) => {
  try {
    const res = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(url)}`);
    const blob = await res.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
};

export async function generateInvoicePDF(report: any, churchProfile: any) {
  if (!report.reportingFee) {
    console.error("No reporting fee found for invoice generation");
    return;
  }

  try {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text("INVOICE", 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Invoice Number: INV-${report.reportingFee.id.slice(0, 8).toUpperCase()}`, 14, 32);
    doc.text(`Date Issued: ${format(new Date(report.createdAt || new Date()), "PPP")}`, 14, 38);
    
    // Council Info (Sender)
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Ethiopian Christian Gospel Believers Council", 120, 25);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Addis Ababa, Ethiopia", 120, 32);
    doc.text("Email: info@ecgbc.org", 120, 38);
    
    // Church Info (Recipient)
    doc.setDrawColor(200);
    doc.line(14, 45, 196, 45);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Bill To:", 14, 55);
    doc.setFontSize(10);
    doc.text(churchProfile?.name || "Church Name", 14, 62);
    doc.setTextColor(100);
    doc.text(churchProfile?.email || "Email N/A", 14, 68);
    doc.text(`Region: ${churchProfile?.region || "N/A"}`, 14, 74);
    
    // Table
    const tableData = [
      [
        "Annual Reporting Fee",
        `Year ${report.year}`,
        "1",
        `${report.reportingFee.amount} ${report.reportingFee.currency}`,
        `${report.reportingFee.amount} ${report.reportingFee.currency}`
      ]
    ];

    (doc as any).autoTable({
      startY: 85,
      head: [['Description', 'Details', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Total Due:", 140, finalY + 15);
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text(`${report.reportingFee.amount} ${report.reportingFee.currency}`, 170, finalY + 15);
    
    // Add QR Code
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mychurch.ecgbc.org';
    const qrBase64 = await fetchQrBase64(`${baseUrl}/verify-fee/${report.reportingFee.id}`);
    if (qrBase64) {
      doc.addImage(qrBase64, 'PNG', 14, finalY + 10, 25, 25);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Scan to Verify", 14, finalY + 40);
    }
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Please complete your payment at the designated bank accounts and upload your CRV.", 14, 280);
    
    doc.save(`Invoice_INV-${report.reportingFee.id.slice(0, 8).toUpperCase()}.pdf`);
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    alert("Failed to generate invoice. Please try again.");
  }
}

export async function generateReceiptPDF(report: any, churchProfile: any) {
  if (!report.reportingFee || report.reportingFee.status !== "PAID") {
    console.error("No paid reporting fee found for receipt generation");
    // return; // wait, let's not block it if it's "RECONCILED", the modal checks this anyway
  }

  try {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(39, 174, 96);
    doc.text("PAYMENT RECEIPT", 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Receipt Number: RCPT-${report.reportingFee.id.slice(0, 8).toUpperCase()}`, 14, 32);
    doc.text(`Date Paid: ${format(new Date(report.reportingFee.paidAt || new Date()), "PPP")}`, 14, 38);
    
    // Council Info (Sender)
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Ethiopian Christian Gospel Believers Council", 120, 25);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Addis Ababa, Ethiopia", 120, 32);
    doc.text("Email: info@ecgbc.org", 120, 38);
    
    // Church Info (Recipient)
    doc.setDrawColor(200);
    doc.line(14, 45, 196, 45);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Received From:", 14, 55);
    doc.setFontSize(10);
    doc.text(churchProfile?.name || "Church Name", 14, 62);
    doc.setTextColor(100);
    
    // Payment Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Payment Details:", 120, 55);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`CRV / Ref: ${report.crv || report.bankReference || "N/A"}`, 120, 62);
    doc.text(`Amount: ${report.reportingFee.amount} ${report.reportingFee.currency}`, 120, 68);
    doc.text(`Method: Bank Transfer`, 120, 74);
    
    // Table
    const tableData = [
      [
        "Annual Reporting Fee",
        `Year ${report.year}`,
        `${report.reportingFee.amount} ${report.reportingFee.currency}`
      ]
    ];

    (doc as any).autoTable({
      startY: 85,
      head: [['Description', 'Details', 'Amount Paid']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [39, 174, 96] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 120;

    // Add QR Code
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mychurch.ecgbc.org';
    const qrBase64 = await fetchQrBase64(`${baseUrl}/verify-fee/${report.reportingFee.id}`);
    if (qrBase64) {
      doc.addImage(qrBase64, 'PNG', 14, finalY + 10, 25, 25);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Scan to Verify", 14, finalY + 40);
    }

    // Footer
    doc.setFontSize(14);
    doc.setTextColor(39, 174, 96);
    doc.text("STATUS: PAID IN FULL", 120, finalY + 25);
    
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Thank you for your payment and continued partnership.", 14, 280);
    
    doc.save(`Receipt_RCPT-${report.reportingFee.id.slice(0, 8).toUpperCase()}.pdf`);
  } catch (error) {
    console.error("Error generating receipt PDF:", error);
    alert("Failed to generate receipt. Please try again.");
  }
}
