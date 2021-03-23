const Step = require('./step')

describe('Step', () => {
    it('Valid step works', () => {
        expect(() => {
            new Step(make_step_object())
        }).not.toThrow()
    })

    it('Step with invalid PV throws', () => {
        expect(() => {
            new Step(make_step_object({ pv: '' }))
        }).toThrow(Step.error.PV_TOO_SMALL)
    })

    it('Step with invalid depth throws', () => {
        expect(() => {
            new Step(make_step_object({ depth: undefined }))
        }).toThrow(/value is not an integer or is too low/)
    })

    it('Step with invalid seldepth throws', () => {
        expect(() => {
            new Step(make_step_object({ seldepth: undefined }))
        }).toThrow(/value is not an integer or is too low/)
    })

    it('Step with invalid time throws', () => {
        expect(() => {
            new Step(make_step_object({ time: undefined }))
        }).toThrow(/value is not an integer or is too low/)
    })

    it('Step with invalid nps throws', () => {
        expect(() => {
            new Step(make_step_object({ nps: undefined }))
        }).toThrow(/value is not an integer or is too low/)
    })

    it('Step with invalid multipv throws', () => {
        expect(() => {
            new Step(make_step_object({ multipv: undefined }))
        }).toThrow(/value is not an integer or is too low/)
    })

    it('Step with invalid score throws', () => {
        expect.assertions(3)

        expect(() => {
            new Step(make_step_object({ score: undefined }))
        }).toThrow()

        expect(() => {
            new Step(make_step_object({ score: { value: 5 } }))
        }).toThrow()

        expect(() => {
            new Step(make_step_object({ score: { unit: 'cp' } }))
        }).toThrow()
    })

    it('Getters and setters work', () => {
        const step_param = make_step_object()
        const step = new Step(step_param)
        expect.assertions(8)

        expect(step.depth).toEqual(step_param.depth)
        expect(step.seldepth).toEqual(step_param.seldepth)
        expect(step.time).toEqual(step_param.time)
        expect(step.nps).toEqual(step_param.nps)
        expect(step.multipv).toEqual(step_param.multipv)
        expect(step.pv).toEqual(step_param.pv)
        expect(step.score.unit).toEqual(step_param.score.unit)
        expect(step.score.value).toEqual(step_param.score.value)
    })
})


function make_step_object(param) {
    const init = {
        depth: 5,
        seldepth: 5,
        time: 5,
        nps: 5,
        score: { unit: 'cp', value: 5 },
        multipv: 5,
        pv: 'd2d4 d7d5 g1f3 g8f6'
    }
    return Object.assign({}, init, param)
}