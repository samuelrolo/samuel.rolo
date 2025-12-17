const fs = require('fs');
const { Pass } = require('passkit-generator');

// CONFIGURAÇÃO
// Certifique-se de que tem os certificados na pasta 'keys' ou ajuste os caminhos
const SIGNER_CERT = './keys/signerCert.pem';
const SIGNER_KEY = './keys/signerKey.pem';
const WWDR_CERT = './keys/wwdr.pem';

async function generatePass() {
    try {
        console.log('A ler pass.json...');
        const passData = JSON.parse(fs.readFileSync('./pass.json', 'utf8'));

        const pass = new Pass({
            model: './pass.json', // Usa o pass.json como base
            certificates: {
                wwdr: fs.readFileSync(WWDR_CERT),
                signerCert: fs.readFileSync(SIGNER_CERT),
                signerKey: fs.readFileSync(SIGNER_KEY),
                signerKeyPassphrase: 'password' // Coloque a password da chave se tiver, ou remova esta linha
            }
        });

        // Adicionar imagens se existirem
        const images = ['icon.png', 'icon@2x.png', 'logo.png', 'logo@2x.png', 'strip.png', 'strip@2x.png'];
        images.forEach(img => {
            if (fs.existsSync(img)) {
                pass.images.add(img, fs.readFileSync(img));
            }
        });

        console.log('A gerar .pkpass...');
        const buffer = await pass.generate();

        fs.writeFileSync('marlene-ruivo.pkpass', buffer);
        console.log('Sucesso! Cartão gerado em marlene-ruivo.pkpass');

    } catch (error) {
        console.error('Erro ao gerar cartão:', error);
        console.log('\nDICA: Verifique se criou a pasta "keys" e colocou lá os certificados.');
    }
}

generatePass();
