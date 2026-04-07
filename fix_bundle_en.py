file_path = r'c:\Users\samue\.gemini\antigravity\scratch\samuel.rolo\apps\cv-analyser\client\src\pages\en\BundleHomeEN.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update handleProceedToPayment
old_func = """  const handleProceedToPayment = () => {
    if (!file) { setError('Upload your CV (PDF or DOCX)'); return; }
    if (!isValidLinkedinUrl(linkedinUrl)) { setError('Enter a valid LinkedIn URL'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email'); return; }
    if (!selectedCountry) { setError('Please select your country for localised results'); return; }
    if (!acceptedTerms) { setError('Accept the Privacy Policy'); return; }
    setError(null);
    setPaymentStep('payment');
    setPaymentError(null);
    setShowPaymentModal(true);
  };"""
  
new_func = """  const handleProceedToPayment = async () => {
    if (!file) { setError('Upload your CV (PDF or DOCX)'); return; }
    if (!isValidLinkedinUrl(linkedinUrl)) { setError('Enter a valid LinkedIn URL'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email'); return; }
    if (!selectedCountry) { setError('Please select your country for localised results'); return; }
    if (!acceptedTerms) { setError('Accept the Privacy Policy'); return; }
    setError(null);

    try {
      let cvText = "";
      if (file.type === 'application/pdf') cvText = await extractTextFromPDF(file);
      else cvText = await extractTextFromDOCX(file);
      localStorage.setItem('bundleCvText', cvText);
      localStorage.setItem('bundleLinkedinUrl', linkedinUrl);
      localStorage.setItem('bundleEmail', email.trim().toLowerCase());
      localStorage.setItem('bundleCountry', selectedCountry || '');
      localStorage.setItem('bundleRegion', selectedRegion || '');
    } catch (e) { console.warn('[Bundle] Pre-extraction error', e); }

    setPaymentStep('payment');
    setPaymentError(null);
    setShowPaymentModal(true);
  };"""

text = text.replace(old_func, new_func)

# 2. Update runBothEngines CV extraction
extraction_old = """      let cvText = "";
      if (file!.type === 'application/pdf') {
        cvText = await extractTextFromPDF(file!);
      } else {
        cvText = await extractTextFromDOCX(file!);
      }
      const reader = new FileReader();
      const base64Content = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file!);
      });
      const useServerExtraction = cvText.length < 50;"""
      
extraction_new = """      let cvText = "";
      let base64Content = "";
      let cvFilename = "cv.pdf";
      if (file) {
        if (file.type === 'application/pdf') cvText = await extractTextFromPDF(file);
        else cvText = await extractTextFromDOCX(file);
        cvFilename = file.name;
        const reader = new FileReader();
        base64Content = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        cvText = localStorage.getItem('bundleCvText') || sessionStorage.getItem('bundleCvText') || '';
        if (!cvText) throw new Error('CV could not be restored. Please try again or contact support.');
      }
      
      const currentLinkedinUrl = linkedinUrl || localStorage.getItem('bundleLinkedinUrl') || sessionStorage.getItem('bundleLinkedinUrl') || '';
      if (currentLinkedinUrl && !linkedinUrl) setLinkedinUrl(currentLinkedinUrl);
      const currentEmail = email || localStorage.getItem('bundleEmail') || sessionStorage.getItem('bundleEmail') || localStorage.getItem('paymentEmail') || '';
      const currentCountry = selectedCountry || localStorage.getItem('bundleCountry') || sessionStorage.getItem('bundleCountry') || '';
      const currentRegion = selectedRegion || localStorage.getItem('bundleRegion') || sessionStorage.getItem('bundleRegion') || '';
      
      const useServerExtraction = cvText.length < 50 && !!base64Content;"""

text = text.replace(extraction_old, extraction_new)

# 3. Fix properties
text = text.replace('requestBody.filename = file!.name;', 'requestBody.filename = cvFilename;')
text = text.replace("sessionStorage.setItem('cvFile', base64Content);\n      sessionStorage.setItem('cvFilename', file!.name);", "sessionStorage.setItem('cvFile', base64Content);\n      sessionStorage.setItem('cvFilename', cvFilename);")
text = text.replace("sessionStorage.setItem('paymentEmail', email.trim().toLowerCase());", "sessionStorage.setItem('paymentEmail', currentEmail.trim().toLowerCase());")
text = text.replace("sessionStorage.setItem('analysisCountry', selectedCountry || '');", "sessionStorage.setItem('analysisCountry', currentCountry);")
text = text.replace("sessionStorage.setItem('analysisRegion', selectedRegion || '');", "sessionStorage.setItem('analysisRegion', currentRegion);")

text = text.replace("sessionStorage.setItem('careerPathCvFilename', file!.name);", "sessionStorage.setItem('careerPathCvFilename', cvFilename);")
text = text.replace("sessionStorage.setItem('careerPathLinkedinUrl', linkedinUrl);", "sessionStorage.setItem('careerPathLinkedinUrl', currentLinkedinUrl);")
text = text.replace("user_email: email.trim().toLowerCase(),", "user_email: currentEmail.trim().toLowerCase(),")

# 4. Fix stripe saving
text = text.replace("sessionStorage.setItem('bundlePendingOrderId', orderId);\n        sessionStorage.setItem('bundleEmail', email);", "localStorage.setItem('bundlePendingOrderId', orderId);\n        localStorage.setItem('bundleEmail', email);\n        sessionStorage.setItem('bundlePendingOrderId', orderId);\n        sessionStorage.setItem('bundleEmail', email);")

# 5. Fix useEffect
text = text.replace("const savedEmail = sessionStorage.getItem('bundleEmail');", "const savedEmail = localStorage.getItem('bundleEmail') || sessionStorage.getItem('bundleEmail');")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated BundleHomeEN")
