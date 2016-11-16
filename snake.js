const canvas = document.querySelector('#game-canvas'),
      ctx = canvas.getContext('2d'),
      w = canvas.width = 600,
      h = canvas.height = 405,
      r = 7.5,
      MOVE_SPEED = 500,
      INIT_SNAKE_LENGTH = 5

const LEFT_KEY = 97,
      UP_KEY = 119,
      RIGHT_KEY = 100,
      DOWN_KEY = 115,
      INIT_DIRECTION = RIGHT_KEY

const direction$ = Rx.Observable.fromEvent(document, 'keypress')
  .map(e => e.keyCode)
  .filter(keyCode => [LEFT_KEY, UP_KEY, RIGHT_KEY, DOWN_KEY].includes(keyCode))
  .scan((prev, curr) => {
    const inSuccession = (...arr) => [prev, curr].every(_ => arr.includes(_))
    return (inSuccession(LEFT_KEY, RIGHT_KEY) || inSuccession(UP_KEY, DOWN_KEY)) ? prev : curr
  }, INIT_DIRECTION)
  .distinctUntilChanged()
  .startWith(INIT_DIRECTION)

const snake$ = Rx.Observable.range(1, INIT_SNAKE_LENGTH)
  .map(() => ({ x: w / 2, y: h / 2 }))
  .toArray()
  .mergeMap(snake => Rx.Observable.interval(MOVE_SPEED)
    .withLatestFrom(direction$)
    .map(([i, direction]) => ({ direction, snake }))
    .scan(
      (prev, curr) => ({
        snake: prev.snake.map(move(prev.direction, curr.direction)),  // update each dot's position of the snake
        direction: curr.direction
      }),
      { snake, direction: INIT_DIRECTION }
    )
  )
  .map(_ => _.snake)
/*
interval:   ---------0---------1---------2---------3---------
direction$: R-----------U---------------------L--------------
                             withLatestFrom
            -------[0,R]-----[1,U]-----[2,U]-----[3,L]-------
                                  map
            -----{R,snake}-{U,snake}-{U,snake}-{L,snake}-----   
*/

const game$ = Rx.Observable.combineLatest(
    snake$,
    (snake) => ({
      snake
    })
  )
  // .do(x => console.log(x))
  .subscribe(renderSence)

function move (prevDirection, currDirection) {
  return dot => {
    if (currDirection === LEFT_KEY) {
      return {
        x: dot.x - r * 2,
        y: dot.y
      }
    }

    if (currDirection === RIGHT_KEY) {
      return {
        x: dot.x + r * 2,
        y: dot.y
      }
    }

    if (currDirection === UP_KEY) {
      return {
        x: dot.x,
        y: dot.y - r * 2
      }
    }

    if (currDirection === DOWN_KEY) {
      return {
        x: dot.x,
        y: dot.y + r * 2
      }
    }
  }
}

function renderSence (actors) {
  ctx.clearRect(0, 0, w, h)   // clear the canvas first
  renderSnake(actors.snake)
}

function renderSnake (snake) {
  snake.forEach(renderDot)
}

function renderDot (d) {
  ctx.beginPath()
  ctx.arc(d.x, d.y, r, 0, Math.PI * 2)
  ctx.fillStyle = 'orange'
  ctx.fill()
}
