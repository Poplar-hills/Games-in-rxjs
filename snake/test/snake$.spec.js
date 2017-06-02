import test from 'ava'
import {Subject} from 'rxjs'
import {TestScheduler} from 'rxjs/testing/TestScheduler'
import {genSnake$} from '../src/actors'
import * as defaultConfig from '../src/config'

const testData = [
  {
    desc: 'should make its debut at the center of the canvas',
    config: {w: 20, h: 20, dot_size: 4},
    expected: '--(a|)',
    values: {a: [{x: 10, y: 10}, {x: 14, y: 10}]},
    take: 1
  },
  {
    desc: 'should make its debut with initial length as specified',
    config: {init_length: 4},
    expected: '--(a|)',
    values: {
      a: [
        {x: 50, y: 50},
        {x: 60, y: 50},
        {x: 70, y: 50},
        {x: 80, y: 50},
      ],
    },
    take: 1
  },
  {
    desc: 'should slither at the specified speed',
    config: {move_speed: 40},
    expected: '----a---b---(c|)',
    values: {
      a: [{x: 50, y: 50}, {x: 60, y: 50}],
      b: [{x: 60, y: 50}, {x: 70, y: 50}],
      c: [{x: 70, y: 50}, {x: 80, y: 50}]
    },
    take: 3
  },
  {
    desc: 'should slither forward according to its direction',
    direction: 'D---W--A-S--',
    expected:  '--a-b-c-d-(e|)',
    values: {
      a: [{x: 50, y: 50}, {x: 60, y: 50}],
      b: [{x: 60, y: 50}, {x: 60, y: 40}],
      c: [{x: 60, y: 40}, {x: 60, y: 30}],
      d: [{x: 60, y: 30}, {x: 50, y: 30}],
      e: [{x: 50, y: 30}, {x: 50, y: 40}]
    },
    take: 5
  },
  {
    desc: 'should grow up by one dot after eating a piece of food',
    firstFood: {x: 80, y: 50},
    foodValues: {f: {x: 0, y: 0}},  // 'f' will be the new food when the first food has been eaten
    food:     '--------f----',
    expected: '--a-b-c-d-(e|)',
    values: {
      a: [{x: 50, y: 50}, {x: 60, y: 50}],
      b: [{x: 60, y: 50}, {x: 70, y: 50}],
      c: [{x: 70, y: 50}, {x: 80, y: 50}],
      d: [{x: 70, y: 50}, {x: 80, y: 50}, {x: 90, y: 50}],
      e: [{x: 80, y: 50}, {x: 90, y: 50}, {x: 100, y: 50}]
    },
    take: 5
  }
]

testData.forEach(_ => {
  test(_.desc, t => {
    const scheduler = new TestScheduler(t.deepEqual.bind(t))
    const keypressValues = { W: 119, A: 97, S: 115, D: 100}
    const dircetion$ = scheduler.createHotObservable(_.direction || 'D-----------', keypressValues)
    const foodProxy$ = scheduler.createHotObservable(_.food || '------------', _.foodValues)
    const firstFood = _.firstFood || {x: 0, y: 0}
    const baseConfig = {w: 100, h: 100, dot_size: 10, init_length: 2, move_speed: 20}
    const config = Object.assign({}, defaultConfig, baseConfig, _.config)
    const snake$ = genSnake$(dircetion$, foodProxy$, firstFood, config, scheduler).take(_.take)
    scheduler.expectObservable(snake$).toBe(_.expected, _.values)
    scheduler.flush()
  })  
})
