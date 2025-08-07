import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb"
import { validateBodyFields, validateQueryParams } from './utils'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({ region: "us-east-1" })
const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)
const BUCKET_NAME = "magnify-media-upload"

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true
  }

  const method = event.requestContext.http.method
  const path = event.rawPath

  console.log("event context:", event.requestContext)
  console.log("event rawpath:", path)

  if (method === 'POST' && path === '/doc') {
    const { body, error } = validateBodyFields(headers, event, ['docId', 'doc']);
    if (error) return error;

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
  }
  if (method === 'GET' && path === '/docs') {
    // const {body , error} = validateQueryParams(headers, event, ['userid']);
    // if (error) return error;

    const data = await docClient.send(
      new ScanCommand({
        TableName: 'InspectionFormData'
      })
    )

    console.log("All items:", data.Items);

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(data.Items)
    }
  } if (method === 'POST' && path == '/get-signed-url') {
    const { body, error } = validateBodyFields(headers, event, ['docId', 'files', 'requestType']);
    if (error) return error;

    const files: { fileName: string, contentType: string, room: string, section: string }[] = body.files

    const results = await Promise.all(
      files.map(async ({ fileName, contentType, room, section }) => {

        const key = `${body.docId}/${room}/${section}/${fileName}`

        let command

        if (body.requestType === "PUT") {
          command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
          })
        } else if (body.requestType === "GET") {
          command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
          })
        } else {
          return
        }

        const url = await getSignedUrl(s3, command, { expiresIn: 300 })

        return { room, section, fileName, url, key, }
      })
    )

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(results)
    }


  }
  if (method === 'POST' && path === '/delete-form-media') {
    const { body, error } = validateBodyFields(headers, event, ['s3Keys', 'docId']);
    if (error) return error;

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: body.s3Keys.map((key: string) => ({ Key: key }))
      }
    }

    const res = await s3.send(new DeleteObjectsCommand(deleteParams))

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(res)
    }
  } else {

    return { statusCode: 404, headers: headers, body: 'Route not found' }
  }
}