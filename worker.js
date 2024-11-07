// Constants
const TENANT_ID = 'b296947a-6915-4c83-9fff-25fe92a380e9'
const USER_EMAIL = 'mr.formulaa@tf2.onmicrosoft.com' // Your Microsoft Email 
const ALLOWED_COUNTRIES = ['BD', 'SG']
const MICROSOFT_CLIENT_ID = ''
const MICROSOFT_CLIENT_SECRET = ''

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function getAccessToken() {
    try {
        const tokenEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`

        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: MICROSOFT_CLIENT_ID,
            client_secret: MICROSOFT_CLIENT_SECRET,
            scope: 'https://graph.microsoft.com/.default'
        })

        console.log('Requesting token...')

        const tokenResponse = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString()
        })

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json()
            console.error('Token response error:', errorData)
            throw new Error(`Token request failed: ${errorData.error_description || errorData.error}`)
        }

        const tokenData = await tokenResponse.json()
        console.log('Token response received')

        if (!tokenData.access_token) {
            console.error('Token data:', tokenData)
            throw new Error('No access token in response')
        }

        return tokenData.access_token
    } catch (error) {
        console.error('Token error:', error)
        throw new Error(`Failed to get access token: ${error.message}`)
    }
}

async function handleRequest(request) {
    // Handle favicon request
    if (request.url.includes('favicon.ico')) {
        return new Response(null, { status: 204 })
    }

    // Get user's country from Cloudflare
    const country = request.headers.get('cf-ipcountry')

    // Check if country is allowed
    if (!ALLOWED_COUNTRIES.includes(country)) {
        return new Response('Access denied: This content is not available in your country', {
            status: 403,
            headers: { 'Content-Type': 'text/plain' }
        })
    }

    const url = new URL(request.url)
    const fileId = url.searchParams.get('ID')

    if (!fileId) {
        return new Response('Missing file ID', { status: 400 })
    }

    try {
        // Get access token
        const accessToken = await getAccessToken()

        // Get file details from Microsoft Graph API
        const graphResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${USER_EMAIL}/drive/items/${fileId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        })

        if (!graphResponse.ok) {
            throw new Error(`Graph API error: ${graphResponse.status}`)
        }

        const data = await graphResponse.json()
        const downloadUrl = data['@microsoft.graph.downloadUrl']

        if (!downloadUrl) {
            return new Response('Download URL not found', { status: 404 })
        }

        // Get range header from request
        const range = request.headers.get('range')

        // Add CORS and caching headers
        const headers = new Headers({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Accept-Ranges': 'bytes',
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${data.name}"`,
            'Cache-Control': 'public, max-age=31536000'
        })

        // If range header exists, create partial response
        if (range) {
            const fileResponse = await fetch(downloadUrl, {
                headers: { 'Range': range }
            })

            // Get content range and size from OneDrive response
            const contentRange = fileResponse.headers.get('content-range')
            const size = parseInt(contentRange?.split('/')[1] || '0')

            // Add content range header
            headers.set('Content-Range', contentRange || '')
            headers.set('Content-Length', fileResponse.headers.get('content-length') || '')

            return new Response(fileResponse.body, {
                status: 206,
                headers: headers
            })
        }

        // If no range header, stream entire file
        const fileResponse = await fetch(downloadUrl, {
            cf: {
                cacheTtl: 31536000,
                cacheEverything: true
            }
        })

        headers.set('Content-Length', fileResponse.headers.get('content-length') || '')

        return new Response(fileResponse.body, {
            headers: headers
        })
    } catch (err) {
        console.error('Error:', err)
        return new Response(err.message, { status: 500 })
    }
} 
