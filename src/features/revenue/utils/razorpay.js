// Razorpay Payment Integration — TEST mode only
// Secret key MUST remain server-side; only Key ID is exposed to frontend

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

let razorpayLoadPromise = null

/**
 * Load Razorpay checkout script dynamically
 * @returns {Promise<boolean>} Resolves to true if loaded successfully
 */
export function loadRazorpayScript() {
  if (typeof window === 'undefined') return Promise.resolve(false)

  // Return existing promise if already loading/loaded
  if (razorpayLoadPromise) return razorpayLoadPromise

  // Check if already loaded
  if (window.Razorpay) return Promise.resolve(true)

  razorpayLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT_URL
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => {
      razorpayLoadPromise = null
      resolve(false)
    }
    document.body.appendChild(script)
  })

  return razorpayLoadPromise
}

/**
 * Convert INR amount to paise for Razorpay
 * @param {number} amountInr - Amount in INR (e.g., 130620.50)
 * @returns {number} Amount in paise (e.g., 13062050)
 * @throws {Error} If amount is invalid
 */
export function toRazorpayAmount(amountInr) {
  const amount = Number(amountInr)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid payment amount: must be a positive number')
  }
  // Convert to paise (smallest currency unit for INR)
  return Math.round(amount * 100)
}

/**
 * Validate payment data before initiating Razorpay
 * @param {Object} data - Payment data
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validatePaymentData({ propertyId, plotNo, ownerName, amount }) {
  if (!propertyId && !plotNo) {
    return { valid: false, error: 'Property identifier is required' }
  }
  if (!ownerName || !ownerName.trim()) {
    return { valid: false, error: 'Owner name is required' }
  }
  if (!amount || Number(amount) <= 0) {
    return { valid: false, error: 'Valid payment amount is required' }
  }
  return { valid: true }
}

/**
 * Open Razorpay checkout for property tax payment
 * @param {Object} options - Checkout options
 * @returns {Promise<Object>} Razorpay payment response
 */
export function openRazorpayCheckout(options) {
  const {
    propertyId,
    plotNo,
    ownerName,
    mobile,
    amount,
    description,
    assessmentYear,
    periodMonth,
    onSuccess,
    onError,
    onDismiss,
  } = options

  return loadRazorpayScript().then((loaded) => {
    if (!loaded || !window.Razorpay) {
      const err = new Error('Failed to load Razorpay checkout. Please check your internet connection.')
      onError?.(err)
      throw err
    }

    if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID.includes('your_key_id')) {
      const err = new Error('Razorpay Key ID not configured. Please set VITE_RAZORPAY_KEY_ID in environment variables.')
      onError?.(err)
      throw err
    }

    const amountInPaise = toRazorpayAmount(amount)

    const checkoutOptions = {
      key: RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: 'INR',
      name: 'NDISP Property Tax',
      description: description || `Property Tax Payment — Plot #${plotNo}`,
      image: '/favicon.ico',
      prefill: {
        name: ownerName,
        contact: mobile || undefined,
        email: undefined,
      },
      notes: {
        property_id: String(propertyId || ''),
        plot_no: String(plotNo || ''),
        assessment_year: assessmentYear || '',
        period_month: periodMonth || '',
      },
      theme: {
        color: '#059669', // Emerald-600
      },
      modal: {
        ondismiss: () => {
          onDismiss?.()
        },
      },
      handler: (response) => {
        // Razorpay client-side success - must verify with backend
        onSuccess?.(response)
      },
    }

    const rzp = new window.Razorpay(checkoutOptions)
    rzp.on('payment.failed', (response) => {
      const err = new Error(response.error?.description || 'Payment failed')
      err.code = response.error?.code
      err.metadata = response.error?.metadata
      onError?.(err, response)
    })
    rzp.open()
  })
}

/**
 * Complete property tax payment flow:
 * 1. Open Razorpay checkout
 * 2. On success, submit to backend
 * 3. Verify with backend
 * @param {Object} params - Payment parameters
 * @returns {Promise<Object>} Backend payment response
 */
export async function processPropertyTaxPayment(params) {
  const {
    propertyId,
    plotNo,
    ownerName,
    mobile,
    areaSqft,
    taxAmount,
    paymentMode = 'UPI',
    assessmentYear,
    periodMonth,
    onPaymentStart,
    onPaymentSuccess,
    onPaymentFailure,
    onPaymentCancel,
  } = params

  // Validate
  const validation = validatePaymentData({ propertyId, plotNo, ownerName, amount: taxAmount, mobile })
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Step 1: Initiate Razorpay checkout
  return new Promise((resolve, reject) => {
    onPaymentStart?.()

    openRazorpayCheckout({
      propertyId,
      plotNo,
      ownerName,
      mobile,
      amount: taxAmount,
      description: `Property Tax Payment — Plot #${plotNo}`,
      assessmentYear,
      periodMonth,
      onSuccess: async (razorpayResponse) => {
        try {
          // Step 2: Submit payment to backend with Razorpay response
          const payload = {
            id: propertyId ? String(propertyId) : undefined,
            plot_id: typeof plotNo === 'number' ? plotNo : Number(plotNo),
            plot_no: String(plotNo),
            name: ownerName,
            mobile: mobile || '',
            area_sqft: areaSqft || undefined,
            tax_amount: taxAmount,
            payment_mode: paymentMode,
            remarks: `Online payment via Razorpay (${razorpayResponse.razorpay_payment_id})`,
            assessment_year: assessmentYear,
            period_month: periodMonth,
            // Razorpay specific fields for backend verification
            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
            razorpay_order_id: razorpayResponse.razorpay_order_id,
            razorpay_signature: razorpayResponse.razorpay_signature,
          }

          // Clean undefined
          Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

          const response = await fetch('/api/gis/pay-tax/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

          const data = await response.json()

          if (!response.ok || data.status === 'error') {
            throw new Error(data.message || 'Backend payment submission failed')
          }

          // Step 3: Verify payment status
          const verifyResponse = await fetch(`/api/gis/pay-tax/?plot_no=${encodeURIComponent(plotNo)}`)
          const verifyData = await verifyResponse.json()

          if (verifyData.is_tax_paid) {
            onPaymentSuccess?.(data.data || data)
            resolve(data.data || data)
          } else {
            const err = new Error('Payment submitted but backend verification pending. Please check transaction status.')
            onPaymentFailure?.(err, data)
            reject(err)
          }
        } catch (err) {
          onPaymentFailure?.(err)
          reject(err)
        }
      },
      onError: (err, razorpayResponse) => {
        onPaymentFailure?.(err, razorpayResponse)
        reject(err)
      },
      onDismiss: () => {
        onPaymentCancel?.()
        reject(new Error('Payment cancelled by user'))
      },
    })
  })
}

export default {
  loadRazorpayScript,
  toRazorpayAmount,
  validatePaymentData,
  openRazorpayCheckout,
  processPropertyTaxPayment,
}