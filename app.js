import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import {
  getPair,
  wallet,
  order,
  exchangeInfo,
  account,
} from './routes/index.js'
const bodyParser = require('body-parser')
const app = express()
const path = require('path')
const cors = require('cors')
const portastic = require('portastic')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

if (process.env.CURRENT_ENV === 'dev') {
  app.use(express.static(path.join(__dirname, 'public')))
  const responseTime = require('response-time')
  app.use(responseTime())
} else {
  app.use(express.static(path.join(__dirname, './')))
}

app.use(cors())
// routes
app.use(account)
app.use(getPair)
app.use(wallet)
app.use(order)
app.use(exchangeInfo)

// dynamic port
export const getOpenPort = async (_) => {
  const openPort = await portastic.filter([5000, 5001, 5002, 5003, 5004, 5005])
  return openPort
}
;(async () => {
  const port = await getOpenPort()
  app.listen(port[0], () => console.log(`App listening at port ${port[0]}`))
  global.openPort = port[0]
})()
