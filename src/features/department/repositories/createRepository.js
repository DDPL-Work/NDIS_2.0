// Frontend repository adapter.  Each domain has one canonical collection in
// projectEngine; swapping these adapters for API clients does not affect views.
export function createRepository(selector) {
  return {
    list: (state, predicate = () => true) => selector(state).filter(predicate),
    find: (state, id) => selector(state).find((record) => record.id === id),
  }
}
