import test from 'ava'
import {circulateMove, randomBetween, collide, toCoordObj} from '../src/utils.js'

const min = 0
const max = 100
const offset = 5

test('circulateMove should return min + offset when the input < the max', t => {
  const input = 105
  const resultPos = circulateMove(offset, min, max)(input)
  t.is(resultPos, min + offset)
})

test('circulateMove should return max - offset when the min < the input', t => {
  const input = -5
  const resultPos = circulateMove(offset, min, max)(input)
  t.is(resultPos, max - offset)
})

test('circulateMove should return the same value as the input when the min < the input < the max', t => {
  const input = 40
  const resultPos = circulateMove(offset, min, max)(input)
  t.is(resultPos, input)
})

test('collide should return true if the two sets of coordinates are the same', t => {
  const c1 = {x: 4, y: 10}
  const c2 = {x: 4, y: 10}
  const result = collide(c1, c2)
  t.true(result)
})

test('collide should return false if the two sets of coordinates are not the same', t => {
  const c1 = {x: 4, y: 10}
  const c2 = {x: 4, y: 20}
  const result = collide(c1, c2)
  t.false(result)
})

test('toCoordObj should convert a comma-separated string to an object with keys of "x" and "y" ', t => {
  const str = '40,20'
  const result = toCoordObj(str)
  const expected = {x: 40, y: 20}
  t.deepEqual(result, expected)
})
