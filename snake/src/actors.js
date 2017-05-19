import {Observable} from 'rxjs'
import {prop, last, equals, flip, contains, compose, multiply, length, without, not} from 'ramda'
import {getCanvasCoords} from './init'
import {collide, circulateMove, randomFrom, toCoordObj} from './utils'
import * as c from './config'

const dot_r = c.dot_size / 2
const containedBy = flip(contains)
const circulateX = circulateMove(dot_r, 0, c.w)
const circulateY = circulateMove(dot_r, 0, c.h)

export function genDirection$ (keypress$, initDirection) {
  return keypress$
    .map(prop('keyCode'))
    .filter(containedBy([c.key_up, c.key_down, c.key_left, c.key_right]))
    .scan((prev, curr) => {
      const inSuccession = (...arr) => [prev, curr].every(containedBy(arr))
      return (inSuccession(c.key_left, c.key_right) || inSuccession(c.key_up, c.key_down)) ? prev : curr
    }, initDirection)
    .distinctUntilChanged()
}

export function genSnake$ (direction$, foodProxy$, firstFoodPosition) {
  return Observable.range(1, c.init_length)
    .map(i => ({x: c.w / 2 + i * c.dot_size, y: c.h / 2}))
    .toArray()
    .mergeMap(snake => Observable.interval(c.move_speed)
      .withLatestFrom(
        direction$, foodProxy$.startWith(firstFoodPosition),
        (i, direction, food) => ({direction, snake, food}))
      .scan(crawl, {snake, food: firstFoodPosition})
    )
    .map(prop('snake'))
    .share()    // snake$ needs to be 'hot' as it will be subscribed multiple times

  /*
  ----------0------------1------------2------------3---------  interval$
  R--------------U----------------------------L--------------  direction$
  f1--------f1------------------------f2---------------------  foodProxy$
                          withLatestFrom
  -------[0,R,f1]-----[1,U,f1]-----[2,U,f2]-----[3,L,f2]-----
                 withLatestFrom's project function 
  -----{R,snake,f1}-{U,snake,f1}-{U,snake,f2}-{L,snake,f2}---  direction and the sanke itself are the two things required for updating the snake's position
                              scan                             update each dot's position of the snake
  -------snake0[]-----snake1[]-----snake2[]-----snake3[]-----  snake$
  */
}

export function genFood$ (snake$, firstFoodPosition) {
  return snake$
    .scan((prevFood, snake) => {
      return collide(prevFood, last(snake)) ? nextPosition(snake) : prevFood
    }, firstFoodPosition)
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

function nextPosition (snake) {
  const canvasCoords = getCanvasCoords(c.w, c.h, c.dot_size)
  const snakeCoords = snake.map(dot => `${dot.x},${dot.y}`)
  const validCoords = without(snakeCoords, canvasCoords)
  return validCoords.length !== 0
    ? toCoordObj(randomFrom(validCoords))
    : null  // when there's no space for the next food -> the player has won
}

function moveDot ({x, y}, direction) {
  const validateMove = ({x, y}) => ({x: circulateX(x), y: circulateY(y)})
  const moveMap = {
    [c.key_up]:    {x, y: y - c.dot_size},
    [c.key_left]:  {x: x - c.dot_size, y},
    [c.key_down]:  {x, y: y + c.dot_size},
    [c.key_right]: {x: x + c.dot_size, y}
  }
  return validateMove(moveMap[direction])
}

function crawl (prev, curr) {
  const oldSnakeHead = last(prev.snake)
  const newSnakeHead = moveDot(oldSnakeHead, curr.direction)
  const hasCaughtFood = !equals(prev.food, curr.food)
  const newSnakeBody = hasCaughtFood ? prev.snake : prev.snake.slice(1)
  return {
    snake: newSnakeBody.concat(newSnakeHead),
    direction: curr.direction,
    food: curr.food
  }
}
