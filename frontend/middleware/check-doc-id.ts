export default defineNuxtRouteMiddleware(async (to, from) => {
  const docId = to.query.docId
  
  if (!docId) {
    return navigateTo('/error?message=Missing doc Id')
  }

  if (!to.query.docId && from.query.docId) {
    return navigateTo({ path: to.path, query: { ...to.query, docId: from.query.docId } })
  }
})
