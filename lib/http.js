const log = require('debug')('stocto:http')
const http = require('https')
const os = require('os')
const defaults = {
    headers: {
        'x-api-key': process.env.X_API_KEY || '894hmt3x489ht89p3x',
        'content-type': 'application/json',
        resker_client: process.env.STOCTO_CLIENT_NAME || os.hostname() || 'stocto-app'
    },
    protocol: 'https:',
    host: process.env.RESKER_HOST,
    port: process.env.RESKER_PORT || 443,
    method: 'GET'
}

module.exports = args => {
    return new Promise((resolve, reject) => {
        let body = args.body || false
        if (args.body) {
            delete args.body
        }

        const req_args = Object.assign(defaults, args)
        // https://github.com/dherault/serverless-offline/issues/610
        if (req_args.method.toLowerCase() == 'get') {
            req_args.headers[ 'Content-Length' ] = 0
        }

        if (body) {
            req_args.headers[ 'Content-Length' ] = JSON.stringify(body).length
            log('Set content-length to %d', req_args.headers[ 'Content-Length' ])
        }

        log('req_args %O', req_args)
        log('limited body %s', JSON.stringify(body).substr(0, 300))
        const req = http.request(req_args, res => {
            let body = ''
            res.on('data', data => (body += data))
            res.on('error', err => reject(err))
            res.on('end', () => {
                if (args.expected_status_code && res.statusCode != args.expected_status_code) {
                    const error_message = `HTTP request did not return (${res.statusCode}) the expected status code (${args.expected_status_code}):  "${body.toString()}"`
                    log(error_message)
                    throw new Error(error_message)
                }
                const resolver = Object.assign({ statusCode: res.statusCode, body: body }, res.headers)
                resolve(resolver)
            })
        })
        if (args.headers) {
            Object.keys(args.headers)
                .filter(header => typeof args.headers[ header ] != 'undefined')
                .forEach(header => req.setHeader(header, args.headers[ header ]))
        }
        req.on('error', err => {
            log('Error %O', err)
            reject(err)
        })

        if (body) {
            log('Sending the body as %s', JSON.stringify(body).substr(0, 300))
            log('Body has %s chars', JSON.stringify(body).length)
            req.write(JSON.stringify(body))
            req.end()
        }
        else {
            log('No body to send')
            req.end()
        }
    })
}