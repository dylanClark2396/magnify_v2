import * as Y from 'yjs'
import type { Doc } from './domain'

const config = useRuntimeConfig()
// To save the doc manually
export const saveDoc = async (docId: string, newDoc: Y.Doc) => {
  const doc = Y.encodeStateAsUpdate(newDoc)
  console.log(doc)
  await $fetch(`${config.public.apiBase}/doc`, {
    method: 'POST',
    body: JSON.stringify({
      docId: docId,
      doc: btoa(String.fromCharCode(...new Uint8Array(doc)))
    })
  })
}

export const loadDocs = async () => {
  const docs: Doc[] = await $fetch(`${config.public.apiBase}/docs`, {
    method: 'GET',
  })
  return docs
}