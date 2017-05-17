import {memoize} from 'ramda'
import * as c from './config'

export const getCanvasCoords = memoize((w, h, dot_size) => {
  const calcPoint = _ => _ * dot_size + dot_size / 2
  const xCount = w / dot_size
  const yCount = h / dot_size
  const result = []

  for (let i = 0; i < xCount; i++) {
    for (let j = 0; j < yCount; j++) {
      const x = calcPoint(i)
      const y = calcPoint(j)
      result.push(`${x},${y}`)
    }
  }

  return result
})

export default function init () {
  getCanvasCoords(c.w, c.y, c.dot_size)
}