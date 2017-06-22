import {Observable, Subject} from 'rxjs'
import {renderGame, renderScene} from './renderer'
import {genDirection$, genSnake$, genFood$, genScoreboard$, genGame$} from './actors'
import * as c from './config'

export default function run () {
  const foodProxy$ = new Subject()  // food$ and snake$ forms a circular dependency, Subject to the rescue
  const keypress$ = Observable.fromEvent(document, 'keypress').sampleTime(c.snake_speed)
  const direction$ = genDirection$(keypress$, c.init_direction)
  const snake$ = genSnake$(direction$, foodProxy$)
  const food$ = genFood$(snake$)
  const scoreboard$ = genScoreboard$(snake$, c.score_value)
  const game$ = genGame$(snake$, food$, scoreboard$)

  const foodSub = food$.subscribe(_ => foodProxy$.next(_))  // feed back each value of food$ into foodProxy$
  const gameSub = game$.subscribe(renderGame, null, () => {
    renderScene('ending')
    cleanUp(foodSub, gameSub)
    run()
  })
}

function cleanUp (...subscriptions) {
  subscriptions.forEach(sub => {
    sub.unsubscribe()
  })
}
