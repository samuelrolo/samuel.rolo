(function () {
    function setupFeedbackModal() {
        const modal = document.getElementById('feedbackModal');
        const form = document.getElementById('feedbackForm');
        const ratingInput = document.getElementById('rating');

        if (!modal || !form || !ratingInput) {
            return;
        }

        const stars = modal.querySelectorAll('.star');
        if (!stars.length) {
            return;
        }

        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                const rating = index + 1;
                ratingInput.value = rating;
                updateStars(stars, rating);
            });

            star.addEventListener('mouseover', () => {
                const rating = index + 1;
                updateStars(stars, rating);
            });
        });

        modal.addEventListener('hidden.bs.modal', () => {
            form.reset();
            ratingInput.value = 0;
            updateStars(stars, 0);
        });
    }

    function updateStars(stars, rating) {
        stars.forEach((star, idx) => {
            if (idx < rating) {
                star.classList.add('active');
                star.innerHTML = '<i class="fas fa-star"></i>';
            } else {
                star.classList.remove('active');
                star.innerHTML = '<i class="far fa-star"></i>';
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupFeedbackModal);
    } else {
        setupFeedbackModal();
    }
})();
