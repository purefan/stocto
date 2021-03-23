const log = require('debug')('stocto:http')
const http = require('http')
const https = require('https')
const os = require('os')
const defaults = {
    headers: {
        'x-api-key': process.env.X_API_KEY || '894hmt3x489ht89p3x',
        'content-type': 'application/json',
        resker_client: process.env.STOCTO_CLIENT_NAME || os.hostname() || 'stocto-app'
    },
    protocol: process.env.RESKER_PROTO || 'https:',
    host: process.env.RESKER_HOST,
    port: process.env.RESKER_PORT || 443,
    method: 'GET'
}
module.exports = http_request

/**
 *
 * @param {Object} args
 * @param {String|Object} [args.body]
 * @param {Object} [args.headers]
 * @param {Number} [args.expected_status_code]
 * @param {String} [args.method]
 * @param {String} [args.protocol]
 * @param {String} [args.host]
 * @param {Number} [args.port]
 * @param {String} args.path
 */
function http_request(args) {
    return new Promise((resolve, reject) => {
        let body = args.body || false
        if (args.body) {
            delete args.body
        }

        const req_args = Object.assign(defaults, args)
        const transport = /* req_args.protocol.toLowerCase().includes('https') ? https : */ http
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
        const req = transport.request(req_args, res => {
            let body = ''
            res.on('data', data => (body += data))
            res.on('error', err => reject(err))
            res.on('end', () => {
                if (args.expected_status_code && res.statusCode != args.expected_status_code) {
                    const error_message = `HTTP request did not return (${res.statusCode}) the expected status code (${args.expected_status_code}): "${body.toString()}"`
                    log(error_message)
                    return reject(error_message)
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

http_request.defaults = defaults