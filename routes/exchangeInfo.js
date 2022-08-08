import express from 'express'
const router = express.Router()
const fetch = require('node-fetch')
const config = require('../env.json')

// gets daily exchange info (all symbol pairs with their filters, etc)
router.get('/getExchangeInfo', async (req, res) => {
  const exchangeInfoApi = `api/v3/exchangeInfo`
  const url = `${config['API_URL']}/${exchangeInfoApi}`

  const response = await fetch(url)
  const responseJSON = await response.json()

  res.json(responseJSON)
})

export default router
