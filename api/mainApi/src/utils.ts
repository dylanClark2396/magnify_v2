import { APIGatewayProxyEventV2 } from 'aws-lambda';

export function validateQueryParams(
  headers: Record<string, any>,
  event: APIGatewayProxyEventV2,
  requiredParams: string[] = []
) {
  if (!event.queryStringParameters) {
    return {
      body: null,
      error: {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "queryStringParameters is empty" }),
      }
    };
  }

  for (const param of requiredParams) {
    if (!(param in event.queryStringParameters)) {
      return {
        body: null,
        error: {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Missing required query parameter: ${param}` }),
        }
      };
    }
  }

  return { body: event.queryStringParameters, error: null };
}

export function validateBodyFields(headers: Record<string, any>, event: any, requiredFields: string[]) {
  let body: Record<string, any> = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return {
      body: null,
      error: {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      }
    };
  }

  for (const field of requiredFields) {
    if (!(field in body)) {
      return {
        body: null,
        error: {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `Missing required field: ${field}` })
        }
      };
    }
  }

  return { body, error: null };
}