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
        console.log("Parsing PDF:", file.name);
        try {
            const arrayBuffer = await file.arrayBuffer();

            // Check if pdfjsLib is loaded
            if (typeof pdfjsLib === 'undefined') {
                throw new Error("PDF.js library not loaded.");
            }

            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }

            return fullText;
        } catch (error) {
            console.error("PDF Parsing Error:", error);
            throw new Error("Failed to parse PDF: " + error.message);
        }
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
