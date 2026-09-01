// Facility action validation Ã¢â‚¬â€ user-friendly, field-level validation.
// No fabricated error messages. No technical jargon.

import { INTERVENTION_CATEGORIES } from './constants'

export function validateProposal(form) {
  const errors = {}

  if (!form.interventionType) {
    errors.interventionType = 'Please select what needs to be done.'
  } else if (!INTERVENTION_CATEGORIES.some((c) => c.value === form.interventionType)) {
    errors.interventionType = 'Please select a valid intervention type.'
  }

  if (!form.description || !form.description.trim()) {
    errors.description = 'Please describe what needs to be done.'
  } else if (form.description.trim().length < 10) {
    errors.description = 'Please provide more detail (at least 10 characters).'
  }

  if (form.estimatedCost && isNaN(Number(form.estimatedCost))) {
    errors.estimatedCost = 'Please enter a valid amount.'
  }

  if (form.estimatedCost && Number(form.estimatedCost) < 0) {
    errors.estimatedCost = 'Cost cannot be negative.'
  }

  return errors
}

export function validateInspection(form) {
  const errors = {}

  if (!form.purpose || !form.purpose.trim()) {
    errors.purpose = 'Please describe the purpose of the inspection.'
  }

  if (!form.preferredDate) {
    errors.preferredDate = 'Please select a preferred date.'
  } else {
    const selected = new Date(form.preferredDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selected < today) {
      errors.preferredDate = 'Please select a date today or in the future.'
    }
  }

  return errors
}

export function validateEscalation(form) {
  const errors = {}

  if (!form.reason || !form.reason.trim()) {
    errors.reason = 'Please provide a reason for escalation.'
  }

  return errors
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}
