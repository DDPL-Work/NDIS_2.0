// Tax Slip API — Interfacing with authoritative backend endpoint GET /tax-slip/
import { apiRequest, withQuery } from '../../../api/apiClient.js'

const TAX_SLIP_ENDPOINT = '/tax-slip/'

export const taxSlipApi = {
  /**
   * Fetch official tax slip / receipt from GET /tax-slip/
   * @param {Object} params - { plot_id / property_id, transaction_id, year }
   */
  async fetchTaxSlip(params = {}) {
    const plotId = params.plot_id || params.plotId || params.property_id || params.id
    if (!plotId) {
      throw new Error('Plot/Property ID is required to fetch tax slip')
    }

    const query = {
      plot_id: String(plotId),
      ...(params.year ? { year: params.year } : {}),
      ...(params.transaction_id ? { transaction_id: params.transaction_id } : {})
    }

    const response = await apiRequest(withQuery(TAX_SLIP_ENDPOINT, query))
    
    return {
      slipUrl: response.slip_url || response.url || response.download_url || null,
      documentNumber: response.slip_no || response.document_number || response.id || null,
      issueDate: response.issued_at || response.created_at || null,
      data: response
    }
  }
}
