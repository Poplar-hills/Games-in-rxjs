import {cond, gt, lt, always, T, identity} from 'ramda'

const circulateMove = (offset, min, max) => cond([
  [lt(max), always(offset)],
  [gt(0), always(max - offset)],
  [T, identity]
])

const randomBetween = (min, max) => {
  return ~~(Math.random() * (max - min + 1)) + min
}

const collide = (dotA, dotB) => {
  return dotA.x === dotB.x && dotA.y === dotB.y
}

export {circulateMove, randomBetween, collide}
