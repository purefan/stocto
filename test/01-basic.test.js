process.env.RESKER_PROTO = 'http:'
const { Engine } = require('node-uci')
const settings = require('../package.json').settings
const path = require('path')
const uci = new Engine(path.join(__dirname, '..', 'bin', settings.stockfish_exec))
const Stocto = require('../lib/stocto')
const stocto = new Stocto({ uci })
const os = require('os')
const debug = require('debug')('stocto:test:basic')
const nock = require('nock')
const http = require('../lib/http')
const assert = require('assert')

describe('0 - API Key', function () {
    const log = debug.extend('api_key')

    beforeAll(async () => {
        log('Initializing stockfish')
        await stocto.uci.init()
        await stocto.uci.ucinewgame()
        await stocto.uci.isready()
        await stocto.uci.setoption('Skill Level', '20')
        await stocto.uci.setoption('Threads', os.cpus().length)
        log('Finished initializing stockfish')
    })

    afterAll(async () => {
        log('Stopping stockfish', stocto.proc)
        await stocto.uci.quit()
        log('Finished stopping stockfish')
    })

    it('Invalid key fails', async function () {
        expect.assertions(1)
        const intercept_url = `${http.defaults.protocol}//${http.defaults.host}:${http.defaults.port}`

        nock(intercept_url)
            .get('/position/analysis/queue')
            .reply(401)

        return expect(stocto.get_queued_position())
            .rejects
            .toEqual('HTTP request did not return (401) the expected status code (200): ""')
    })

    it('Analysis has a valid structure', async () => {
        const analysis = await stocto.do_analysis({
            fen: 'rnbqk1nr/pp1p1ppp/4p3/8/1b2P3/8/1BPP1PPP/RN1QKBNR b KQkq - 1 5',
            depth_goal: 5
        })
        const fields = [ 'fen', 'engine_name', 'depth', 'best_move', 'multipv', 'steps', 'score' ]
        fields.forEach(field => assert(analysis.hasOwnProperty(field), `Missing field "${field}`))
        assert(Array.isArray(analysis.steps) && analysis.steps.length > 0, 'Steps are no bueno')
        analysis.steps.forEach(step => {
            assert(step.hasOwnProperty('depth'), 'This step lacks depth')
            assert(step.hasOwnProperty('pv'), 'This step lacks depth')
            assert(step.hasOwnProperty('score'), 'This step lacks depth')
        })
    })
})