/**
 * Utility to clean up sensitive user data from localStorage and sessionStorage
 * It removes all application-specific data regarding CVs, LinkedIn URLs, and analysis results
 * without affecting user authentication sessions (Supabase tokens).
 */
export function clearSensitiveData() {
  const prefixesToRemove = [
    'cv',           // cvText, cvFile, cvFilename, cvAnalysis, cvAnalysisEN, etc.
    'careerPath',   // careerPathCvText, careerPathCvAnalysis, careerPathLinkedinUrl, careerPathPaid, etc.
    'bundle',       // bundleCvFile, bundleSummary, bundleEmail...
    'linkedin',     // linkedinUrl, linkedinRoasterPaid, linkedinRoasterProPaid, linkedinRoasterData...
    'cpOrderId',
    'ciOrderId',
    'cpPaymentEmail',
    'stripeSessionId',
    'analysis',     // analysisLang, analysisCountry, analysisRegion
    's2i_saved',    // dedup keys
  ];

  // Also some exact keys used everywhere
  const exactKeysToRemove = [
    'firstEngineResult',
    'secondEngineResult',
    'studentPackPaid',
    'hasStudentDiscount',
    'selectedCourse',
    'ciNeedsRegeneration',
    'generatedCoverLetter',
    'hasLinkedInOptimization',
    'linkedInGuidance'
  ];

  const storageTypes = [localStorage, sessionStorage];

  storageTypes.forEach(storage => {
    // Collect keys to remove to avoid modifying the array while iterating
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key) continue;

        // Skip Supabase auth tokens
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) continue;

        // Check exact match
        if (exactKeysToRemove.includes(key)) {
            keysToRemove.push(key);
            continue;
        }

        // Check prefixes
        for (const prefix of prefixesToRemove) {
            if (key.startsWith(prefix)) {
                keysToRemove.push(key);
                break;
            }
        }
    }

    // Now remove them safely
    keysToRemove.forEach(key => storage.removeItem(key));
  });

  console.log('[S2I Privacy] Limpeza de dados sensíveis efetuada com sucesso.');
}

/**
 * Cleanup and direct to home
 */
export function finishAndClean(setLocation: (path: string) => void, navigateMsgPt: string = "A redirecionar...") {
  clearSensitiveData();
  // Optional: add a tiny delay to show the user it is working
  setTimeout(() => {
     setLocation("/");
  }, 100);
}
