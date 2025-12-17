# Gerar Cartão Apple Wallet (Passbook)

Este diretório contém os ficheiros necessários para gerar um cartão digital (.pkpass) para a Apple Wallet.

## Pré-requisitos

1.  **Conta Apple Developer**: Necessária para criar os certificados.
2.  **Node.js**: Para correr o script de geração (opcional, mas recomendado).
3.  **Certificados**:
    *   `signerCert.pem`: O seu certificado de Pass Type ID.
    *   `signerKey.pem`: A sua chave privada.
    *   `wwdr.pem`: O certificado Apple Worldwide Developer Relations (WWDR).

## Passo 1: Obter Certificados e Identificadores

1.  Aceda ao [Apple Developer Portal](https://developer.apple.com/account/).
2.  Vá a **Certificates, Identifiers & Profiles**.
3.  **Identifiers**: Crie um novo Pass Type ID (ex: `pass.com.marleneruivo.card`).
    *   *Nota*: Atualize o campo `passTypeIdentifier` no ficheiro `pass.json` com este ID.
    *   Atualize também o `teamIdentifier` no `pass.json` com o seu Team ID (visível no canto superior direito do portal).
4.  **Certificates**: Crie um novo certificado para o Pass Type ID que acabou de criar.
    *   Faça download do certificado (`.cer`) e instale-o no Keychain Access (se estiver num Mac) ou exporte-o.
    *   Precisa de converter o certificado e a chave privada para formato PEM.

## Passo 2: Preparar Imagens

Coloque as seguintes imagens nesta pasta `wallet/`. Elas devem ser PNGs.

*   `icon.png` (29x29) & `icon@2x.png` (58x58) - Ícone pequeno (ex: logótipo simplificado).
*   `logo.png` (160x50) & `logo@2x.png` (320x100) - Logótipo que aparece no topo do cartão.
*   `strip.png` (375x98) & `strip@2x.png` (750x196) - Imagem de destaque (opcional, mas recomendada para cartões genéricos). Se não usar `strip`, o fundo será a cor sólida definida.

*Dica*: Pode usar ferramentas online para redimensionar o logótipo atual.

## Passo 3: Gerar o .pkpass

### Opção A: Usar o script Node.js (Recomendado)

1.  Instale as dependências (na raiz do projeto ou nesta pasta):
    ```bash
    npm install passkit-generator
    ```
2.  Edite o ficheiro `sign_pass.js` e verifique os caminhos para os seus certificados (`keys/signerCert.pem`, etc).
3.  Corra o script:
    ```bash
    node sign_pass.js
    ```
4.  O ficheiro `marlene-ruivo.pkpass` será gerado.

### Opção B: Manualmente (Avançado)

Se preferir não usar Node.js, pode zipar o conteúdo da pasta (incluindo o `manifest.json` e `signature` que teria de gerar com `openssl`). É complexo fazer manualmente, por isso o script é recomendado.

## Passo 4: Distribuir

*   Envie o ficheiro `.pkpass` por email para si mesmo e abra no iPhone.
*   Ou coloque o ficheiro no site e crie um link para download.
