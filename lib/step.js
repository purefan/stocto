
/**
 * One of the steps in an analysis
 */
class Step {
    static error = {
        PV_TOO_SMALL: 'PV is too small or not defined'
        , SCORE_IS_INVALID: 'Score is invalid'
        , SCORE_LACKS_VALUE: 'Score is missing a value'
        , SCORE_LACKS_UNIT: 'Score lacks unit'
    }

    /**
     *
     * @param {Object} [param]
     * @param {Number} param.depth
     * @param {Number} param.seldepth
     * @param {Number} param.nps
     * @param {Number} param.time
     * @param {Object} param.score
     * @param {Number} param.score.value
     * @param {String} param.score.unit
     * @param {Number} param.multipv
     * @param {String} param.pv
     *
     */
    constructor(param) {

        this.is_valid = false
        this.data = {}

        if (!!param) {
            this.depth = param.depth
            this.seldepth = param.seldepth
            this.time = param.time
            this.nps = param.nps
            this.score = param.score
            this.multipv = param.multipv
            this.pv = param.pv
        }

        return new Proxy(this, {
            get: (object, key) => {
                if (object.data[ key ]) {
                    return object.data[ key ]
                }
            }
        })
    }

    set depth(depth) {
        this.data.depth = this.assert_is_positive_integer(depth)
    }

    set seldepth(seldepth) {
        this.data.seldepth = this.assert_is_positive_integer(seldepth)
    }

    set time(time) {
        this.data.time = this.assert_is_positive_integer(time)
    }

    set nps(nps) {
        this.data.nps = this.assert_is_positive_integer(nps)
    }

    set score(score) {
        if (!score) {
            throw new Error(Step.error.SCORE_IS_INVALID)
        }
        if (!score.value) {
            throw new Error(Step.error.SCORE_LACKS_VALUE)
        }
        if (!score.unit) {
            throw new Error(Step.error.SCORE_LACKS_UNIT)
        }
        this.data.score = score
    }

    set multipv(multipv) {
        this.data.multipv = this.assert_is_positive_integer(multipv)
    }

    set pv(pv) {
        if (!pv || pv.length < 4) {
            throw new Error(Step.error.PV_TOO_SMALL)
        }
        this.data.pv = pv
    }

    assert_is_positive_integer(value) {
        if (!Number.isInteger(value) || value < 1) {
            throw new Error(`value is not an integer or is too low: "${value}"`)
        }
        return value
    }

}

/*
    {"depth":36,"currmove":"a5a2","currmovenumber":38},
    {
        "depth":40,
        "seldepth":45,
        "time":3748340,
        "nodes":17267516036,
        "hashfull":1000,
        "nps":4606710,
        "tbhits":0,
        "score":{"unit":"cp","value":-157},
        "multipv":1,
        "pv":"b8d7 c3e2 b4e7 a2a3 d7b6 c4d3 a5h5 d1b3 h5h6 a3a4 b6d7 a4a5 e8g8 e2g3 a8b8 d3c4 g8h8 f1d1 f8d8 h2h4 d8g8 b3c3 h6g7 c3e3 e6e5 c4e2 e5d4 d1d4 e7c5"},{"depth":40,"seldepth":47,"time":3748340,"nodes":17267516036,"hashfull":1000,"nps":4606710,"tbhits":0,"score":{"unit":"cp","value":-195},"multipv":2,"pv":"a5h5 d1b3 a7a5 c3e2 b8d7 e2g3 h5g6 b3e3 h7h5 g3f5 d7b6 c4d3 e8f8 f5h4 g6h6 e3e2 b4e7 a1d1 f6f5 e2c2 f5e4 d3e4 b6d5 f1e1 e7f6 e4d5 e6d5 e1e3 c8g4 d1e1 f8g7 h2h3 f6h4 f3h4 h6f6 h4f3 g4f3 e3f3 f6d4"},{"depth":40,"seldepth":48,"time":3748340,"nodes":17267516036,"hashfull":1000,"nps":4606710,"tbhits":0,"score":{"unit":"cp","value":-217},"multipv":3,"pv":"h8g8 d4d5 b4c3 b2c3 c6d5 e4d5 e6e5 d1d3 g8g7 f3h4 e8f8 d3f3 c8g4 f3f6 b8d7 f6d6 f8g8 f2f3 a5b6 d6b6 d7b6 c4d3 g4d7 c3c4 g8f8 f1c1 a8c8 a1b1 g7g5 g2g3 c8c7 c1c2 f8g7 h4g2 d7f5 d3f5 g5f5 g2h4"},{"depth":40,"seldepth":47,"time":3748340,"nodes":17267516036,"hashfull":1000,"nps":4606710,"tbhits":0,"score":{"unit":"cp","value":-233},"multipv":4,"pv":"e8g8 e4e5 b8d7 d1c1 g8g7 c1f4 a5d8 a1e1 b4c3 b2c3 g7h8 e1e3 f8g8 e5f6 d8f6 f4c7 f6g7 f3e1 d7f8 g2g3 f8g6 e1d3 g8f8 d3f4 g6f4 c7f4 b7b5 c4b3 a7a5 e3e5 f7f6 e5h5 c8d7 b3c2 f6f5 h5h6 f8f6 h6f6 g7f6 f4c7"},{"depth":40,"seldepth":49,"time":3748340,"nodes":17267516036,"hashfull":1000,"nps":4606710,"tbhits":0,"score":{"unit":"cp","value":-238},"multipv":5,"pv":"a5d8 d1d2 b8d7 a1d1 h8g8 a2a3 b4c3 d2c3 e8f8 c4b3 f8g7 f1e1 d7f8 h2h4 c8d7 g2g3 d8e7 b3a2 h7h6 g1g2 a7a5 f3d2 f8g6 d2c4 b7b5 c4a5 e6e5 a5c6 d7c6 c3c6 e5d4"}],
        "ponder":"c3e2"
    }
*/

module.exports = Step