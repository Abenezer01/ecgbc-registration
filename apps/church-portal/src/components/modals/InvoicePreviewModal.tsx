"use client";

import React, { useState, useRef } from "react";
import { Modal, ModalFooter, Button } from "@/components/ui";
import { FileDown, Loader2 } from "lucide-react";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { formatDate, formatCurrency } from "@/lib/formatters";

interface InvoicePreviewModalProps {
  open: boolean;
  onClose: () => void;
  report: any;
  churchProfile: any;
}

export function InvoicePreviewModal({ open, onClose, report, churchProfile }: InvoicePreviewModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleDownload = async () => {
    if (!report.reportingFee) {
      setError("No reporting fee found for this report");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await generateInvoicePDF(report, churchProfile);
    } catch (err) {
      console.error("Error generating invoice:", err);
      setError("Failed to generate invoice. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePreviewContent = (): string => {
    if (!report || !report.reportingFee) return "";

    // Modern HTML preview for invoice with shadcn-inspired styling
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 32px; max-width: 800px; margin: 0 auto; background: #ffffff; color: #09090b;">
        
        <!-- Header -->
        <div style="border-bottom: 2px solid #e4e4e7; padding-bottom: 24px; margin-bottom: 32px;">
          <h1 style="color: #18181b; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px;">INVOICE</h1>
          <div style="display: flex; gap: 24px; margin-top: 16px;">
            <div>
              <p style="color: #71717a; font-size: 13px; margin: 0; font-weight: 500;">Invoice Number</p>
              <p style="color: #18181b; font-size: 14px; margin: 4px 0 0 0; font-weight: 600;">INV-${report.reportingFee.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <p style="color: #71717a; font-size: 13px; margin: 0; font-weight: 500;">Date Issued</p>
              <p style="color: #18181b; font-size: 14px; margin: 4px 0 0 0; font-weight: 600;">${formatDate(report.createdAt || new Date(), "medium")}</p>
            </div>
          </div>
        </div>
        
        <!-- Two-column layout -->
        <div style="display: flex; justify-content: space-between; gap: 48px; margin-bottom: 40px;">
          <!-- From -->
          <div style="flex: 1;">
            <p style="color: #71717a; font-size: 12px; margin: 0 0 12px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">From</p>
            <h3 style="color: #18181b; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">Ethiopian Christian Gospel Believers Council</h3>
            <p style="color: #52525b; font-size: 14px; margin: 4px 0; line-height: 1.5;">Addis Ababa, Ethiopia</p>
            <p style="color: #52525b; font-size: 14px; margin: 4px 0; line-height: 1.5;">info@ecgbc.org</p>
          </div>
          
          <!-- To -->
          <div style="flex: 1;">
            <p style="color: #71717a; font-size: 12px; margin: 0 0 12px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Bill To</p>
            <h3 style="color: #18181b; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">${churchProfile?.name || "Church Name"}</h3>
            ${churchProfile?.email ? `<p style="color: #52525b; font-size: 14px; margin: 4px 0; line-height: 1.5;">${churchProfile.email}</p>` : ''}
            ${churchProfile?.region ? `<p style="color: #52525b; font-size: 14px; margin: 4px 0; line-height: 1.5;">Region: ${churchProfile.region}</p>` : ''}
          </div>
        </div>

        <!-- Table -->
        <div style="margin-bottom: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #e4e4e7;">
                <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
                <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Details</th>
                <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Unit Price</th>
                <th style="padding: 12px 16px; text-align: right; font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f4f4f5;">
                <td style="padding: 16px; font-size: 14px; color: #18181b; font-weight: 500;">Annual Reporting Fee</td>
                <td style="padding: 16px; font-size: 14px; color: #52525b;">Year ${report.year}</td>
                <td style="padding: 16px; font-size: 14px; color: #52525b;">1</td>
                <td style="padding: 16px; font-size: 14px; color: #52525b; text-align: right;">${formatCurrency(report.reportingFee.amount, report.reportingFee.currency)}</td>
                <td style="padding: 16px; font-size: 14px; color: #18181b; font-weight: 600; text-align: right;">${formatCurrency(report.reportingFee.amount, report.reportingFee.currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Total Section -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
          <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px 24px; min-width: 200px;">
            <p style="color: #71717a; font-size: 13px; margin: 0 0 8px 0; font-weight: 500;">Total Due</p>
            <p style="color: #18181b; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">${formatCurrency(report.reportingFee.amount, report.reportingFee.currency)}</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px; background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 0 8px 8px 0;">
          <p style="color: #166534; font-size: 14px; margin: 0; line-height: 1.6; font-weight: 500;">
            Please complete your payment at the designated bank accounts and upload your CRV.
          </p>
        </div>
      </div>
    `;
  };

  return (
    <Modal open={open} onClose={onClose} title="Invoice Preview" size="xl">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="border border-neutral-200 rounded-lg overflow-hidden" style={{ height: "500px" }}>
          <iframe
            ref={iframeRef}
            title="Invoice Preview"
            className="w-full h-full"
            srcDoc={generatePreviewContent()}
            sandbox="allow-same-origin"
          />
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
