import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    // Read the OpenAPI specification file
    const filePath = join(process.cwd(), 'docs', 'api', 'openapi.yaml')
    const fileContent = readFileSync(filePath, 'utf8')
    
    // Return the YAML content with appropriate headers
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/x-yaml',
        'Content-Disposition': 'inline; filename="openapi.yaml"',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error serving OpenAPI specification:', error)
    return NextResponse.json(
      { error: 'OpenAPI specification not found' },
      { status: 404 }
    )
  }
}