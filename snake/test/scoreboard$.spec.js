import test from 'ava'
import {TestScheduler} from 'rxjs/testing/TestScheduler'
import {genScoreboard$} from '../src/actors'

const testData = [
  {
    desc: 'should emit scores according to the length of the snake',
    upstream:   '--A--B--C--',
    downstream: '--X--Y--Z--'
  },
  {
    desc: 'should only emit the first if two same scoreboard values occur in a row',
    upstream:   '--A--A--B--B--B--C--',
    downstream: '--X-----Y--------Z--'
  }
]

const snakeValues = {
  A: [{}],
  B: [{}, {}],
  C: [{}, {}, {}]
}
const scoreboardValues = {X: 5, Y: 10, Z: 15}

testData.forEach(_ => {
  test(_.desc, t => {
    const scheduler = new TestScheduler(t.deepEqual.bind(t))
    const snake$ = scheduler.createHotObservable(_.upstream, snakeValues)
    const scoreValue = 5
    const scoreboard$ = genScoreboard$(snake$, scoreValue)
    scheduler.expectObservable(scoreboard$).toBe(_.downstream, scoreboardValues)
    scheduler.flush()
  })  
})
