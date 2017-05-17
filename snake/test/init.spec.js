import test from 'ava'
import {getCanvasCoords} from '../src/init.js'

test('getCanvasCoords should return a map of coordinates for given canvas dimensions', t => {
  const canvasWidth = 20
  const canvasHeight = 30
  const dot_size = 10
  const result = getCanvasCoords(canvasWidth, canvasHeight, dot_size)
  const expected = ['5,5', '5,15', '5,25', '15,5', '15,15', '15,25']
  t.deepEqual(result, expected)
})

test('getCanvasCoords should always memorize the result after the first invocation', t => {
  const canvasWidth = 30
  const canvasHeight = 20
  const dot_size = 10
  const result1 = getCanvasCoords(canvasWidth, canvasHeight, dot_size)
  const result2 = getCanvasCoords(canvasWidth, canvasHeight, dot_size)
  t.is(result1, result2)
})