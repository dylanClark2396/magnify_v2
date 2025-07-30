import * as Y from 'yjs'

const config = useRuntimeConfig()
// To save the doc manually
export const saveDoc = async (docId: string, newDoc: Y.Doc) => {
  const doc = Y.encodeStateAsUpdate(newDoc)
  await fetch(`${config.public.apiBase}/creat-draft`, {
    method: 'POST',
    body: JSON.stringify({
      docId: docId,
      doc: doc
    }),
    headers: {
      'Content-Type': 'application/octet-stream'
    }
  })
}