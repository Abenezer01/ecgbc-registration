#!/usr/bin/env python3
"""
Generate valid watermarked PDF documents for ECGBC Staging environment
"""

def generate_pdf(filepath, title, subtitle, document_type):
    # Minimal valid PDF 1.4 format with text and watermark
    content_stream = f"""BT
/F1 20 Tf
50 720 Td
({title}) Tj
ET
BT
/F1 12 Tf
50 690 Td
({subtitle}) Tj
ET
BT
/F1 10 Tf
50 660 Td
(Document Classification: ECGBC STAGING TEST ARTIFACT) Tj
50 645 Td
(Purpose: Security Audit & Penetration Testing) Tj
50 630 Td
(Status: Fully Decoupled Synthetic Document) Tj
ET
q
0.85 0.85 0.85 rg
0.85 0.85 0.85 RG
BT
/F1 36 Tf
0.7071 0.7071 -0.7071 0.7071 80 250 Tm
(INSA AUDIT - STAGING SAMPLE) Tj
ET
Q
BT
/F1 10 Tf
50 100 Td
(Notice: This sample replaces confidential production documents.) Tj
50 85 Td
(Original production document storage contains zero linkages to this container.) Tj
ET
"""
    stream_bytes = content_stream.encode('ascii')
    stream_len = len(stream_bytes)

    objects = []
    
    # Obj 1: Catalog
    objects.append("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    # Obj 2: Pages
    objects.append("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    # Obj 3: Page
    objects.append("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n")
    # Obj 4: Contents
    objects.append(f"4 0 obj\n<< /Length {stream_len} >>\nstream\n{content_stream}\nendstream\nendobj\n")
    # Obj 5: Font
    objects.append("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n")

    pdf_parts = ["%PDF-1.4\n"]
    offsets = []
    current_offset = len(pdf_parts[0].encode('ascii'))

    for obj in objects:
        offsets.append(current_offset)
        pdf_parts.append(obj)
        current_offset += len(obj.encode('ascii'))

    xref_offset = current_offset
    pdf_parts.append(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n")
    for off in offsets:
        pdf_parts.append(f"{off:010d} 00000 n \n")

    pdf_parts.append(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n")

    with open(filepath, "wb") as f:
        f.write("".join(pdf_parts).encode('ascii'))

if __name__ == "__main__":
    generate_pdf("sample-document.pdf", "ECGBC AUDIT TEST DOCUMENT", "Official Member Certificate & Verification Attachment", "DOCUMENT")
    generate_pdf("sample-report.pdf", "ECGBC AUDIT ANNUAL REPORT", "Annual Church Compliance & Financial Verification Report", "REPORT")
    print("Generated sample-document.pdf and sample-report.pdf successfully!")
