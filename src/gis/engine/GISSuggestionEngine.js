const POPULAR = ['Nearest hospital', 'Nearest PHC', 'Health facility finder', 'Nearest bank', 'Nearest school', 'Water tank', 'Police station', 'Fire station', 'Nearest oxygen PHC', 'Nearby complaints']
export function getGISSuggestions(value = '') {
  const term = value.trim().toLowerCase()
  return POPULAR.filter((suggestion) => !term || suggestion.toLowerCase().includes(term) || term.split(' ').some((word) => suggestion.toLowerCase().includes(word))).slice(0, 6)
}
