import {expect} from 'chai'
import {circulateMove, randomBetween, collide} from '../src/utils.js'

describe('Utils', () => {
  const min = 0
  const max = 100
  const offset = 5

  it('should be moved to the left side of the map', () => {
    const initPos = 105
    const resultPos = circulateMove(offset, min, max)(initPos)
    expect(resultPos).to.equal(5)
  })

  it('should be moved to the right side of the map', () => {
    const initPos = -5
    const resultPos = circulateMove(offset, min, max)(initPos)
    expect(resultPos).to.equal(95)
  })

  it('should stay where it is', () => {
    const initPos = 40
    const resultPos = circulateMove(offset, min, max)(initPos)
    expect(resultPos).to.equal(40)
  })

  it('should determine if two objects collide', () => {
    const c1 = {x: 4, y: 10}
    const c2 = {x: 4, y: 10}
    const result = collide(c1, c2)
    expect(result).to.be.true
  })

  it('should determine if two objects collide', () => {
    const c1 = {x: 4, y: 10}
    const c2 = {x: 4, y: 20}
    const result = collide(c1, c2)
    expect(result).to.be.false
  })
})
