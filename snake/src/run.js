import {Observable, Subject} from 'rxjs'
import {randomBetween, randomFrom} from './utils'
import {renderGame, renderScene} from './renderer'
import {genDirection$, genSnake$, genFood$, genScoreboard$, genGame$} from './actors'
import {without} from 'ramda'
import * as c from './config'

export default function run () {
  const firstFood = genFirstFood()
  const foodProxy$ = new Subject()   // food$ and snake$ forms a circular dependency, use subject to solve
  const keypress$ = Observable.fromEvent(document, 'keypress').sampleTime(c.move_speed)
  const direction$ = genDirection$(keypress$, c.init_direction)
  const snake$ = genSnake$(direction$, foodProxy$, firstFood)
  const food$ = genFood$(snake$, firstFood)
  const scoreboard$ = genScoreboard$(snake$, c.score_value)
  const game$ = genGame$(snake$, food$, scoreboard$)

  const foodSub = food$.subscribe(food => foodProxy$.next(food))  // feed back each value of food$ into foodProxy$ to make snake$
  const gameSub = game$.subscribe(renderGame, null, () => {
    renderScene('ending')
    cleanUp(foodSub, gameSub)
    run()
  })
}

function genFirstFood () {  // TODO: very similar with genNextFood in actors.js
  const dot_r = c.dot_size / 2
  const genCoord = max => randomBetween(dot_r, max - dot_r, c.dot_size)
  return {
    x: genCoord(c.w),
    y: genCoord(c.h),
    color: randomFrom(without(c.init_snake_color, c.colors))
  }
}

function cleanUp (...subscriptions) {
  subscriptions.forEach(sub => {
    sub.unsubscribe()
  })
}
