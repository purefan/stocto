const debug = require('debug')('stocto:analyze')
const path = require('path')
const { Engine } = require('node-uci')
const uci = new Engine(path.join(__dirname, 'bin', 'stockfish_10_x64'))
const os = require('os')
const fs = require('fs')
const Stocto = require('./lib/stocto')
const stocto = new Stocto({ uci })

async function run() {
    console.log('[main] init')
    // preparations
    await stocto.uci.init()
    debug('[main] engine id', stocto.uci.id)
    await stocto.uci.setoption('Skill Level', '20')
    await stocto.uci.setoption('Threads', os.cpus().length) // Use every core we have
    let position
    let analysis
    do {
        try {
            // get a queued position
            position = await stocto.get_queued_position()
            debug('Got position ' + position.fen)
            if (position.fen) {
                debug('Reserving position')
                await stocto.reserve_position(position.fen)
                analysis = await stocto.do_analysis(position)
                debug('Partial analysis %O', { fen: analysis.fen, depth: analysis.depth, multipv: analysis.multipv, best_move: analysis.best_move })
                await stocto.store_analysis(analysis)
                debug('Success!')
            } else {
                debug('No position found')
            }

        } catch (error) {
            if (error.toString().includes('socket hang up')) {
                debug('[Error] cannot connect to Resker')
            } else {
                debug('[Error]', error)
            }
        }
        finally {
            debug('Sleeping for 30 secods at ', new Date())
            await stocto.sleep(30000)
        }
    } while (!fs.existsSync('./stop'))
    debug('Nothing left to do')
    stocto.uci.quit()
}
run()
