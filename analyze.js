const debug = require('debug')('stocto:analyze')
const path = require('path')
const settings = require('./package.json').settings
const { Engine } = require('node-uci')
const uci = new Engine(path.join(__dirname, 'bin', settings.stockfish_exec))
const os = require('os')
const fs = require('fs')
const Stocto = require('./lib/stocto')
const stocto = new Stocto({ uci })

let stop_now = false

process.on('SIGINT', () => {
    console.log('Stopping, heard SIGINT')
    setTimeout(() => {
        console.log('Now setting stop_now to true')
        stop_now = true
    }, 10000)

})

/**
 * @todo Store analysis and re-try if fail to POST
 * @todo Websocket and stream progress engine
 */
async function run() {
    debug('[main] init')
    debug('Resker host: ' + process.env.RESKER_HOST)

    if (!process.env.X_API_KEY || process.env.X_API_KEY.length < 8) {
        throw new Error('API KEY is too short or invalid')
    }
    // preparations
    debug('going to run init')
    await stocto.uci.init()
    debug('[main] engine id', stocto.uci.id)
    await stocto.uci.setoption('Skill Level', '20')
    debug('Skill level set')
    await stocto.uci.setoption('Threads', os.cpus().length) // Use every core we have
    debug('Threads set to ' + os.cpus().length)
    let position
    let analysis
    let stored_analysis
    debug('Stop_now is ' + (stop_now == true ? 'true' : 'false)'))

    while (stop_now != true) {
        try {
            debug('Trying')
            stored_analysis = stocto.pop_local_analysis()
            if (stored_analysis) {
                debug('There is a stored analysis')
                await stocto.store_analysis_in_resker(stored_analysis)
            }
            // get a queued position
            position = await stocto.get_queued_position()
            if (!position.fen && position.id) {
                position.fen = position.id
            }
            if (!position.fen && position._id) {
                position.fen = position._id
            }

            debug('Got position ' + position.fen)

            if (position.fen) {
                debug('Reserving position')
                await stocto.reserve_position(position.fen)
                analysis = await stocto.do_analysis(position)
                debug('Partial analysis %O', { fen: analysis.fen, depth: analysis.depth, multipv: analysis.multipv, best_move: analysis.best_move })
                await stocto.store_analysis_in_resker(analysis)
                debug('Success!')
            } else {
                debug('No position found', position)
            }

        } catch (error) {
            if (error.toString().includes('socket hang up')) {
                debug('[Error] cannot connect to Resker')
            } else {
                debug('[Error]', error)
            }
        }
        finally {
            debug('Sleeping for 15 secods at ', new Date())
            if (fs.existsSync('./stop')) {
                debug('Setting stop = true before sleeping')
                stop_now = true
            }
            await stocto.sleep(15000)
        }
    }
    debug('Nothing left to do')
    try {
        await stocto.uci.quit()
        debug('Stopped uci')
    } catch (error) {
        debug('Something failed but uci should be stopped now')
    } finally {
        debug('Ending.')
    }
}
run()
