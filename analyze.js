const debug = require('debug')('stocto')
const path = require('path')
const http = require('./http')
const { Engine } = require('node-uci')
const uci = new Engine(path.join(__dirname, 'stockfish_10_x64'))
const Chess = require('chess.js').Chess
let chess = new Chess()
const os = require('os')


async function get_queued_position() {
    const log = debug.extend('get_queued_position')
    log('getting queued position')
    const res = await http({
        method: 'get',
        path: '/position/analysis/queue',
        expected_status_code: 200
    })
    try {
        log('res %O', res)
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
        return {}
    }

}

async function reserve_position(fen) {
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

async function store_analysis(analysis) {
    debug('Storing analysis')
    await http({
        method: 'post',
        path: '/position/analysis',
        body: analysis,
        expected_status_code: 200
    })
}



(async () => {
    console.log('[main] init')
    // preparations
    await uci.init()
    console.log('[main] engine id', uci.id)
    await uci.setoption('Skill Level', '20')
    await uci.setoption('Threads', os.cpus().length) // Use every core we have
    let position
    let analysis
    do {
        // get a queued position
        position = await get_queued_position()
        debug('Got position ' + position.fen)
        if (position.fen) {
            debug('Reserving position')
            await reserve_position(position.fen)
            analysis = await do_analysis(position)
            debug('Analysis %O', analysis)
            await store_analysis(analysis)
            debug('Success!')
        } else {
            debug('No position found')
        }
        await sleep(30000)

    } while (true)
})()

async function do_analysis(position) {
    debug('Doing analysis %O', position)
    await uci.ucinewgame()
    await uci.setoption('MultiPV', position.multipv_goal || 2)
    await uci.sendCmd(`position fen ${position.fen}`)
    await uci.isready()
    const out = await uci.go({ depth: position.depth_goal || 40 })
    const good_ones = out.info.filter(record => record.score && record.depth && (record.depth % 5 == 0 || record.depth == position.depth_goal))
    // Prepare to add analysis
    const analysis = {
        fen: position.fen,
        engine_name: uci.id.name,
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

function sleep(ms) {
    debug(`Sleeping ${ms}ms`)
    return new Promise(resolve => setTimeout(() => {
        debug('Finished sleeping')
        resolve()
    }, ms))
}

async function process_this_line(next_line) {
    chess = new Chess()
    await uci.ucinewgame()
    await uci.setoption('MultiPV', `${number_of_variations}`)
    await uci.setoption('Threads', number_of_threads)
    await uci.isready()
    debug('Doing %s', next_line)

    await uci.sendCmd(`position fen ${chess.fen()}`)
    await uci.isready()
    const res = await uci.go({ depth: depth_to_search_for })
    // find the 2 best moves
    const sorted_values = res.info
        .filter(line => line.depth == depth_to_search_for)
        .filter(line => line.score)
        .sort((a, b) => {
            return (b.score && b.score.value ? b.score.value : 0) - (a.score && a.score.value ? a.score.value : 0)
        })
    debug('Sorted lines %O', sorted_values)
    // Store the analysis
    const done_processing = db.get('done')
    done_processing[ next_line ] = {
        best_move: res.bestmove,
        lines: sorted_values.slice(0, number_of_variations),
        raw: sorted_values
    }
    await db.ready()
    db.set('done', done_processing)
    await uci.quit()
}
