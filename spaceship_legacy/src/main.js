import {Observable} from 'rxjs'

const GAME_SPEED = 40,
      STAR_NUMBER = 250,
      ENEMY_FERQ = 200,
      ENEMY_FIRE_FERQ = 800,
      SPACESHIP_FIRE_FREQ = 100,
      BULLET_SPEED = 15,
      SPACE_KEY = 32

const canvas = document.querySelector('#game-canvas'),
      ctx = canvas.getContext('2d')

const w = canvas.width = window.innerWidth,
      h = canvas.height = window.innerHeight,
      SPACESHIP_Y = h - 80

// stars
const stars$ = Observable.range(0, STAR_NUMBER)
  .map(() => ({
    x: randomBetween(0, w),
    y: randomBetween(0, h),
    size: randomBetween(1, 3)
  }))
  .toArray()
  .mergeMap(stars => Observable.interval(GAME_SPEED)
    .map(() => {
      stars.forEach(_ => { _.y = _.y <= h ? _.y + 3 : 0 })
      return stars
    })
  )

// spaceship
const spaceship$ = Observable.fromEvent(document, 'mousemove')
  .sampleTime(GAME_SPEED)
  .map(e => ({ x: e.clientX, y: SPACESHIP_Y }))
  .startWith({ x: w / 2, y: SPACESHIP_Y })

// spaceship shots
const spaceshipShots$ = Observable.merge(
    Observable.fromEvent(document, 'click'),
    Observable.fromEvent(document, 'keypress')
      .filter(e => e.keyCode === SPACE_KEY)
  )
  .throttleTime(SPACESHIP_FIRE_FREQ)     // max fire frequency
  .withLatestFrom(spaceship$, (e, spaceship) => ({
    x: spaceship.x,
    y: SPACESHIP_Y
  }))
  .scan((shots, shot) => shots
    .concat(shot)
    .filter(isVisible),  // get rid of those shots that have flown beyond the screen
  [])

// enemies
const enemies$ = Observable.interval(ENEMY_FERQ)
  .map(i => ({
    x: randomBetween(0, w),
    y: 0,
    step: randomBetween(4, 12),   // moving speed
    armed: !!(i % 2 === 0)   // half of enemies can fire shots
  }))
  .scan((enemies, enemy) => {
    if (enemy.armed && !enemy.isDead) {
      enemy.shots = []
      Observable.interval(ENEMY_FIRE_FERQ)
        .subscribe(() => {
          enemy.shots = enemy.shots
            .concat(!enemy.isDead ? { x: enemy.x, y: enemy.y } : {})
            .filter(isVisible)
        })
    }
    return enemies
      .concat(enemy)
      .filter(isVisible)
  }, [])

// game
const gameSubscription = Observable.combineLatest(
    stars$, spaceship$, spaceshipShots$, enemies$,
    (stars, spaceship, spaceshipShots, enemies) => ({
      stars,
      spaceship,
      spaceshipShots,
      enemies
    })
  )
  .sampleTime(GAME_SPEED)
  .takeWhile(({ spaceship, enemies }) => !gameOver(spaceship, enemies))
  .subscribe(renderSense)

function renderSense (actors) {
  renderStars(actors.stars)
  renderSpaceship(actors.spaceship)
  renderSpaceshipShots(actors.spaceshipShots, actors.enemies)
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

function renderSpaceshipShots (shots, enemies) {
  shots
    .filter(_ => !_.isDestroyed)
    .forEach(_ => {
      _.y -= BULLET_SPEED

      enemies
        .filter(_ => !_.isDead)
        .filter(hit(_))
        .forEach(enemy => {
          _.isDestroyed = true
          enemy.isDead = true
        })

      if (!_.isDestroyed) {
        renderTriangle(_.x, _.y, 5, 'up', 'orange')
      }
    })
}

function renderEnemies (enemies) {
  enemies.forEach(_ => {
    _.y += _.step
    
    if (!_.isDead) {
      renderTriangle(_.x, _.y, 15, 'down', '#FF6946')
    }
    
    if (_.shots) {
      _.shots.forEach(shot => {
        shot.y += BULLET_SPEED
        renderTriangle(shot.x, shot.y, 5, 'down', '#00C4FF')
      })
    }
  })
}

function isVisible ({ x, y }) {
  return x >= 0 && x <= w && y >= 0 && y <= h
}

function hit (obj1) {
  return obj2 => (obj1.x > obj2.x - 15 && obj1.x < obj2.x + 15)
    && (obj1.y > obj2.y - 15 && obj1.y < obj2.y + 15)
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

function gameOver (spaceship, enemies) {
  const hitSpaceship = hit(spaceship)
  return enemies
    .filter(_ => !_.isDead)
    .some(_ => !_.armed ? hitSpaceship(_) : _.shots.some(hitSpaceship))
}

/*
  Utils
*/
function randomBetween (min, max) {
  return ~~(Math.random() * (max - min + 1)) + min
}
