/**
 * Feedback System for Share2Inspire Website
 * This file handles the feedback popup and star rating system
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize feedback system
    initFeedbackSystem();
});

/**
 * Initialize feedback system
 */
function initFeedbackSystem() {
    // Get feedback button and modal elements
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    
    if (!feedbackBtn || !feedbackModal) return;
    
    // Initialize feedback modal
    const modal = new bootstrap.Modal(feedbackModal);
    
    // Open feedback modal when button is clicked
    feedbackBtn.addEventListener('click', function() {
        modal.show();
    });
    
    // Handle star rating selection
    const stars = document.querySelectorAll('.rating .star');
    const ratingInput = document.getElementById('rating');
    
    if (!stars.length || !ratingInput) return;
    
    stars.forEach(function(star) {
        star.addEventListener('mouseenter', function() {
            const value = parseInt(this.getAttribute('data-value'));
            
            // Highlight stars on hover
            stars.forEach(function(s, index) {
                if (index < value) {
                    s.classList.add('hover');
                } else {
                    s.classList.remove('hover');
                }
            });
        });
        
        star.addEventListener('mouseleave', function() {
            // Remove hover effect
            stars.forEach(function(s) {
                s.classList.remove('hover');
            });
        });
        
        star.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            ratingInput.value = value;
            
            // Reset all stars
            stars.forEach(function(s) {
                s.classList.remove('active');
            });
            
            // Highlight selected stars
            for (let i = 0; i < value; i++) {
                stars[i].classList.add('active');
            }
        });
    });
    
    // Reset form when modal is hidden
    feedbackModal.addEventListener('hidden.bs.modal', function() {
        const feedbackForm = document.getElementById('feedbackForm');
        const feedbackMessage = document.getElementById('feedbackMessage');
        
        if (feedbackForm) {
            feedbackForm.reset();
        }
        
        if (feedbackMessage) {
            feedbackMessage.innerHTML = '';
        }
        
        // Reset stars
        stars.forEach(function(s) {
            s.classList.remove('active');
            s.classList.remove('hover');
        });
        
        if (ratingInput) {
            ratingInput.value = '0';
        }
    });
}
