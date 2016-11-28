const GAME_SPEED = 40,
      STAR_NUMBER = 250,
      ENEMY_FERQ = 500,
      ENEMY_FIRE_FERQ = 800,
      SPACE_KEY = 32

const canvas = document.querySelector('#game-canvas'),
      ctx = canvas.getContext('2d')

const w = canvas.width = window.innerWidth,
      h = canvas.height = window.innerHeight,
      SPACESHIP_Y = h - 80

// stars
const stars$ = Rx.Observable.range(0, STAR_NUMBER)
  .map(() => ({
    x: randomBetween(0, w),
    y: randomBetween(0, h),
    size: randomBetween(1, 3)
  }))
  .toArray()
  .mergeMap(stars => Rx.Observable.interval(GAME_SPEED)
    .map(() => {
      stars.forEach(_ => { _.y = _.y <= h ? _.y + 3 : 0 })
      return stars
    })
  )

// spaceship
const spaceship$ = Rx.Observable.fromEvent(document, 'mousemove')
  .sampleTime(GAME_SPEED)
  .map(e => ({ x: e.clientX, y: SPACESHIP_Y }))
  .startWith({ x: w / 2, y: SPACESHIP_Y })

// spaceship shots
const spaceshipShots$ = Rx.Observable.merge(
    Rx.Observable.fromEvent(document, 'click'),
    Rx.Observable.fromEvent(document, 'keypress')
      .filter(e => e.keyCode === SPACE_KEY)
  )
  .throttleTime(50)     // max fire frequency
  .withLatestFrom(spaceship$, (e, spaceship) => ({
    x: spaceship.x,
    y: SPACESHIP_Y
  }))
  .scan((shots, shot) => shots
    .concat(shot)
    .filter(_ => _.y > 0),  // get rid of those shots that have flown beyond the screen
  [])

// enemies
const enemies$ = Rx.Observable.interval(ENEMY_FERQ)
  .map(i => ({
    x: randomBetween(0, w),
    y: 0,
    step: randomBetween(4, 6),   // the moving distance in each frame
    armed: true // oneInEvery(3)   // TODO: return true every n times
  }))
  .scan((enemies, enemy) => {
    if (enemy.armed && !enemy.isDead) {
      enemy.shots = []
      Rx.Observable.interval(ENEMY_FIRE_FERQ)
        .subscribe(() => {
          enemy.shots = enemy.shots
            .concat({ x: enemy.x, y: enemy.y })
            .filter(_ => _.y < h)
        })
    }
    return enemies
      .concat(enemy)
      .filter(_ => _.y < h)
  }, [])
  .do(x => console.log(x))

// game
const gameSubscription = Rx.Observable.combineLatest(
    stars$, spaceship$, spaceshipShots$, enemies$,
    (stars, spaceship, spaceshipShots, enemies) => ({
      stars,
      spaceship,
      spaceshipShots,
      enemies
    })
  )
  .sampleTime(GAME_SPEED)
  .subscribe(renderSense)

function renderSense (actors) {
  renderStars(actors.stars)
  renderSpaceship(actors.spaceship)
  renderSpaceshipShots(actors.spaceshipShots)
  renderEnemies(actors.enemies)
}

function renderStars (stars) {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#fff'
  stars.forEach(({ x, y, size }) => {
    ctx.fillRect(x, y, size, size)
  })
}

function renderSpaceship ({ x, y }) {
  renderTriangle(x, y, 20, 'up', '#A0C800')
}

function renderSpaceshipShots (shots) {
  shots.forEach(_ => {
    _.y -= 15
    renderTriangle(_.x, _.y, 5, 'up', 'orange')
  })
}

function renderEnemies (enemies) {
  enemies.forEach(_ => {
    _.y += _.step
    renderTriangle(_.x, _.y, 15, 'down', '#FF6946')
  })
}

function renderTriangle (x, y, width, direction, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x - width, y)
  ctx.lineTo(x, direction === 'up' ? y - width : y + width)
  ctx.lineTo(x + width, y)
  ctx.lineTo(x - width, y)
  ctx.fill()
}

/*
  Utils
*/
function randomBetween (min, max) {
  return ~~(Math.random() * (max - min + 1)) + min
}
