import express from 'express'
import crypto from 'crypto'
import axios from 'axios'
const router = express.Router()
const config = require('../config.json')

router.post('/account_status', async (req, res) => {
  const queryString = `timestamp=${Date.now()}`

  const signature = crypto
    .createHmac('sha256', req.body.secretS)
    .update(queryString)
    .digest('hex')

  const walletCoinApi = 'sapi/v1/account/apiTradingStatus'
  const url = `${config['API_URL']}/${walletCoinApi}?${queryString}&signature=${signature}`

  try {
    const response = await axios.get(url, {
      headers: { 'X-MBX-APIKEY': req.body.keyS },
    })

    if (response.data.data.isLocked === false) {
      res.json('Api-key is valid, you can use the application')
    } else {
      res.json(response.data.msg)
    }
  } catch (err) {
    if (err.response.data.msg === 'API-key format invalid.') {
      res.json('API-key format invalid')
    } else if (err.response.data.msg === 'Invalid Api-Key ID.') {
      res.json('Invalid Api-Key ID')
    } else {
      res.json(err.response.data.msg || 'No response')
    }
  }
})

export default router
