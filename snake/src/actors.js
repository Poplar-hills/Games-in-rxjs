import {Observable} from 'rxjs'
import {prop, last, flip, contains, compose, multiply, length, without, not, merge} from 'ramda'
import {getCanvasCoordStrs} from './init'
import {collide, circulateMove, randomFrom, toCoordObj} from './utils'
import * as config from './config'

const containedBy = flip(contains)

export function genDirection$ (keypress$, initDirection, c = config) {
  return keypress$
    .map(prop('keyCode'))
    .filter(containedBy([c.key_up, c.key_down, c.key_left, c.key_right]))
    .scan((prev, curr) => {
      const inSeries = (...keys) => [prev, curr].every(containedBy(keys))
      const invalidPress = inSeries(c.key_left, c.key_right) || inSeries(c.key_up, c.key_down)
      return invalidPress ? prev : curr
    }, initDirection)
    .distinctUntilChanged()
}

/**
  In foodProxy$.startWith({}), {} only serves as an initial food to activate snake$, it'll be ignored in the slither function as the initial snake doesn't depend on the position of food.
*/
export function genSnake$ (direction$, foodProxy$, c = config, scheduler) {
  return Observable.range(0, c.init_length)
    .map(i => ({
      x: c.w / 2 + i * c.dot_size,
      y: c.h / 2,
      color: c.init_snake_color
    }))
    .toArray()
    .mergeMap(snake => Observable.interval(c.snake_speed, scheduler)
      .withLatestFrom(
        direction$, foodProxy$.startWith({}),
        (i, direction, food) => ({direction, snake, food, i}))
      .scan(slither(c)))
    .map(prop('snake'))
    .share()
}

export function genFood$ (snake$, c = config) {
  const initialFood$ = snake$
    .first()
    .map(snake => genNextFood(snake, c.init_snake_color))

  return initialFood$
    .merge(snake$.skip(1))
    .scan((prevFood, snake) => collide(prevFood, last(snake))
      ? genNextFood(snake, prevFood.color)
      : prevFood)
    .distinctUntilChanged()
    .share()
}

export function genScoreboard$ (snake$, scoreValue) {
  return snake$
    .map(compose(multiply(scoreValue), length))
    .distinctUntilChanged()
}

export function genGame$ (snake$, food$, scoreboard$) {
  return snake$.withLatestFrom(food$, scoreboard$, addGameStatus)
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
  const edibleSnakeBody = snake.slice(0, snake.length - 4)  // the snake head cannot reach the first 4 dots
  return edibleSnakeBody.some(dot => collide(dot, snakeHead))
}

/**
  If there's no room for the next food on the canvas, food$ will emit null, and that's when the player wins.
*/
function genNextFood (snake, prevFoodColor, c = config) {
  const canvasCoordStrs = getCanvasCoordStrs(c.w, c.h, c.dot_size)
  if (snake.length === canvasCoordStrs.length) return null
  const snakeCoordStrs = snake.map(dot => `${dot.x},${dot.y}`)
  const validCoordStrs = without(snakeCoordStrs, canvasCoordStrs)
  const nextFoodCoord = toCoordObj(randomFrom(validCoordStrs))
  return merge(nextFoodCoord, {color: changeColor(prevFoodColor)})
}

function changeColor (prevFoodColor) {
  return randomFrom(without(prevFoodColor, config.colors))
}

function moveDot (c) {
  const dot_r = c.dot_size / 2
  const circulateX = circulateMove(dot_r, 0, c.w)
  const circulateY = circulateMove(dot_r, 0, c.h)
  return ({x, y, color}, direction) => {
    const validateMove = ({x, y}) => ({x: circulateX(x), y: circulateY(y)})
    const moveMap = {
      [c.key_up]:    {x, y: y - c.dot_size},
      [c.key_left]:  {x: x - c.dot_size, y},
      [c.key_down]:  {x, y: y + c.dot_size},
      [c.key_right]: {x: x + c.dot_size, y}
    }
    const newCoord = validateMove(moveMap[direction])
    return merge(newCoord, {color})  // the color does not change
  }
}

/**
  As food$ reacts to snake$, food$ emits slightly later than $snake, and $snake emits a new value after the execution of this slither function, so the new food can only be accessed in the next execution of slither and that's when prev.food !== curr.food happens.
*/
function slither (c) {
  const moveHead = moveDot(c)
  return (prev, curr, i) => {
    const setFoodColorOn = dot => { dot.color = prev.food.color }
    const isInitialSnake = i === 0
    const prevSnakeHead = last(prev.snake)
    const prevSnakeBody = prev.snake.slice(1)
    const currSnakeHead = moveHead(prevSnakeHead, curr.direction)
    let currSnakeBody = null

    if (isInitialSnake) {
      currSnakeBody = prevSnakeBody
    } else {
      const hasReachedFood = collide(currSnakeHead, prev.food)  // snake's head overlaps the food
      const hasEatenFood = prev.food !== curr.food
      if (hasReachedFood) setFoodColorOn(currSnakeHead)
      currSnakeBody = hasEatenFood ? prev.snake : prevSnakeBody
    }

    return {
      snake: currSnakeBody.concat(currSnakeHead),
      direction: curr.direction,
      food: curr.food
    }
  }
}
