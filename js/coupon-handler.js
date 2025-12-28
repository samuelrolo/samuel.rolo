/**
 * Coupon Handler for Kickstart Pro and CV Review
 * Integrates with CouponSystem to apply discounts
 */

document.addEventListener('DOMContentLoaded', () => {

    // ============ KICKSTART PRO COUPON ============
    const kickstartCouponInput = document.getElementById('kickstartCoupon');
    const btnApplyKickstart = document.getElementById('btnApplyKickstartCoupon');
    const kickstartFeedback = document.getElementById('kickstartCouponFeedback');
    const kickstartBreakdown = document.getElementById('kickstartPriceBreakdown');

    let kickstartAppliedCoupon = null;
    const KICKSTART_BASE_PRICE = 30.00;

    if (btnApplyKickstart) {
        btnApplyKickstart.addEventListener('click', () => {
            const couponCode = kickstartCouponInput.value.trim();

            if (!couponCode) {
                kickstartFeedback.textContent = 'Digite um código de cupão';
                kickstartFeedback.className = 'form-text small mt-1 text-danger';
                return;
            }

            // Validate with CouponSystem
            const result = window.CouponSystem.validateAndApply(couponCode, KICKSTART_BASE_PRICE);

            if (result.valid) {
                // Success - show breakdown
                kickstartFeedback.textContent = result.message;
                kickstartFeedback.className = 'form-text small mt-1 text-success';

                // Update breakdown
                document.getElementById('kickstartBasePrice').textContent = `${result.originalAmount}€`;
                document.getElementById('kickstartCouponDiscount').textContent = `-${result.discountAmount}€`;
                document.getElementById('kickstartFinalPrice').textContent = `${result.finalAmount}€`;

                kickstartBreakdown.classList.remove('d-none');
                kickstartAppliedCoupon = result;

                // Update hidden amount field
                const amountField = document.querySelector('#kickstartForm input[name="amount"]');
                if (amountField) {
                    amountField.value = result.finalAmount;
                }

            } else {
                // Error
                kickstartFeedback.textContent = result.message;
                kickstartFeedback.className = 'form-text small mt-1 text-danger';
                kickstartBreakdown.classList.add('d-none');
                kickstartAppliedCoupon = null;

                // Reset amount
                const amountField = document.querySelector('#kickstartForm input[name="amount"]');
                if (amountField) {
                    amountField.value = KICKSTART_BASE_PRICE.toFixed(2);
                }
            }
        });

        // Allow Enter key
        kickstartCouponInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnApplyKickstart.click();
            }
        });
    }

    // ============ CV REVIEW COUPON ============
    const cvReviewCouponInput = document.getElementById('cvReviewCoupon');
    const btnApplyCVReview = document.getElementById('btnApplyCVReviewCoupon');
    const cvReviewFeedback = document.getElementById('cvReviewCouponFeedback');
    const cvReviewBreakdown = document.getElementById('cvReviewPriceBreakdown');

    let cvReviewAppliedCoupon = null;
    const CV_REVIEW_BASE_PRICE = 20.00;

    if (btnApplyCVReview) {
        btnApplyCVReview.addEventListener('click', () => {
            const couponCode = cvReviewCouponInput.value.trim();

            if (!couponCode) {
                cvReviewFeedback.textContent = 'Digite um código de cupão';
                cvReviewFeedback.className = 'form-text small mt-1 text-danger';
                return;
            }

            // Validate with CouponSystem
            const result = window.CouponSystem.validateAndApply(couponCode, CV_REVIEW_BASE_PRICE);

            if (result.valid) {
                // Success - show breakdown
                cvReviewFeedback.textContent = result.message;
                cvReviewFeedback.className = 'form-text small mt-1 text-success';

                // Update breakdown
                document.getElementById('cvReviewBasePrice').textContent = `${result.originalAmount}€`;
                document.getElementById('cvReviewCouponDiscount').textContent = `-${result.discountAmount}€`;
                document.getElementById('cvReviewFinalPrice').textContent = `${result.finalAmount}€`;

                cvReviewBreakdown.classList.remove('d-none');
                cvReviewAppliedCoupon = result;

            } else {
                // Error
                cvReviewFeedback.textContent = result.message;
                cvReviewFeedback.className = 'form-text small mt-1 text-danger';
                cvReviewBreakdown.classList.add('d-none');
                cvReviewAppliedCoupon = null;
            }
        });

        // Allow Enter key
        cvReviewCouponInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnApplyCVReview.click();
            }
        });
    }

    console.log('✅ Coupon handlers initialized');
});
