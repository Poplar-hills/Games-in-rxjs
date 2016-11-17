const canvas = document.querySelector('#game-canvas'),
      ctx = canvas.getContext('2d'),
      w = canvas.width = 600,
      h = canvas.height = 405,
      r = 7.5,
      MOVE_SPEED = 50,
      INIT_SNAKE_LENGTH = 5

const LEFT_KEY = 97,    // a
      UP_KEY = 119,     // w
      RIGHT_KEY = 100,  // d
      DOWN_KEY = 115,   // s
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

/*
----U----L----L----R----D----U----R----
                 scan                    snake cannot reverse its direction (L->R, R->L, U->D or D->U)
----U----L----L----L----D----D----R----
         distinctUntilChanged
----U----L--------------D---------R----
*/

const snake$ = Rx.Observable.range(1, INIT_SNAKE_LENGTH)
  .map(() => ({ x: w / 2, y: h / 2 }))
  .toArray()
  .mergeMap(snake => Rx.Observable.interval(MOVE_SPEED)
    .withLatestFrom(direction$)
    .map(([i, direction]) => ({ direction, snake }))
    .scan((prev, curr) => prev.map(move(curr.direction)), snake)  // update each dot's position of the snake
  )

/*
---------0---------1---------2---------3---------
R-----------U---------------------L--------------
                 withLatestFrom
-------[0,R]-----[1,U]-----[2,U]-----[3,L]-------
                      map
-----{R,snake}-{U,snake}-{U,snake}-{L,snake}-----  direction and the sanke itself are the two things required for updating the snake's position
*/

const game$ = Rx.Observable.combineLatest(
    snake$,
    (snake) => ({
      snake
    })
  )
  .subscribe(renderSence)

function move (currDirection) {
  const moveMap = {}
  moveMap[LEFT_KEY]  = ({x, y}) => ({ x: x - r * 2, y })
  moveMap[RIGHT_KEY] = ({x, y}) => ({ x: x + r * 2, y })
  moveMap[UP_KEY]    = ({x, y}) => ({ x, y: y - r * 2 })
  moveMap[DOWN_KEY]  = ({x, y}) => ({ x, y: y + r * 2 })
  return moveMap[currDirection]
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
