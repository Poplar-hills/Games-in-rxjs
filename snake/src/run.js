import {Observable, Subject} from 'rxjs'
import {compose, prop, not, last} from 'ramda'
import {randomBetween, collide} from './utils'
import {renderGame, renderScene} from './renderer'
import {genDirection$, genSnake$, genFood$, genScoreboard$} from './actors'
import * as c from './config'

export default function run () {
  const firstFoodPosition = randomPosition()
  const foodProxy$ = new Subject()   // food$ and snake$ forms a circular dependency, use subject to solve
  const keypress$ = Observable.fromEvent(document, 'keypress').sampleTime(c.move_speed)
  const direction$ = genDirection$(keypress$, c.init_direction)
  const snake$ = genSnake$(direction$, foodProxy$, firstFoodPosition)
  const food$ = genFood$(snake$, firstFoodPosition)
  const scoreboard$ = genScoreboard$(snake$, c.score_value)
  
  const foodSub = food$.subscribe(food => foodProxy$.next(food))  // feed back each value of food$ into foodProxy$ to make snake$
  const gameSub = Observable.combineLatest(
      snake$, food$, scoreboard$,
      (snake, food, scoreboard) => {
        let status = ''
        if (isDead(snake)) status = 'defeated'
        if (!food) status = 'victorious'
        return {snake, food, scoreboard, status}
      }
    )
    .do(compose(renderScene, prop('status')))
    .takeWhile(compose(not, prop('status')))
    .subscribe(renderGame, null, () => {
      cleanUp(foodSub, gameSub)
      run()
    })
}

function randomPosition () {
  const dot_r = c.dot_size / 2
  const genCoord = max => randomBetween(dot_r, max - dot_r, c.dot_size)
  return {
    x: genCoord(c.w),
    y: genCoord(c.h),
  }
}

function isDead (snake) {
  const snakeHead = last(snake)
  const snakeBody = snake.slice(0, snake.length - 4)  // the first 4 dots of the snake cannot be bitten by the snake head
  return snakeBody.some(bodyDot => collide(bodyDot, snakeHead))
}

function cleanUp (...subscriptions) {
  subscriptions.forEach(sub => {
    sub.unsubscribe()
  })
}
