export const certificateTemplate = `
<!DOCTYPE html>
<html lang="am">
<head>
    <meta charset="UTF-8">
    <title>Certificate</title>
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
        body {
            margin: 0;
            padding: 0;
            width: 297mm;
            height: 210mm;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: white;
            font-family: 'AmharicFont', Arial, sans-serif;
            position: relative;
        }
        .cert-container {
            width: 280mm;
            height: 193mm;
            border: 10px double #b8860b;
            padding: 10px;
            position: relative;
            background-color: white;
            z-index: 1;
        }
        .cert-inner {
            border: 2px solid #b8860b;
            width: 100%;
            height: 100%;
            position: relative;
            padding: 40px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            height: 500px;
            opacity: 0.05;
            background-image: url('{{logoBase64}}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            z-index: -1;
        }

        .header {
            text-align: center;
            color: #4b3d14;
            margin-bottom: 20px;
        }
        .header img {
            width: 60px;
            height: auto;
            margin-bottom: 10px;
        }
        .header h1 {
            margin: 5px 0;
            font-size: 22px;
            font-weight: bold;
        }
        .header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: normal;
        }

        .cert-titles {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            margin-bottom: 30px;
        }
        .cert-titles h3 {
            font-size: 20px;
            color: #8b6508;
            margin: 0;
            width: 45%;
            text-align: center;
            line-height: 1.4;
        }

        .body-content {
            display: flex;
            justify-content: space-between;
            flex-grow: 1;
            font-size: 14px;
            line-height: 2.2;
            color: #333;
        }
        .col {
            width: 46%;
            text-align: justify;
        }
        
        .fill-blank {
            display: inline-block;
            border-bottom: 1px solid #333;
            min-width: 150px;
            text-align: center;
            padding: 0 5px;
            font-weight: bold;
            color: #000;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            font-size: 13px;
            color: #333;
        }
        .sig-col {
            width: 45%;
            display: flex;
            justify-content: space-between;
        }
        .sig-box {
            text-align: center;
            width: 45%;
        }
        .sig-line {
            border-bottom: 1px solid #333;
            margin-bottom: 5px;
            height: 30px;
        }

        .footer {
            margin-top: auto;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #555;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .qr-code {
            position: absolute;
            bottom: 30px;
            right: 30px;
            width: 80px;
            height: 80px;
        }
    </style>
</head>
<body>
    <div class="cert-container">
        <div class="cert-inner">
            <div class="watermark"></div>
            
            <div class="header">
                {{#if logoBase64}}
                    <img src="{{logoBase64}}" alt="Logo" />
                {{/if}}
                <h1>የኢትዮጵያ ወንጌል አማኞች አብያተ ክርስቲያናት ካውንስል</h1>
                <h2>Ethiopian Council of Gospel believers' Churches</h2>
            </div>

            <div class="cert-titles">
                <h3>የምዝገባ የምስክር<br/>ወረቀት</h3>
                <h3>CERTIFICATE OF<br/>REGISTRATION</h3>
            </div>

            <div class="body-content">
                <div class="col">
                    በኢትዮጵያ ወንጌል አማኞች አብያተ ክርስቲያናት ካውንስል አባላት ሕጋዊ ሰውነት ለመስጠት በወጣው አዋጅ ቁጥር 1208/2012 መሠረት ይህ የሕጋዊ ሰውነት ማረጋገጫ የምስክር ወረቀት ለ 
                    <span class="fill-blank">{{member.name}}</span> ተሰጥቷል።
                    <br/><br/>
                    በመዝገብ ቁጥር <span class="fill-blank">{{member.certificateNo}}</span> 
                    ዛሬ <span class="fill-blank">{{issueDateAmh}}</span> ቀን 
                    <span class="fill-blank">{{issueYearAmh}}</span> ዓ.ም ተሰጥቷል።
                </div>
                <div class="col">
                    This certificate is conferred to <span class="fill-blank">{{member.nameEn}}</span> 
                    on <span class="fill-blank">{{issueDayEng}}</span> date 
                    <span class="fill-blank">{{issueMonthYearEng}}</span> year, with registration No. 
                    <span class="fill-blank">{{member.certificateNo}}</span> to certify its personality in accordance with the proclamation No 1208/2020 enacted to provide legal personality to the Ethiopian Council of Gospel Believers' Churches and its members.
                </div>
            </div>

            <div class="signatures">
                <div class="sig-col">
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        የካውንስሉ ፕሬዝዳንት
                    </div>
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        የካውንስሉ ጠቅላይ ፀሐፊ
                    </div>
                </div>
                <div class="sig-col">
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        EGBCC President
                    </div>
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        EGBCC General Secretary
                    </div>
                </div>
            </div>

            <div class="footer">
                <div>&#9742; +251-116-662044</div>
                <div>E-Mail-info@ecgbc.org</div>
                <div>www.ecgbc.org</div>
            </div>

            {{#if qrCodeBase64}}
                <img src="{{qrCodeBase64}}" class="qr-code" alt="QR Code" />
            {{/if}}
        </div>
    </div>
</body>
</html>
`;
