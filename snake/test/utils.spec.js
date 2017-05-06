import test from 'ava'
import {circulateMove, randomBetween, collide} from '../src/utils.js'

const min = 0
const max = 100
const offset = 5

test('should be moved to the left side of the map', t => {
  const initPos = 105
  const resultPos = circulateMove(offset, min, max)(initPos)
  t.is(resultPos, 5)
})

test('should be moved to the right side of the map', t => {
  const initPos = -5
  const resultPos = circulateMove(offset, min, max)(initPos)
  t.is(resultPos, 95)
})

test('should stay where it is', t => {
  const initPos = 40
  const resultPos = circulateMove(offset, min, max)(initPos)
  t.is(resultPos, 40)
})

test('should determine if two objects collide', t => {
  const c1 = {x: 4, y: 10}
  const c2 = {x: 4, y: 10}
  const result = collide(c1, c2)
  t.true(result)
})

test('should determine if two objects collide', t => {
  const c1 = {x: 4, y: 10}
  const c2 = {x: 4, y: 20}
  const result = collide(c1, c2)
  t.false(result)
})
