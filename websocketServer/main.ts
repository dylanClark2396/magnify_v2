import WebSocket, { WebSocketServer } from 'ws'
import * as Y from 'yjs'
import AWS from 'aws-sdk'
import { IncomingMessage } from 'http'

const dynamo = new AWS.DynamoDB.DocumentClient()
const wss = new WebSocketServer({ port: 8080 })

const docs = new Map<string, Y.Doc>()

async function loadDoc(docId: string): Promise<Y.Doc> {
  if (docs.has(docId)) return docs.get(docId)!

  const ydoc = new Y.Doc()
  const res = await dynamo.get({
    TableName: 'InspectionFormData',
    Key: { docId }
  }).promise()

  if (res.Item && res.Item.yjsDoc) {
    const update = Buffer.from(res.Item.yjsDoc, 'base64')
    Y.applyUpdate(ydoc, update)
  }

  docs.set(docId, ydoc)
  return ydoc
}

async function saveDoc(docId: string, ydoc: Y.Doc): Promise<void> {
  const update = Y.encodeStateAsUpdate(ydoc)
  await dynamo.put({
    TableName: 'InspectionFormData',
    Item: {
      docId,
      yjsDoc: update.toString(),
      updatedAt: new Date().toISOString()
    }
  }).promise()
}

// Periodic auto-save
setInterval(() => {
  for (const [docId, ydoc] of docs.entries()) {
    void saveDoc(docId, ydoc)
  }
}, 5000)

wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
  const url = req.url ? new URL(req.url, 'http://localhost') : null
  const docId = url?.searchParams.get('docId')
  if (!docId) return ws.close()

  const ydoc = await loadDoc(docId)
  const initialUpdate = Y.encodeStateAsUpdate(ydoc)
  ws.send(initialUpdate)

  ws.on('message', (msg: WebSocket.RawData) => {
    const update = new Uint8Array(msg as Buffer)
    Y.applyUpdate(ydoc, update)

    // Broadcast to others
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(update)
      }
    })
  })
})
