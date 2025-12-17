const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'Assets');
const photoPath = path.join(outputDir, 'Foto Marlene 1.png');
const vcardPath = path.join(outputDir, 'marlene-ruivo.vcf');

// Function to encode image to base64
function getPhotoBase64() {
    try {
        if (fs.existsSync(photoPath)) {
            const bitmap = fs.readFileSync(photoPath);
            return bitmap.toString('base64');
        }
    } catch (e) {
        console.error("Error reading photo:", e);
    }
    return null;
}

const photoBase64 = getPhotoBase64();

let vcardContent = `BEGIN:VCARD
VERSION:3.0
N:Ruivo;Marlene;;Drª;
FN:Drª Marlene Ruivo
ORG:Marlene Ruivo Nutrição
TITLE:Nutricionista
TEL;TYPE=CELL,VOICE:915089258
EMAIL;TYPE=WORK,INTERNET:marleneruivonutricao@gmail.com
URL:https://www.marleneruivo.pt
X-SOCIALPROFILE;type=instagram:https://www.instagram.com/nutri_fodmap_marleneruivo/
NOTE:Especialista em saúde intestinal, síndrome do intestino irritável e dieta FODMAP.
`;

if (photoBase64) {
    // Remove newlines from base64 string just in case
    const cleanBase64 = photoBase64.replace(/[\r\n]/g, '');
    vcardContent += `PHOTO;ENCODING=b;TYPE=PNG:${cleanBase64}\n`;
}

vcardContent += `END:VCARD`;

fs.writeFileSync(vcardPath, vcardContent);
console.log(`vCard created at: ${vcardPath}`);
