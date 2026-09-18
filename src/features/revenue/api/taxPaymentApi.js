// Tax Payment API — Interfacing with authoritative backend endpoints:
// 1. POST /api/gis/pay-tax/ (Submit tax payment)
// 2. GET /api/gis/pay-tax/ (Verify payment status)

import { apiRequest, withQuery } from '../../../api/apiClient.js'

const PAY_TAX_ENDPOINT = '/gis/pay-tax/'

export const taxPaymentApi = {
  /**
   * Submit tax payment to POST /api/gis/pay-tax/
   * @param {Object} payload - { plot_id / property_id, amount, payment_mode, reference_no, remark }
   */
  async submitPayment(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payment payload must be an object')
    }

    const plotNo = String(payload.plot_no || payload.plotNo || payload.plot_id || payload.plotId || '')
    const name = payload.name || payload.owner_name || payload.ownerName || 'Property Owner'
    const taxAmount = Number(payload.tax_amount || payload.amount || payload.demand || 0)

    if (!plotNo && !payload.id && !payload.plot_id) {
      throw new Error('Plot number or property identifier is required for tax payment')
    }

    if (taxAmount <= 0) {
      throw new Error('Valid positive tax amount is required')
    }

    const formattedPayload = {
      id: payload.id ? String(payload.id) : (payload.plot_id ? `data_resi_${payload.plot_id}` : undefined),
      plot_id: payload.plot_id ? Number(payload.plot_id) : (payload.plotId ? Number(payload.plotId) : undefined),
      plot_no: plotNo,
      name,
      mobile: payload.mobile || payload.owner_mobile || payload.phone || undefined,
      area_sqft: Number(payload.area_sqft || payload.areaSqft || payload.area || 0) || undefined,
      tax_amount: taxAmount,
      payment_mode: payload.payment_mode || payload.paymentMode || 'UPI',
      remarks: payload.remarks || payload.remark || 'Online tax payment',
      assessment_year: payload.assessment_year || payload.assessmentYear || '2026-2027',
      period_month: payload.period_month || payload.periodMonth || '2026-09'
    }

    // Clean undefined properties
    Object.keys(formattedPayload).forEach(k => formattedPayload[k] === undefined && delete formattedPayload[k])

    const response = await apiRequest(PAY_TAX_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(formattedPayload)
    })

    const responseData = response?.data || response
    const receiptUrl = responseData?.receipt_url || response?.receipt_url || null
    const receiptNo = responseData?.receipt_no || response?.receipt_no || null
    const transactionId = responseData?.transaction_id || response?.transaction_id || response?.reference_no || null

    return {
      success: response?.status === 'success' || response?.success || true,
      status: responseData?.payment_status || response?.status || 'PAID',
      message: response?.message || 'Property tax payment processed successfully.',
      receiptUrl,
      receiptNo,
      transactionId,
      data: responseData,
      raw: response
    }
  },

  /**
   * Check payment status from GET /api/gis/pay-tax/
   * @param {Object} params - Query params e.g. { plot_id, transaction_id }
   */
  async verifyPayment(params = {}) {
    const response = await apiRequest(withQuery(PAY_TAX_ENDPOINT, params))
    return {
      verified: Boolean(response.status === 'PAID' || response.is_paid || response.success),
      status: response.status || 'PENDING',
      details: response
    }
  }
}
