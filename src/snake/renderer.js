import * as c from './config.js'

const canvas = document.querySelector('#game-canvas')
const ctx = canvas.getContext('2d')
const dot_r = c.dot_size / 2

canvas.width = c.w
canvas.height = c.h

const renderDot = (color, radius = dot_r) => {
  return ({x, y}) => {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }
}

const renderSnake = snake => {
  snake.forEach(renderDot('orange'))
}

const renderFood = renderDot('#A0C800', dot_r + 2)

export const renderSence = actors => {
  ctx.clearRect(0, 0, c.w, c.h) // clear the canvas first
  renderSnake(actors.snake)
  renderFood(actors.food)
}

export const renderGameOverScene = () => {
  const text = 'GAME OVER'
  ctx.font = '50px Arial'
  const textWidth = ctx.measureText(text).width
  ctx.fillStyle = '#FF6946'
  ctx.fillText(text, (c.w - textWidth) / 2, c.h / 2 - 40)
}
