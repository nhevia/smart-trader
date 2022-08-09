import express from 'express'
import axios from 'axios'
const router = express.Router()
const config = require('../config.json')

// given a pair symbol (ex: XRPUSDT) return current price
router.get('/getPair/currentPrice/:symbol', async (req, res) => {
  const tickerPairApi = `api/v1/ticker/price?symbol=${req.params.symbol}`

  const url = `${config['API_URL']}/${tickerPairApi}`

  axios
    .get(url)
    .then((response) => res.json(response.data))
    .catch((err) => res.json(err))
})

// given a single symbol (ex: XRP) returns current price in USDT
router.get('/getPair/currentPriceUSDT/:symbol', async (req, res) => {
  const tickerPairApi = `api/v1/ticker/price?symbol=${req.params.symbol}USDT`

  const url = `${config['API_URL']}/${tickerPairApi}`

  axios
    .get(url)
    .then((response) => res.json(response.data))
    .catch((err) => res.json(err))
})

export default router
