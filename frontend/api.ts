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

export const getSignedUrls = async (files: { fileName: string, contentType: string }[], docId: string ): Promise<{fileName: string, url: string, key: string}[]> => {
  return await $fetch(`${config.public.apiBase}/get-signed-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: files, docId: docId })
  })
}