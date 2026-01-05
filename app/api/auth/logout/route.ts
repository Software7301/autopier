import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })

  response.cookies.delete('sb-access-token')
  response.cookies.delete('sb-refresh-token')

  return response
}

