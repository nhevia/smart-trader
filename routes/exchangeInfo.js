import express from 'express'
const fetch = require('node-fetch')
const router = express.Router()
const config = require('../config.json')

// gets daily exchange info (all symbol pairs with their filters, etc)
router.get('/getExchangeInfo', async (req, res) => {
  const exchangeInfoApi = `api/v3/exchangeInfo`
  const url = `${config['API_URL']}/${exchangeInfoApi}`

  const response = await fetch(url)
  const responseJSON = await response.json()

  res.json(responseJSON)
})

export default router
