/**
 * Share2Inspire - Newsletter Supabase Integration
 * Handles newsletter subscriptions by saving them directly to Supabase
 */

const NEWSLETTER_SUPABASE_CONFIG = {
    url: 'https://cvlumvgrbuolrnwrtrgz.supabase.co',
    key: window.__SUPABASE_ANON_KEY__||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM',
    table: 'newsletter_subscribers'
};

async function subscribeToNewsletter(name, email, source = 'website') {
    console.log(`Subscribing ${email} from ${source} to Supabase...`);
    
    try {
        const response = await fetch(`${NEWSLETTER_SUPABASE_CONFIG.url}/rest/v1/${NEWSLETTER_SUPABASE_CONFIG.table}`, {
            method: 'POST',
            headers: {
                'apikey': NEWSLETTER_SUPABASE_CONFIG.key,
                'Authorization': `Bearer ${NEWSLETTER_SUPABASE_CONFIG.key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                name: name,
                email: email,
                source: source,
                status: 'active',
                subscribed_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Supabase error:', errorData);
            
            // Handle unique constraint violation (already subscribed)
            if (errorData.code === '23505') {
                const isEN = window.location.pathname.includes('/en/');
                return { success: true, alreadySubscribed: true, message: isEN ? 'This email is already subscribed.' : 'Este e-mail já está subscrito.' };
            }
            throw new Error(errorData.message || 'Erro ao gravar na base de dados.');
        }

        const isEN = window.location.pathname.includes('/en/');
        return { success: true, message: isEN ? 'Successfully subscribed!' : 'Subscrição efetuada com sucesso!' };
    } catch (error) {
        console.error('Newsletter subscription failed:', error);
        const isEN = window.location.pathname.includes('/en/');
        return { success: false, message: isEN ? 'Subscription error. Please try again later.' : 'Erro na subscrição. Tente novamente mais tarde.' };
    }
}

// Initialize all newsletter forms on the page
document.addEventListener('DOMContentLoaded', function() {
    // Select all forms that look like newsletter forms
    const forms = document.querySelectorAll('form.newsletter-form, #newsletterSubscriptionForm, form[id*="newsletter"], form[id*="Subscription"]');
    
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            // Check if there's already a listener or if we should handle it
            // If the form has an inline script, we might want to let it run but also do our part
            // For now, we'll try to be the primary handler if it's our known ID
            
            const isKnownForm = form.id === 'newsletterSubscriptionForm';
            if (isKnownForm) {
                e.preventDefault();
                e.stopImmediatePropagation();
            } else {
                // For other forms, we just want to capture the data without necessarily stopping the original flow
                // but since we want to ensure it goes to Supabase, we'll handle it.
                e.preventDefault();
            }
            
            const nameInput = form.querySelector('input[type="text"], #subscriberName, input[name*="name"]');
            const emailInput = form.querySelector('input[type="email"], #subscriberEmail, input[name*="email"]');
            const submitBtn = form.querySelector('button[type="submit"]');
            const messageDiv = document.getElementById('subscriptionMessage') || form.querySelector('.newsletter-msg') || form.querySelector('.message-div');
            
            if (!emailInput || !emailInput.value) return;
            
            const name = nameInput ? nameInput.value.trim() : '';
            const email = emailInput.value.trim();
            const source = form.querySelector('input[name="source"]')?.value || window.location.pathname.split('/').pop() || 'home';
            
            const isEN = window.location.pathname.includes('/en/');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.origText = submitBtn.textContent;
                submitBtn.textContent = isEN ? 'Processing...' : 'A processar...';
            }
            
            const result = await subscribeToNewsletter(name, email, `web-${source}`);
            
            // Also try to call the original backend if it's the known form to maintain existing behavior (Brevo, etc.)
            if (isKnownForm) {
                try {
                    fetch('https://share2inspire-beckend.lm.r.appspot.com/api/newsletter/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: name, email: email, source: source })
                    }).catch(() => {});
                } catch(err) {}
            }

            if (messageDiv) {
                messageDiv.style.display = 'block';
                messageDiv.style.cssText = 'display:block; padding:10px 16px; border-radius:6px; margin-top:1rem; font-size:0.8rem;';
                
                if (result.success) {
                    messageDiv.style.background = 'rgba(201,169,97,0.15)';
                    messageDiv.style.color = '#C9A961';
                    messageDiv.textContent = result.message;
                    form.reset();
                } else {
                    messageDiv.style.background = 'rgba(220,53,69,0.1)';
                    messageDiv.style.color = '#dc3545';
                    messageDiv.textContent = result.message;
                }
                
                setTimeout(() => { messageDiv.style.display = 'none'; }, 5000);
            }
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.origText;
            }
        });
    });
});
