/**
 * CV Parser Module
 * Handles file reading and text extraction from PDF, DOCX, and TXT files.
 */

const CVParser = {
    /**
     * Main entry point to parse a file
     * @param {File} file - The file object from input
     * @returns {Promise<string>} - The extracted text
     */
    parse: async function (file) {
        const fileType = file.name.split('.').pop().toLowerCase();

        try {
            switch (fileType) {
                case 'pdf':
                    return await this.parsePDF(file);
                case 'docx':
                    return await this.parseDOCX(file);
                case 'txt':
                    return await this.parseTXT(file);
                default:
                    throw new Error('Formato de ficheiro não suportado.');
            }
        } catch (error) {
            console.error('Erro no parsing:', error);
            throw error;
        }
    },

    /**
     * Parses PDF using pdf.js
     */
    parsePDF: async function (file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        return fullText;
    },

    /**
     * Parses DOCX using mammoth.js
     */
    parseDOCX: async function (file) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
    },

    /**
     * Parses TXT using FileReader
     */
    parseTXT: function (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
};
