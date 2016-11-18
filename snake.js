const { always, T, cond, lt, gt, identity } = R

const canvas = document.querySelector('#game-canvas'),
      ctx = canvas.getContext('2d'),
      w = canvas.width = 600,
      h = canvas.height = 405,
      d = 15,           // dot's diameter
      MOVE_SPEED = 100,
      INIT_SNAKE_LENGTH = 5

const LEFT_KEY = 97,    // a
      UP_KEY = 119,     // w
      RIGHT_KEY = 100,  // d
      DOWN_KEY = 115,   // s
      INIT_DIRECTION = RIGHT_KEY

const direction$ = Rx.Observable.fromEvent(document, 'keypress')
  .sampleTime(MOVE_SPEED) // prevent the sanke from reversing its direction caused by pressing R->T->L very fast (faster than the MOVE_SPEED)
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
  .map(i => ({ x: w / 2 + i * d, y: h / 2 }))
  .toArray()
  .mergeMap(snake => Rx.Observable.interval(MOVE_SPEED)
    .withLatestFrom(direction$)
    .map(([i, direction]) => ({ direction, snake }))
    .scan((prev, curr) => crawl(curr.direction, prev), snake)
  )

/*
---------0---------1---------2---------3---------
R-----------U---------------------L--------------
                 withLatestFrom
-------[0,R]-----[1,U]-----[2,U]-----[3,L]-------
                      map
-----{R,snake}-{U,snake}-{U,snake}-{L,snake}-----  direction and the sanke itself are the two things required for updating the snake's position
                      scan                         update each dot's position of the snake
-------snake0----snake1----snake2----snake3------
*/

// const food$ = Rx.Observable

const game$ = Rx.Observable.combineLatest(
    snake$,
    (snake) => ({
      snake
    })
  )
  .subscribe(renderSence)

function crawl (direction, snake) {
  const oldSnakeHead = snake[snake.length - 1],
        newSnakeHead = moveDot(oldSnakeHead, direction),
        newSnakeBody = snake.slice(1)
  return newSnakeBody.concat(newSnakeHead)
}

function moveDot ({ x, y }, direction) {  // update a dot's position according to the direction
  const validateMove = ({ x, y }) => ({ x: circulate(w, x), y: circulate(h, y) }),
        nextMove = new Map([
          [LEFT_KEY,  { y, x: x - d }],
          [RIGHT_KEY, { y, x: x + d }],
          [UP_KEY,    { x, y: y - d }],
          [DOWN_KEY,  { x, y: y + d }]
        ]).get(direction)

  return validateMove(nextMove)
}

function renderSence (actors) {
  ctx.clearRect(0, 0, w, h)   // clear the canvas first
  renderSnake(actors.snake)
}

function renderSnake (snake) {
  snake.forEach(renderDot)
}

function renderDot ({ x, y }) {
  ctx.beginPath()
  ctx.arc(x, y, d / 2, 0, Math.PI * 2)
  ctx.fillStyle = 'orange'
  ctx.fill()
}

/*
  Utils
*/
const circulate = (max, value) => cond([
  [lt(max), always(0 + d / 2)],
  [gt(0), always(max - d / 2)],
  [T, identity]
])(value)