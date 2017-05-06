import {Observable, Subject} from 'rxjs'
import {last} from 'ramda'
import {randomBetween, collide} from './utils'
import {renderGame, renderScene} from './renderer'
import {genDirection$, genSnake$, genFood$, genScoreboard$} from './actors'
import * as c from './config'

const dot_r = c.dot_size / 2

export default function run () {
  const firstFoodPosition = randomPosition()
  const foodProxy$ = new Subject()   // food$ and snake$ forms a circular dependency, use subject to solve
  const keypress$ = Observable.fromEvent(document, 'keypress')
  const direction$ = genDirection$(keypress$)
  const snake$ = genSnake$(direction$, foodProxy$, firstFoodPosition)
  const food$ = genFood$(snake$, firstFoodPosition, randomPosition)
  const scoreboard$ = genScoreboard$(snake$)
  
  const foodSub = food$.subscribe(food => foodProxy$.next(food))  // feed back each value of food$ into foodProxy$ to make snake$
  const gameSub = Observable.combineLatest(
      snake$, food$, scoreboard$,
      (snake, food, scoreboard) => ({snake, food, scoreboard})
    )
    .takeWhile(({snake}) => !isGameOver(snake))
    .subscribe(renderGame, null, () => {
      renderScene('ending')
      cleanUp(foodSub, gameSub)
      run()
    })
}

function randomPosition () {
  const randomCoordinate = max => randomBetween(1, max) * c.dot_size - dot_r
  return {
    x: randomCoordinate(c.w / c.dot_size - 1),
    y: randomCoordinate(c.h / c.dot_size - 1)
  }
}

function isGameOver (snake) {
  const snakeHead = last(snake)
  const snakeBody = snake.slice(0, snake.length - 4)  // the first 4 dots of the snake cannot be bitten by the snake head
  return snakeBody.some(bodyDot => collide(bodyDot, snakeHead))
}

function cleanUp (...subscriptions) {
  subscriptions.forEach(sub => {
    sub.unsubscribe()
  })
}
