import WebSocket, { WebSocketServer } from 'ws'
import * as Y from 'yjs'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb"
import { IncomingMessage } from 'http'

// DynamoDB setup
const client = new DynamoDBClient({ region: "us-east-1" })
const docClient = DynamoDBDocumentClient.from(client)

// WebSocket server
const wss = new WebSocketServer({ port: 8080 })

// In-memory document cache
const docs = new Map<string, { doc: Y.Doc, clients: Set<WebSocket> }>()

// Debounce save map
const saveTimers = new Map<string, NodeJS.Timeout>()
const DEBOUNCE_MS = 2000

// Load document from DB or cache
async function loadDoc(docId: string): Promise<Y.Doc> {
  if (docs.has(docId)) return docs.get(docId)!.doc

  const doc = new Y.Doc()
  console.log("Loading doc from DB:", docId)

  const res = await docClient.send(new GetCommand({
    TableName: "InspectionFormData",
    Key: { docId }
  }))

  if (res.Item?.doc) {
    const update = Buffer.from(res.Item.doc, 'base64')
    Y.applyUpdate(doc, update)
  }

  docs.set(docId, { doc, clients: new Set() })
  return doc
}

// Save document to DB
async function saveDoc(docId: string, doc: Y.Doc): Promise<void> {
  const update = Y.encodeStateAsUpdate(doc)

  await docClient.send(new PutCommand({
    TableName: "InspectionFormData",
    Item: {
      docId,
      doc: Buffer.from(update).toString('base64'),
      updatedAt: new Date().toISOString()
    }
  }))

  console.log(`Saved doc ${docId} to DB`)
}

// WebSocket connection handler
wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
  const url = req.url ? new URL(req.url, 'http://localhost') : null
  const docId = url?.searchParams.get('docId')
  if (!docId) return ws.close()

  const doc = await loadDoc(docId)
  const docEntry = docs.get(docId)!
  docEntry.clients.add(ws)

  // Send current document state
  const initialUpdate = Y.encodeStateAsUpdate(doc)
  ws.send(initialUpdate)

  ws.on('message', (msg: WebSocket.RawData) => {
    const update = new Uint8Array(msg as Buffer)
    Y.applyUpdate(doc, update)

    // Broadcast to other clients
    docEntry.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(update)
      }
    })

    // Debounced save
    if (saveTimers.has(docId)) clearTimeout(saveTimers.get(docId)!)
    saveTimers.set(
      docId,
      setTimeout(() => {
        void saveDoc(docId, doc)
        saveTimers.delete(docId)
      }, DEBOUNCE_MS)
    )
  })

  ws.on('close', () => {
    docEntry.clients.delete(ws)
    console.log(`Client disconnected from ${docId}. Clients remaining: ${docEntry.clients.size}`)

    // Clean up if no clients left
    if (docEntry.clients.size === 0) {
      console.log(`Cleaning up doc ${docId}`)
      docs.delete(docId)
      if (saveTimers.has(docId)) {
        clearTimeout(saveTimers.get(docId)!)
        saveTimers.delete(docId)
      }
    }
  })
})
