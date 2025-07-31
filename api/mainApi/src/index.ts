import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true
  }

  console.log("event context:", event.requestContext)
  console.log("event rawpath:", event.rawPath)

  if (event.requestContext.http.method === 'POST' && event.rawPath === '/doc') {
    const body = JSON.parse(event.body || '{}')
  
    if (!body.docId || !body.doc) {
      return { statusCode: 400, body: 'Missing required fields' }
    }
  
    await docClient.send(
      new PutCommand({
        TableName: 'InspectionFormData',
        Item: {
          docId: body.docId,
          doc: body.doc,
          updatedAt: new Date().toISOString()
        }
      })
    )
  
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ message: 'Saved' })
    }
  } else {

    return { statusCode: 404, headers: headers, body: 'Not found' }
  }
}