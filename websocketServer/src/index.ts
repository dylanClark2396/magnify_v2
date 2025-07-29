import WebSocket, { WebSocketServer } from 'ws'
import * as Y from 'yjs'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb"
import { IncomingMessage } from 'http'

const client = new DynamoDBClient({ region: "us-east-1" })
const docClient = DynamoDBDocumentClient.from(client)
const wss = new WebSocketServer({ port: 8080 })

const docs = new Map<string, Y.Doc>()

async function loadDoc(docId: string): Promise<Y.Doc> {
  if (docs.has(docId)) return docs.get(docId)!

  const ydoc = new Y.Doc()
  console.log("Getting Doc")
  const res = await docClient.send(new GetCommand({
    TableName: "InspectionFormData",
    Key: { docId }
  }))

  console.log(res)

  if (res.Item && res.Item.doc) {
    const update = Buffer.from(res.Item.doc, 'base64')
    Y.applyUpdate(ydoc, update)
  }

  docs.set(docId, ydoc)
  return ydoc
}

async function saveDoc(docId: string, ydoc: Y.Doc): Promise<void> {
  const update = Y.encodeStateAsUpdate(ydoc)

  await docClient.send(new PutCommand({
    TableName: "InspectionFormData",
     Item: {
      docId,
      doc: Buffer.from(update).toString('base64'),
      updatedAt: new Date().toISOString()
    }
  }))
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
