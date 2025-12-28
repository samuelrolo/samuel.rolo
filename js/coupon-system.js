/**
 * Coupon System - Share2Inspire
 * Gestão de cupões de desconto para campanha de lançamento
 */
window.CouponSystem = {
    activeCoupons: {
        'NEWS2I10': {
            discount: 0.10, // 10%
            description: 'Newsletter Subscribers - 10% OFF',
            validUntil: null, // Always valid for now
            minAmount: 0
        }
    },

    /**
     * Validate and apply coupon code
     * @param {string} couponCode - Código do cupão inserido
     * @param {number} baseAmount - Valor base antes do desconto
     * @returns {Object} Resultado da validação com valor final
     */
    validateAndApply(couponCode, baseAmount) {
        const code = couponCode.toUpperCase().trim();
        const coupon = this.activeCoupons[code];

        if (!coupon) {
            return {
                valid: false,
                message: 'Cupão inválido',
                finalAmount: baseAmount.toFixed(2)
            };
        }

        if (baseAmount < coupon.minAmount) {
            return {
                valid: false,
                message: `Valor mínimo: ${coupon.minAmount}€`,
                finalAmount: baseAmount.toFixed(2)
            };
        }

        const discount = baseAmount * coupon.discount;
        const finalAmount = baseAmount - discount;

        return {
            valid: true,
            message: `✅ Cupão aplicado! Desconto: ${(coupon.discount * 100)}%`,
            originalAmount: baseAmount.toFixed(2),
            discountAmount: discount.toFixed(2),
            finalAmount: finalAmount.toFixed(2),
            couponCode: code,
            description: coupon.description
        };
    },

    /**
     * Remove coupon and return to original amount
     * @param {number} originalAmount - Valor original
     * @returns {Object} Reset result
     */
    removeCoupon(originalAmount) {
        return {
            valid: false,
            message: 'Cupão removido',
            finalAmount: originalAmount.toFixed(2)
        };
    }
};
