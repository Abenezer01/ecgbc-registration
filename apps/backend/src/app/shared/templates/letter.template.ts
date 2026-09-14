export const letterTemplate = `
<!DOCTYPE html>
<html lang="am">
<head>
    <meta charset="UTF-8">
    <title>Letter of Certification</title>
    <style>
        @font-face {
            font-family: 'AmharicFont';
            src: url('data:font/ttf;base64,{{base64Font}}') format('truetype');
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        @page {
            size: A4 portrait;
            margin: 15mm 20mm 15mm 20mm;
        }
        body {
            margin: 0;
            padding: 0;
            background-color: white;
            font-family: 'AmharicFont', 'Times New Roman', Arial, sans-serif;
            color: #111827;
            line-height: 1.7;
            font-size: 13.5px;
            display: flex;
            flex-direction: column;
            min-height: 267mm;
            position: relative;
        }
        
        .letterhead {
            text-align: center;
            border-bottom: 2px solid #1e3a5f;
            padding-bottom: 12px;
            margin-bottom: 18px;
            position: relative;
        }
        .letterhead-accent {
            height: 3px;
            background: linear-gradient(90deg, #c59b27, #1e3a5f, #c59b27);
            margin-top: 2px;
            margin-bottom: 12px;
        }
        .logo-container {
            margin-bottom: 6px;
        }
        .logo {
            width: 75px;
            height: 75px;
            object-fit: contain;
        }
        .org-name-am {
            font-size: 19px;
            font-weight: bold;
            color: #1e3a5f;
            margin: 0;
            letter-spacing: 0.3px;
        }
        .org-name-en {
            font-size: 14px;
            font-weight: 600;
            color: #c59b27;
            margin: 2px 0 0 0;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        
        .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            font-size: 13px;
            color: #374151;
        }
        .meta-item {
            font-weight: 500;
        }
        .meta-val {
            font-weight: bold;
            color: #111827;
        }

        .recipient-block {
            margin-bottom: 16px;
            font-size: 14px;
        }
        .recipient-name {
            font-weight: bold;
            font-size: 15px;
            color: #111827;
        }
        .recipient-city {
            color: #4b5563;
        }

        .salutation {
            font-weight: bold;
            margin-bottom: 14px;
            font-size: 14px;
            color: #1e3a5f;
        }

        .subject {
            font-weight: bold;
            font-size: 14.5px;
            text-decoration: underline;
            margin-bottom: 18px;
            color: #111827;
        }

        .content-body {
            text-align: justify;
            text-justify: inter-word;
            flex: 1;
        }
        .content-body p {
            margin-top: 0;
            margin-bottom: 14px;
            text-indent: 35px;
            line-height: 1.8;
        }

        .closing-section {
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .signature-block {
            text-align: center;
            width: 240px;
        }
        .closing-phrase {
            font-weight: bold;
            margin-bottom: 45px;
            font-size: 14px;
        }
        .sig-line {
            border-top: 1px dashed #4b5563;
            padding-top: 6px;
            font-size: 13px;
            font-weight: bold;
            color: #1e3a5f;
        }

        .cc-section {
            margin-top: 20px;
            font-size: 12px;
            color: #4b5563;
            line-height: 1.5;
        }
        .cc-title {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 3px;
        }
        .cc-list {
            margin: 0;
            padding-left: 18px;
        }

        .footer {
            margin-top: auto;
            padding-top: 10px;
            border-top: 1.5px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #6b7280;
        }
        .footer-info {
            line-height: 1.5;
        }
        .qr-block {
            text-align: center;
        }
        .qr-code {
            width: 68px;
            height: 68px;
        }
        .qr-caption {
            font-size: 9px;
            color: #9ca3af;
            margin-top: 2px;
        }
    </style>
</head>
<body>
    <div class="letterhead">
        {{#if logoBase64}}
        <div class="logo-container">
            <img src="{{logoBase64}}" class="logo" alt="ECGBC Logo" />
        </div>
        {{/if}}
        <h1 class="org-name-am">የኢትዮጵያ ወንጌል አማኞች አብያተ ክርስቲያናት ካውንስል</h1>
        <h2 class="org-name-en">Ethiopian Council of Gospel Believers' Churches</h2>
    </div>
    <div class="letterhead-accent"></div>

    <div class="meta-row">
        <div class="meta-item">
            ቁጥር / Ref. No: <span class="meta-val">{{refNo}}</span>
        </div>
        <div class="meta-item">
            ቀን / Date: <span class="meta-val">{{dateAmh}} ዓ.ም ({{dateEng}})</span>
        </div>
    </div>

    <div class="recipient-block">
        <div>ለ <span class="recipient-name">{{recipientName}}</span></div>
        <div class="recipient-city">{{recipientAddress}}</div>
    </div>

    <div class="salutation">
        በጌታችን እና በመድኃኒታችን በኢየሱስ ክርስቶስ ስም ሰላምታችንን እናቀርባለን!!
    </div>

    <div class="subject">
        ጉዳዩ፡- {{subject}}፤
    </div>

    <div class="content-body">
        {{#if isNewChurch}}
        <p>
            <strong>{{churchName}}</strong> በሃይማኖት ተቋምነት ለመመዝገብ አስፈላጊውን መስፈርት በማሟላት በቀን <strong>{{applicationDate}} ዓ.ም</strong> በተጻፈ ደብዳቤ ሕጋዊ ሰውነት እንዲሰጣችሁ መጠየቃችሁ ይታወሳል፡፡
        </p>
        <p>
            በመሆኑም ተቋሙ ሕገ መንግስቱንና ሌሎች ተፈጻሚነት ያላቸውን የሃገሪቱን ሕጎች በማክበር እንዲንቀሳቀስ እያሳሰብን የኢትዮጵያ ወንጌል አማኞች አብያተ ክርስቲያናት ካውንስል በአዋጅ ቁጥር 1208/2012 በተሰጠው ሥልጣን መሠረት አስፈላጊውን የምዝገባ መስፈርቶች ያሟላ በመሆኑ ከ<strong>{{issuedDate}} ዓ.ም</strong> ጀምሮ በምዝገባ ሰርተፍኬት ቁጥር <strong>{{certificateNo}}</strong> የሕጋዊ ሰውነት ማረጋገጫ ምስክር ወረቀት ተሰጥቶታል፡፡
        </p>
        <p>
            በተጨማሪም የተቋሙ መሥራች ጉባኤ ያጸደቀውን <strong>{{bylawPageCount}}</strong> ገጽ የመተዳደሪያ ደንብ የካውንስሉ ማኅተም ተደርጎበት ከዚህ ደብዳቤ ጋር አባሪ በማድረግ የተሰጠ ስለሆነ የሃይማኖት ተቋሙ ሥራዎች ማከናወንና መፈጸም ያለባቸው ይህን የመተዳደሪያ ደንብ መሠረት በማድረግ መሆኑን እየገለጽን፤ የሃይማኖት ተቋሙ ለጠቅላላ ጉባኤ አቅርቦ ያጸደቁትን ዓመታዊ የሥራ ክንውንና የኦዲት ሪፖርት እንዲሁም የቀጣይ በጀት ዓመት የድርጊትና የፋይናንስ እቅድ በመተዳደሪያ ደንባችሁ በተቀመጠው የበጀት ዘመን አቆጣጠር መሠረት በየዓመቱ ለካውንስሉ ማቅረብ ያለባችሁ መሆኑን እየገለጽን ይህ ደብዳቤ ለሚመለከታቸው ለመንግሥት አካላት በግልባጭ ተመዝግቦላቸዋል፡፡
        </p>
        {{else}}
        <p>
            <strong>{{churchName}}</strong> የካውንስሉ አባል ሆኖ ለመመዝገብ አስፈላጊውን መስፈርት በማሟላት በቀን <strong>{{applicationDate}} ዓ.ም</strong> በተጻፈ ደብዳቤ መጠየቃችሁ ይታወሳል፡፡
        </p>
        <p>
            በመሆኑም ተቋሙ ሕገ መንግስቱንና ሌሎች ተፈጻሚነት ያላቸውን የሃገሪቱን ሕጎች በማክበር እንዲንቀሳቀስ እያሳሰብን የኢትዮጵያ ወንጌል አማኞች አብያተ ክርስያናት ካውንስል በአዋጅ ቁጥር 1208/2012 በተሰጠው ሥልጣን መሠረት አስፈላጊውን የመሥራች አባልነት መስፈርቶች ያሟላ በመሆኑ ከ<strong>{{issuedDate}} ዓ.ም</strong> ጀምሮ በሰርተፍኬት ቁጥር <strong>{{certificateNo}}</strong> ተመዝግቦ ይህ የምስክር ወረቀት ተሰጥቶታል፡፡
        </p>
        <p>
            በተጨማሪም የተቋሙን መተዳደሪያ ደንብ መሠረት በማድረግ ሥራዎችን ማከናወንና መፈጸም ያለባችሁ መሆኑን እየገለጽን፤ የሃይማኖት ተቋሙ ለጠቅላላ ጉባኤ አቅርቦ ያጸደቀውን ዓመታዊ የሥራ ክንውንና የኦዲት ሪፖርት እንዲሁም የቀጣይ በጀት ዓመት የድርጊትና የፋይናንስ እቅድ በመተዳደሪያ ደንባችሁ በተቀመጠው የበጀት ዘመን አቆጣጠር መሠረት በየዓመቱ ለካውንስሉ ማቅረብ ያለባችሁ መሆኑን እየገለጽን ይህ ደብዳቤ ለሚመለከታቸው ለመንግሥት አካላት በግልባጭ ተመዝግቦላቸዋል፡፡
        </p>
        {{/if}}
    </div>

    <div class="closing-section">
        <div class="cc-section">
            <div class="cc-title">ግልባጭ፡-</div>
            <ul class="cc-list">
                <li>ለ{{ccPeaceSecurity}}</li>
                <li>ባሉበት</li>
                <li>ለካውንስሉ ፋይናንስ ክፍል</li>
            </ul>
        </div>

        <div class="signature-block">
            <div class="closing-phrase">ከመንፈሳዊ ሰላምታ ጋር</div>
            <div class="sig-line">
                የኢትዮጵያ ወንጌል አማኞች አብያተ ክርስቲያናት ካውንስል<br/>
                ዋና ጸሐፊ / General Secretary
            </div>
        </div>
    </div>

    <div class="footer">
        <div class="footer-info">
            ስልክ: +251-116-662044 | ኢሜይል: info@ecgbc.org | ድረ-ገጽ: www.ecgbc.org<br/>
            አድራሻ: አዲስ አበባ፣ ኢትዮጵያ | Addis Ababa, Ethiopia
        </div>
        {{#if qrCodeBase64}}
        <div class="qr-block">
            <img src="{{qrCodeBase64}}" class="qr-code" alt="Verification QR" />
            <div class="qr-caption">ማረጋገጫ / Verify</div>
        </div>
        {{/if}}
    </div>
</body>
</html>
`;
