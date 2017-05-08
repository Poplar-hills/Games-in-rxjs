import {Observable} from 'rxjs'
import {prop, last, equals, flip, contains, compose, multiply, length} from 'ramda'
import {collide, circulateMove} from './utils'
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

export function genFood$ (snake$, firstFoodPosition, randomPosition) {
  return snake$
    .map(last)
    .scan((prevFood, snakeHead) => {
      return collide(prevFood, snakeHead) ? randomPosition() : prevFood
    }, firstFoodPosition)
    .distinctUntilChanged()
    .share()    // food$ is also subscribed twice

  /*
  -----snake0[]--snake1[]--snake2[]--snake3[]----  snake$
                        map
  -----{x0,y0}---{x0,y1}---{x0,y2}---{x0,y3}-----  snakeHead$
                        scan
  -----{x0,y2}---{x0,y2}---{x4,y6}---{x4,y6}-----  food$
                 distinctUntilChanged       
  -----{x0,y2}-------------{x4,y6}---------------  food$ with unique elements
  */
}

export function genScoreboard$ (snake$, scoreValue) {
  return snake$
    .map(compose(multiply(scoreValue), length))
    .distinctUntilChanged()
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
