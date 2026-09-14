import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../../config/db.config';
import { DESTINANTIONS } from '../../config/multer.config';
import { v4 as uuidv4 } from 'uuid';
import { letterTemplate } from '../templates/letter.template';
import { getEthiopianDate } from '../helpers/ethiopian-date.helper';

export interface CertificateLetterOptions {
  churchType?: 'new' | 'existing';
  refNo?: string;
  applicationDate?: string;
  issuedDate?: string;
  subject?: string;
  recipientName?: string;
  recipientAddress?: string;
  bylawPageCount?: number | string;
  ccPeaceSecurity?: string;
  dateAmh?: string;
  dateEng?: string;
}

const ETHIOPIAN_MONTHS = [
  'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];

export class CertificateLetterService {
  static async generateLetter(
    memberId: string,
    options: CertificateLetterOptions = {},
    previewOnly: boolean = false
  ): Promise<any> {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { councilFellowship: true, region: true },
    });

    if (!member) {
      throw new Error(`Member with ID ${memberId} not found.`);
    }

    return this.generateLetterForMember(member, options, previewOnly);
  }

  static async generateLetterForMember(
    member: any,
    options: CertificateLetterOptions = {},
    previewOnly: boolean = false
  ): Promise<any> {
    let browser = null;
    try {

      // 1. Assets Paths
      const fontPath = path.join(__dirname, '../../../../public/fonts/AmharicFont.ttf');
      const logoPath = path.join(__dirname, '../../../../public/images/logo.png');

      // Load Font as Base64
      let base64Font = '';
      try {
        const fontBytes = await fs.readFile(fontPath);
        base64Font = fontBytes.toString('base64');
      } catch (err) {
        console.warn(`Font not found at ${fontPath}. Proceeding without custom font.`);
      }

      // Load Logo as Base64 Data URL
      let logoBase64 = '';
      try {
        const logoBytes = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${logoBytes.toString('base64')}`;
      } catch (err) {
        console.warn(`Local logo not found at ${logoPath}. Using fallback Cloudinary URL.`);
        logoBase64 = 'https://res.cloudinary.com/duijvdn0m/image/upload/v1766689161/logo_wzaui5.png';
      }

      // 2. Generate QR Code
      const baseUrl = process.env.CHURCH_PORTAL_URL || 'https://mychurch.ecgbc.org';
      const verificationUrl = `${baseUrl}/verify/${member.certificateNo}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        margin: 1,
        color: { dark: '#1e3a5f', light: '#FFFFFF' }
      });

      // 3. Determine Church Type (new vs existing)
      const isNewChurch = options.churchType ? options.churchType === 'new' : true;

      // 4. Calculate Ethiopian & Gregorian Dates
      const now = new Date();
      const nowEth = getEthiopianDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
      const defaultDateAmh = `${nowEth.ethiopianDay}/${nowEth.ethiopianMonth}/${nowEth.ethiopianYear}`;
      const defaultDateEng = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      // Calculate Issue Date in Ethiopian
      const certDate = member.certificateIssuedDate ? new Date(member.certificateIssuedDate) : now;
      const certEth = getEthiopianDate(certDate.getFullYear(), certDate.getMonth() + 1, certDate.getDate());
      const certMonthName = ETHIOPIAN_MONTHS[certEth.ethiopianMonth - 1] || 'ነሐሴ';
      const defaultIssuedDateAmh = `${certMonthName} ${String(certEth.ethiopianDay).padStart(2, '0')} ቀን ${certEth.ethiopianYear}`;

      // Calculate Application Date in Ethiopian (fallback to 2 months prior or registration/created date)
      const createdDate = member.createdAt ? new Date(member.createdAt) : now;
      const createdEth = getEthiopianDate(createdDate.getFullYear(), createdDate.getMonth() + 1, createdDate.getDate());
      const defaultAppDate = `${createdEth.ethiopianDay}/${createdEth.ethiopianMonth}/${createdEth.ethiopianYear}`;

      // Ref No default
      const defaultRefNo = `ኢወአክካ/ደብ/${member.certificateNo}/${String(nowEth.ethiopianYear).slice(-2)}`;

      // CC Peace and Security
      const defaultPeace = member.region?.description
        ? `${member.region.description} ሰላምና ጸጥታ ቢሮ`
        : 'አዲስ አበባ ከተማ አስተዳደር ሰላምና ጸጥታ ቢሮ';

      // 5. Compile Handlebars template
      const template = Handlebars.compile(letterTemplate);
      const htmlContent = template({
        base64Font,
        logoBase64,
        qrCodeBase64: qrCodeDataUrl,
        isNewChurch,
        churchName: member.name,
        certificateNo: member.certificateNo,
        refNo: options.refNo || defaultRefNo,
        dateAmh: options.dateAmh || defaultDateAmh,
        dateEng: options.dateEng || defaultDateEng,
        recipientName: options.recipientName || member.name,
        recipientAddress: options.recipientAddress || `${member.city || 'አዲስ አበባ'}፤`,
        subject: options.subject || (isNewChurch ? 'የምዝገባ ሰርተፍኬት ስለመስጠት' : 'ሰርተፍኬት ስለመስጠት'),
        applicationDate: options.applicationDate || defaultAppDate,
        issuedDate: options.issuedDate || defaultIssuedDateAmh,
        bylawPageCount: options.bylawPageCount || 21,
        ccPeaceSecurity: options.ccPeaceSecurity || defaultPeace,
      });

      // 6. Launch Puppeteer with system/executable detection
      let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      if (!executablePath) {
        const potentialPaths = [
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/google-chrome',
        ];
        for (const p of potentialPaths) {
          try {
            await fs.access(p);
            executablePath = p;
            break;
          } catch {}
        }
      }

      browser = await puppeteer.launch({
        headless: true,
        executablePath: executablePath || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF (A4 Portrait)
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '20mm', bottom: '15mm', left: '20mm' },
      });

      await browser.close();
      browser = null;

      if (previewOnly) {
        return pdfBytes;
      }

      // 7. Save to disk
      const fileName = `Letter_of_Certification_${member.certificateNo}_${uuidv4()}.pdf`;
      const saveDir = path.join(__dirname, '../../config', DESTINANTIONS.FILE.FILE);
      await fs.mkdir(saveDir, { recursive: true });
      await fs.writeFile(path.join(saveDir, fileName), pdfBytes);

      // 8. Save to DB
      const category = await prisma.dataLookup.findFirst({
        where: { value: 'CERTIFICATE_AND_LETTER', category: 'FILE_TYPE' },
      });

      const newFile = await (prisma as any).file.create({
        data: {
          memberId: member.id,
          councilFellowshipId: member.councilFellowshipId,
          fileName: fileName,
          file: fileName,
          categoryId: category?.id || null,
        },
      });

      return newFile;
    } catch (error: any) {
      if (browser) {
        await browser.close().catch(() => {});
      }
      console.warn('Puppeteer failed for Letter. Falling back to pdf-lib...', error.message);
      return this.generateWithPdfLibFallback(member, options, previewOnly);
    }
  }

  private static async generateWithPdfLibFallback(
    member: any,
    options: CertificateLetterOptions,
    previewOnly: boolean
  ): Promise<any> {
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    const fontkit = (await import('@pdf-lib/fontkit')).default;

    const fontPath = path.join(__dirname, '../../../../public/fonts/AmharicFont.ttf');
    const logoPath = path.join(__dirname, '../../../../public/images/logo.png');

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fontBytes = await fs.readFile(fontPath);
    const customFont = await pdfDoc.embedFont(fontBytes);
    const englishFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const englishFontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Portrait
    const { width, height } = page.getSize();

    // Embed logo
    try {
      const logoBytes = await fs.readFile(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      page.drawImage(logoImage, {
        x: (width - 60) / 2,
        y: height - 85,
        width: 60,
        height: 60,
      });
    } catch {}

    const darkBlueColor = rgb(0.118, 0.227, 0.373); // #1e3a5f
    const goldColor = rgb(0.773, 0.608, 0.153); // #c59b27
    const blackColor = rgb(0.07, 0.09, 0.15); // #111827
    const grayColor = rgb(0.3, 0.35, 0.4);

    const drawCenteredText = (text: string, y: number, size: number, font: any, color: any) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
    };

    // Header Titles
    drawCenteredText("የኢትዮጵያ ወንጌል አማኞች አብያተ ክርስቲያናት ካውንስል", height - 108, 17, customFont, darkBlueColor);
    drawCenteredText("Ethiopian Council of Gospel Believers' Churches", height - 124, 11, englishFontBold, goldColor);

    // Divider
    page.drawLine({ start: { x: 50, y: height - 134 }, end: { x: width - 50, y: height - 134 }, thickness: 2, color: darkBlueColor });
    page.drawLine({ start: { x: 50, y: height - 137 }, end: { x: width - 50, y: height - 137 }, thickness: 1, color: goldColor });

    // Dates & Ref
    const now = new Date();
    const nowEth = getEthiopianDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const defaultDateAmh = `${nowEth.ethiopianDay}/${nowEth.ethiopianMonth}/${nowEth.ethiopianYear}`;
    const defaultDateEng = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const certDate = member.certificateIssuedDate ? new Date(member.certificateIssuedDate) : now;
    const certEth = getEthiopianDate(certDate.getFullYear(), certDate.getMonth() + 1, certDate.getDate());
    const certMonthName = ETHIOPIAN_MONTHS[certEth.ethiopianMonth - 1] || 'ነሐሴ';
    const defaultIssuedDateAmh = `${certMonthName} ${String(certEth.ethiopianDay).padStart(2, '0')} ቀን ${certEth.ethiopianYear}`;
    const createdDate = member.createdAt ? new Date(member.createdAt) : now;
    const createdEth = getEthiopianDate(createdDate.getFullYear(), createdDate.getMonth() + 1, createdDate.getDate());
    const defaultAppDate = `${createdEth.ethiopianDay}/${createdEth.ethiopianMonth}/${createdEth.ethiopianYear}`;
    const defaultRefNo = `ኢወአክካ/ደብ/${member.certificateNo}/${String(nowEth.ethiopianYear).slice(-2)}`;
    const defaultPeace = member.region?.description
      ? `${member.region.description} ሰላምና ጸጥታ ቢሮ`
      : 'አዲስ አበባ ከተማ አስተዳደር ሰላምና ጸጥታ ቢሮ';

    const isNewChurch = options.churchType ? options.churchType === 'new' : true;
    const refNo = options.refNo || defaultRefNo;
    const dateAmh = options.dateAmh || defaultDateAmh;
    const dateEng = options.dateEng || defaultDateEng;
    const recipientName = options.recipientName || member.name;
    const recipientAddress = options.recipientAddress || `${member.city || 'አዲስ አበባ'}፤`;
    const subject = options.subject || (isNewChurch ? 'የምዝገባ ሰርተፍኬት ስለመስጠት' : 'ሰርተፍኬት ስለመስጠት');
    const applicationDate = options.applicationDate || defaultAppDate;
    const issuedDate = options.issuedDate || defaultIssuedDateAmh;
    const bylawPageCount = options.bylawPageCount || 21;
    const ccPeaceSecurity = options.ccPeaceSecurity || defaultPeace;

    // Meta row
    page.drawText(`ቁጥር / Ref. No: ${refNo}`, { x: 50, y: height - 158, size: 10, font: customFont, color: grayColor });
    page.drawText(`ቀን / Date: ${dateAmh} ዓ.ም (${dateEng})`, { x: width - 230, y: height - 158, size: 10, font: customFont, color: grayColor });

    // Recipient
    page.drawText(`ለ ${recipientName}`, { x: 50, y: height - 188, size: 12, font: customFont, color: blackColor });
    page.drawText(recipientAddress, { x: 50, y: height - 204, size: 11, font: customFont, color: grayColor });

    // Salutation
    page.drawText("በጌታችን እና በመድኃኒታችን በኢየሱስ ክርስቶስ ስም ሰላምታችንን እናቀርባለን!!", { x: 50, y: height - 228, size: 11, font: customFont, color: darkBlueColor });

    // Subject
    const subjectText = `ጉዳዩ፡- ${subject}፤`;
    page.drawText(subjectText, { x: 50, y: height - 250, size: 11.5, font: customFont, color: blackColor });
    page.drawLine({ start: { x: 50, y: height - 253 }, end: { x: 50 + customFont.widthOfTextAtSize(subjectText, 11.5), y: height - 253 }, thickness: 1, color: blackColor });

    // Body Paragraphs helper for word wrapping
    let currentY = height - 280;
    const maxWidth = width - 100;

    const drawWrappedParagraph = (text: string, indent: boolean = true) => {
      const words = text.split(' ');
      let line = indent ? '    ' : '';
      for (const word of words) {
        const testLine = line + (line.length > 4 || (!indent && line.length > 0) ? ' ' : '') + word;
        const testWidth = customFont.widthOfTextAtSize(testLine, 11);
        if (testWidth > maxWidth) {
          page.drawText(line, { x: 50, y: currentY, size: 11, font: customFont, color: blackColor });
          currentY -= 17;
          line = word;
        } else {
          line = testLine;
        }
      }
      if (line.trim().length > 0) {
        page.drawText(line, { x: 50, y: currentY, size: 11, font: customFont, color: blackColor });
        currentY -= 25; // paragraph spacing
      }
    };

    if (isNewChurch) {
      drawWrappedParagraph(`${member.name} በሃይማኖት ተቋምነት ለመመዝገብ አስፈላጊውን መስፈርት በማሟላት በቀን ${applicationDate} ዓ.ም በተጻፈ ደብዳቤ ሕጋዊ ሰውነት እንዲሰጣችሁ መጠየቃችሁ ይታወሳል፡፡`);
      drawWrappedParagraph(`በመሆኑም ተቋሙ ሕገ መንግስቱንና ሌሎች ተፈጻሚነት ያላቸውን የሃገሪቱን ሕጎች በማክበር እንዲንቀሳቀስ እያሳሰብን የኢትዮጵያ ወንጌል አማኞች አብያተ ክርስቲያናት ካውንስል በአዋጅ ቁጥር 1208/2012 በተሰጠው ሥልጣን መሠረት አስፈላጊውን የምዝገባ መስፈርቶች ያሟላ በመሆኑ ከ${issuedDate} ዓ.ም ጀምሮ በምዝገባ ሰርተፍኬት ቁጥር ${member.certificateNo} የሕጋዊ ሰውነት ማረጋገጫ ምስክር ወረቀት ተሰጥቶታል፡፡`);
      drawWrappedParagraph(`በተጨማሪም የተቋሙ መሥራች ጉባኤ ያጸደቀውን ${bylawPageCount} ገጽ የመተዳደሪያ ደንብ የካውንስሉ ማኅተም ተደርጎበት ከዚህ ደብዳቤ ጋር አባሪ በማድረግ የተሰጠ ስለሆነ የሃይማኖት ተቋሙ ሥራዎች ማከናወንና መፈጸም ያለባቸው ይህን የመተዳደሪያ ደንብ መሠረት በማድረግ መሆኑን እየገለጽን፤ የሃይማኖት ተቋሙ ለጠቅላላ ጉባኤ አቅርቦ ያጸደቁትን ዓመታዊ የሥራ ክንውንና የኦዲት ሪፖርት እንዲሁም የቀጣይ በጀት ዓመት የድርጊትና የፋይናንስ እቅድ በመተዳደሪያ ደንባችሁ በተቀመጠው የበጀት ዘመን አቆጣጠር መሠረት በየዓመቱ ለካውንስሉ ማቅረብ ያለባችሁ መሆኑን እየገለጽን ይህ ደብዳቤ ለሚመለከታቸው ለመንግሥት አካላት በግልባጭ ተመዝግቦላቸዋል፡፡`);
    } else {
      drawWrappedParagraph(`${member.name} የካውንስሉ አባል ሆኖ ለመመዝገብ አስፈላጊውን መስፈርት በማሟላት በቀን ${applicationDate} ዓ.ም በተጻፈ ደብዳቤ መጠየቃችሁ ይታወሳል፡፡`);
      drawWrappedParagraph(`በመሆኑም ተቋሙ ሕገ መንግስቱንና ሌሎች ተፈጻሚነት ያላቸውን የሃገሪቱን ሕጎች በማክበር እንዲንቀሳቀስ እያሳሰብን የኢትዮጵያ ወንጌል አማኞች አብያተ ክርስያናት ካውንስል በአዋጅ ቁጥር 1208/2012 በተሰጠው ሥልጣን መሠረት አስፈላጊውን የመሥራች አባልነት መስፈርቶች ያሟላ በመሆኑ ከ${issuedDate} ዓ.ም ጀምሮ በሰርተፍኬት ቁጥር ${member.certificateNo} ተመዝግቦ ይህ የምስክር ወረቀት ተሰጥቶታል፡፡`);
      drawWrappedParagraph(`በተጨማሪም የተቋሙን መተዳደሪያ ደንብ መሠረት በማድረግ ሥራዎችን ማከናወንና መፈጸም ያለባችሁ መሆኑን እየገለጽን፤ የሃይማኖት ተቋሙ ለጠቅላላ ጉባኤ አቅርቦ ያጸደቀውን ዓመታዊ የሥራ ክንውንና የኦዲት ሪፖርት እንዲሁም የቀጣይ በጀት ዓመት የድርጊትና የፋይናንስ እቅድ በመተዳደሪያ ደንባችሁ በተቀመጠው የበጀት ዘመን አቆጣጠር መሠረት በየዓመቱ ለካውንስሉ ማቅረብ ያለባችሁ መሆኑን እየገለጽን ይህ ደብዳቤ ለሚመለከታቸው ለመንግሥት አካላት በግልባጭ ተመዝግቦላቸዋል፡፡`);
    }

    // Closing
    currentY -= 10;
    page.drawText("ከመንፈሳዊ ሰላምታ ጋር", { x: width - 220, y: currentY, size: 11, font: customFont, color: blackColor });
    page.drawLine({ start: { x: width - 240, y: currentY - 45 }, end: { x: width - 60, y: currentY - 45 }, thickness: 1, color: grayColor });
    page.drawText("ዋና ጸሐፊ / General Secretary", { x: width - 215, y: currentY - 60, size: 9.5, font: customFont, color: darkBlueColor });

    // CC Section
    page.drawText("ግልባጭ፡-", { x: 50, y: currentY - 35, size: 9.5, font: customFont, color: grayColor });
    page.drawText(`• ለ${ccPeaceSecurity}`, { x: 60, y: currentY - 50, size: 9, font: customFont, color: grayColor });
    page.drawText("• ለካውንስሉ ፋይናንስ ክፍል", { x: 60, y: currentY - 65, size: 9, font: customFont, color: grayColor });

    // Footer
    page.drawLine({ start: { x: 50, y: 70 }, end: { x: width - 50, y: 70 }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
    page.drawText("ስልክ: +251-116-662044  |  ኢሜይል: info@ecgbc.org  |  ድረ-ገጽ: www.ecgbc.org", { x: 50, y: 55, size: 8.5, font: customFont, color: grayColor });
    page.drawText("አድራሻ: አዲስ አበባ፣ ኢትዮጵያ  |  Addis Ababa, Ethiopia", { x: 50, y: 42, size: 8.5, font: customFont, color: grayColor });

    // QR Code
    try {
      const baseUrl = process.env.CHURCH_PORTAL_URL || 'https://mychurch.ecgbc.org';
      const verificationUrl = `${baseUrl}/verify/${member.certificateNo}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: '#1e3a5f', light: '#FFFFFF' } });
      const qrBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      const qrImage = await pdfDoc.embedPng(qrBytes);
      page.drawImage(qrImage, { x: width - 105, y: 20, width: 55, height: 55 });
    } catch {}

    const pdfBytes = await pdfDoc.save();

    if (previewOnly) {
      return Buffer.from(pdfBytes);
    }

    const fileName = `Letter_of_Certification_${member.certificateNo}_${uuidv4()}.pdf`;
    const saveDir = path.join(__dirname, '../../config', DESTINANTIONS.FILE.FILE);
    await fs.mkdir(saveDir, { recursive: true });
    await fs.writeFile(path.join(saveDir, fileName), pdfBytes);

    const category = await prisma.dataLookup.findFirst({
      where: { value: 'CERTIFICATE_AND_LETTER', category: 'FILE_TYPE' },
    });

    const newFile = await (prisma as any).file.create({
      data: {
        memberId: member.id,
        councilFellowshipId: member.councilFellowshipId,
        fileName: fileName,
        file: fileName,
        categoryId: category?.id || null,
      },
    });

    return newFile;
  }
}
