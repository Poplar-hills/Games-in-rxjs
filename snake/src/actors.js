import {Observable} from 'rxjs'
import {prop, last, equals, flip, contains, compose, multiply, length, without, not} from 'ramda'
import {getCanvasCoords} from './init'
import {collide, circulateMove, randomFrom, toCoordObj} from './utils'
import * as config from './config'

const containedBy = flip(contains)

export function genDirection$ (keypress$, initDirection, c = config) {
  return keypress$
    .map(prop('keyCode'))
    .filter(containedBy([c.key_up, c.key_down, c.key_left, c.key_right]))
    .scan((prev, curr) => {
      const inSuccession = (...keys) => [prev, curr].every(containedBy(keys))
      return (inSuccession(c.key_left, c.key_right) || inSuccession(c.key_up, c.key_down)) ? prev : curr
    }, initDirection)
    .distinctUntilChanged()
}

export function genSnake$ (direction$, foodProxy$, firstFood, c = config, scheduler) {
  return Observable.range(0, c.init_length)
    .map(i => ({x: c.w / 2 + i * c.dot_size, y: c.h / 2}))
    .toArray()
    .mergeMap(snake => Observable.interval(c.move_speed, scheduler)
      .withLatestFrom(
        direction$, foodProxy$.startWith(firstFood),
        (i, direction, food) => ({direction, snake, food}))
      .scan(slither(c))
    )
    .map(prop('snake'))
    .share()
}

export function genFood$ (snake$, firstFood) {
  return snake$
    .scan((prevFood, snake) => {
      return collide(prevFood, last(snake)) ? nextPosition(snake) : prevFood
    }, firstFood)
    .distinctUntilChanged()
    .share()
}

export function genScoreboard$ (snake$, scoreValue) {
  return snake$
    .map(compose(multiply(scoreValue), length))
    .distinctUntilChanged()
}

export function genGame$ (snake$, food$, scoreboard$) {
  return Observable.combineLatest(snake$, food$, scoreboard$, addGameStatus)
    .takeWhile(compose(not, prop('isGameOver')))
}

function addGameStatus (snake, food, scoreboard) {
  const hasLost = isDead(snake)
  const hasWon = !food
  const isGameOver = hasLost || hasWon
  return {snake, food, scoreboard, isGameOver}
}

function isDead (snake) {
  const snakeHead = last(snake)
  const snakeBody = snake.slice(0, snake.length - 4)  // the first 4 dots of the snake cannot be bitten by the snake head
  return snakeBody.some(bodyDot => collide(bodyDot, snakeHead))
}

function nextPosition (snake, c = config) {
  const canvasCoords = getCanvasCoords(c.w, c.h, c.dot_size)
  const snakeCoords = snake.map(dot => `${dot.x},${dot.y}`)
  const validCoords = without(snakeCoords, canvasCoords)
  return validCoords.length !== 0
    ? toCoordObj(randomFrom(validCoords))
    : null  // when there's no space for the next food -> the player has won
}

function moveDot (c) {
  const dot_r = c.dot_size / 2
  const circulateX = circulateMove(dot_r, 0, c.w)
  const circulateY = circulateMove(dot_r, 0, c.h)
  return ({x, y}, direction) => {
    const validateMove = ({x, y}) => ({x: circulateX(x), y: circulateY(y)})
    const moveMap = {
      [c.key_up]:    {x, y: y - c.dot_size},
      [c.key_left]:  {x: x - c.dot_size, y},
      [c.key_down]:  {x, y: y + c.dot_size},
      [c.key_right]: {x: x + c.dot_size, y}
    }
    return validateMove(moveMap[direction])
  }
}

function slither (c) {
  const moveHead = moveDot(c)
  return (prev, curr) => {
    const prevSnakeHead = last(prev.snake)
    const currSnakeHead = moveHead(prevSnakeHead, curr.direction)
    const hasCaughtFood = !equals(prev.food, curr.food)   // not equal means the previous food has been eaten
    const currSnakeBody = hasCaughtFood ? prev.snake : prev.snake.slice(1)
    return {
      snake: currSnakeBody.concat(currSnakeHead),
      direction: curr.direction,
      food: curr.food
    }
  }
}
