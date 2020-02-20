const http = require('./http')
const debug = require('debug')('stocto:lib:stocto')
const path = require('path')

const { Engine } = require('node-uci')

class Stocto {
    constructor(params) {
        this.uci = null
        if (params.uci) {
            this.uci = params.uci
        }
    }
    async get_queued_position() {
        const log = debug.extend('get_queued_position')
        log('getting queued position')
        try {
            const res = await http({
                method: 'get',
                path: '/position/analysis/queue',
                expected_status_code: 200
            })
            log('status_code: %s', res.statusCode)
            log('Body', Object.assign({}, JSON.parse(res.body), { analysis: '...possibly long...' }))
            if (res.statusCode == 401) {
                log('Unauthorized')
            }
            if (res.body == 'Wrong api key') {
                log(res.body)
            } else {
                const position = JSON.parse(res.body)
                debug('position %O', position)
                return position
            }
        } catch (err) {
            log('Caught an error (but we ignore it) %O', err)
            return {}
        }
    }

    async do_analysis(position) {
        debug('Doing analysis %O', position)
        position.depth_goal = 11
        await this.uci.ucinewgame()
        await this.uci.setoption('MultiPV', position.multipv_goal || 2)
        await this.uci.sendCmd(`position fen ${position.fen}`)
        await this.uci.isready()
        const out = await this.uci.go({ depth: position.depth_goal || 40 })
        const good_ones = out.info.filter(record => record.score && record.depth && (record.depth % 5 == 0 || record.depth == position.depth_goal))
        // Prepare to add analysis
        const analysis = {
            fen: position.fen,
            engine_name: this.uci.id.name,
            depth: good_ones.reduce((acc, curr) => curr.depth > acc ? curr.depth : acc, 0),
            multipv: good_ones.reduce((acc, curr) => curr.multipv > acc ? curr.multipv : acc, 0),
            best_move: out.bestmove,
            nodes: Math.max(...good_ones.map(record => record.nodes || 0)),
            time: Math.max(...good_ones.map(record => record.time || 0)),
            steps: good_ones,
        }
        // Find the score for the bestmove
        analysis.score = out.info
            .filter(record => record.score) // they must have a score
            .find(record => record.pv.split(' ').reverse().pop() == out.bestmove) // they must match the bestmove
            .score.value
        return analysis
    }

    /**
     *
     * @param {String} fen
     */
    async reserve_position(fen) {
        debug('reserving position')
        const res = await http({
            path: '/position/status',
            expected_status_code: 200,
            method: 'PUT',
            body: {
                status: 1,
                fen: fen
            }
        })
        return res
    }

    /**
     * Sends an analysis to Resker
     * @param {Object} analysis
     * @throws Unexpected status code received from Resker
     */
    async store_analysis(analysis) {
        debug('Storing analysis')
        await http({
            method: 'post',
            path: '/position/analysis',
            body: analysis,
            expected_status_code: 200
        })
    }

    /**
     * Pause execution for a number of ms
     * @param {Number} ms - How many ms to sleep for
     */
    sleep(ms) {
        debug(`Sleeping ${ms}ms`)
        return new Promise(resolve => setTimeout(() => {
            debug('Finished sleeping')
            resolve()
        }, ms))
    }
}

module.exports = Stocto