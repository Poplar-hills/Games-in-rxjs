import {cond, gt, lt, always, T, identity} from 'ramda'

export const circulateMove = (offset, min, max) => cond([
  [lt(max), always(offset)],
  [gt(0), always(max - offset)],
  [T, identity]
])

export const randomBetween = (min, max, step = 1) => {
  return ~~(Math.random() * ((max - min) / step + 1)) * step + min
}

export const randomFrom = candidates => {
  const randomIndex = randomBetween(0, candidates.length - 1)
  return candidates[randomIndex]
}

export const collide = (dotA, dotB) => {
  return dotA.x === dotB.x && dotA.y === dotB.y
}

export const toCoordObj = str => {
  const coords = str.split(',')
  return {x: +coords[0], y: +coords[1]}
}
