import {Observable, Subject} from 'rxjs'
import {prop, last, equals, flip, contains} from 'ramda'
import {circulateMove, randomBetween, hit} from './utils.js'
import {renderSence, renderGameText} from './renderer.js'
import * as c from './config.js'

const containedBy = flip(contains)
const circulateX = circulateMove(c.dot_size / 2, 0, c.w)
const circulateY = circulateMove(c.dot_size / 2, 0, c.h)
const firstFoodPosition = randomPosition()
const foodProxy$ = new Subject()   // food$ and snake$ forms a circular dependency, use subject to solve

const direction$ = Observable.fromEvent(document, 'keypress')
  .sampleTime(c.move_speed) // prevent the sanke from reversing its direction caused by pressing R->T->L very fast (faster than the move_speed)
  .map(prop('keyCode'))
  .filter(containedBy([c.key_up, c.key_down, c.key_left, c.key_right]))
  .scan((prev, curr) => {
    const inSuccession = (...arr) => [prev, curr].every(containedBy(arr))
    return (inSuccession(c.key_left, c.key_right) || inSuccession(c.key_up, c.key_down)) ? prev : curr
  }, c.init_direction)
  .distinctUntilChanged()

/*
----U----L----L----R----D----U----R----  keypress$
                 scan                    snake cannot reverse its direction (L->R, R->L, U->D or D->U)
----U----L----L----L----D----D----R----
         distinctUntilChanged
----U----L--------------D---------R----
*/

const snake$ = Observable.range(1, c.init_length)
  .map(i => ({x: c.w / 2 + i * c.dot_size, y: c.h / 2}))
  .toArray()
  .mergeMap(snake => Observable.interval(c.move_speed)
    .withLatestFrom(
      direction$, foodProxy$.startWith(firstFoodPosition),
      (i, direction, food) => ({direction, snake, food}))
    .scan(crawl, {snake, food: firstFoodPosition})
  )
  .map(prop('snake'))
  .share()    // snake$ needs to be 'hot' as it is subscribed twice

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

const food$ = snake$
  .map(last)
  .scan((prevFood, snakeHead) => {
    return hit(prevFood, snakeHead) ? randomPosition() : prevFood
  }, firstFoodPosition)
  .distinctUntilChanged()
  .share()    // food$ is also subscribed twice

const foodSubscription = food$.subscribe(food => foodProxy$.next(food))  // feed back each value of food$ into foodProxy$ to make snake$

/*
-----snake0[]--snake1[]--snake2[]--snake3[]----  snake$
                      map
-----{x0,y0}---{x0,y1}---{x0,y2}---{x0,y3}-----  snakeHead$
                      scan
-----{x0,y2}---{x0,y2}---{x4,y6}---{x4,y6}-----  food$
               distinctUntilChanged       
-----{x0,y2}-------------{x4,y6}---------------  food$ with unique elements
*/

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

const gameSubscription = Observable.combineLatest(
    snake$, food$,
    (snake, food) => ({snake, food})
  )
  .takeWhile(({snake}) => !isGameOver(snake))
  .subscribe(renderSence, null, () => {
    renderGameText('GAME OVER', '#FF6946')
    cleanUp()
  })

function randomPosition () {
  const randomCoordinate = max => randomBetween(1, max) * c.dot_size - c.dot_size / 2
  return {
    x: randomCoordinate(c.w / c.dot_size - 1),
    y: randomCoordinate(c.h / c.dot_size - 1)
  }
}

function moveDot ({x, y}, direction) {
  const validateMove = ({x, y}) => ({x: circulateX(x), y: circulateY(y)})
  const moveMap = {
    [c.key_left]:  {x: x - c.dot_size, y},
    [c.key_right]: {x: x + c.dot_size, y},
    [c.key_up]:    {x, y: y - c.dot_size},
    [c.key_down]:  {x, y: y + c.dot_size}  
  }
  return validateMove(moveMap[direction])
}

function isGameOver (snake) {
  const snakeHead = last(snake)
  const snakeBody = snake.slice(0, snake.length - 4)  // the first 4 dots of the snake cannot be bitten by the snake head
  return snakeBody.some(bodyDot => hit(bodyDot, snakeHead))
}

function cleanUp () {
  gameSubscription.unsubscribe()
  foodSubscription.unsubscribe()
}
