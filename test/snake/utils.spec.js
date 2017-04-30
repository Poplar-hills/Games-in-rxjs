import {expect} from 'chai'
import {circulateMove, randomBetween, hit} from '../../src/snake/utils.js'

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

  it('should generate a value within the range', () => {
    const randomValue = randomBetween(min, max)
    expect(randomValue).to.be.above(0)
    expect(randomValue).to.be.below(100)
  })

  it('should determine if two sets of coordinates are equal', () => {
    const c1 = {x: 4, y: 10}
    const c2 = {x: 4, y: 10}
    const result = hit(c1, c2)
    expect(result).to.be.true
  })

  it('should determine if two sets of coordinates are not equal', () => {
    const c1 = {x: 4, y: 10}
    const c2 = {x: 4, y: 20}
    const result = hit(c1, c2)
    expect(result).to.be.false
  })
})
