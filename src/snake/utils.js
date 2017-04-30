import {cond, gt, lt, always, T, identity} from 'ramda'

function circulate (max, value, r) {
  return cond([
    [lt(max), always(r)],   // return d/2 if greater than max
    [gt(0), always(max - r)],   // return max - d/2 if less than 0
    [T, identity]
  ])(value)
}

function randomBetween (min, max) {
  return ~~(Math.random() * (max - min + 1)) + min
}

function atSamePosition (dotA, dotB) {
  return dotA.x === dotB.x && dotA.y === dotB.y
}

export {circulate, randomBetween, atSamePosition}
