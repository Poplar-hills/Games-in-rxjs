import * as c from './config.js'

const canvas = document.querySelector('#game-canvas')
const ctx = canvas.getContext('2d')
const dot_r = c.dot_size / 2
const sceneText = {
  opening: ["Let's play some Snake", '🐍 Press any key to start 🐍'],
  ending: ['GAME OVER', '👉 Press any key to restart 👈']
}

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

export const renderGame = actors => {
  ctx.clearRect(0, 0, c.w, c.h) // clear the canvas first
  renderSnake(actors.snake)
  renderFood(actors.food)
}

const renderText = (font, color, text, offsetY) => {
  const getTextWidth = text => ctx.measureText(text).width
  ctx.font = font
  ctx.fillStyle = color
  ctx.fillText(text, (c.w - getTextWidth(text)) / 2, c.h / 2 + offsetY)
}

export const renderScene = type => {
  renderText('40px Arial', '#FF6946', sceneText[type][0], -40)
  renderText('25px fantasy', '#61ADF8', sceneText[type][1], 40)
}
