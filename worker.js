// Environment variables will be injected by Cloudflare
const ALLOWED_COUNTRIES = ['BD', 'SG'] // Only Bangladesh and Singapore
const TENANT_ID = 'b296947a-6915-4c83-9fff-25fe92a380e9'
const USER_EMAIL = 'masudrana@tf267.onmicrosoft.com'

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function getAccessToken() {
    const tokenEndpoint = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: MICROSOFT_CLIENT_ID,
            client_secret: MICROSOFT_CLIENT_SECRET,
            grant_type: 'client_credentials',
            scope: 'https://graph.microsoft.com/.default'
        })
    })

    const data = await response.json()
    return data.access_token
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
            headers: {
                'Content-Type': 'text/plain'
            }
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

        // Add CORS headers
        const headers = new Headers({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Content-Type': 'application/octet-stream'
        })

        // Fetch and stream the file
        const fileResponse = await fetch(downloadUrl)

        return new Response(fileResponse.body, {
            headers: {
                ...Object.fromEntries(fileResponse.headers),
                ...Object.fromEntries(headers)
            }
        })
    } catch (err) {
        console.error('Error:', err)
        return new Response(err.message, { status: 500 })
    }
} 