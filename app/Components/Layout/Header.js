import React, { useState, useEffect } from 'react'
import ConfigModal from '../Modals/ConfigModal'
const config = require('../../../env.json')
const Store = require('electron-store')
const store = new Store({ watch: true })
const storeExchange = new Store({ name: 'exchangeInfo' })
import IconSettings from '../../assets/settings.svg'

const Header = () => {
  const [lastSyncTime, setLastSyncTime] = useState('loading...')
  const [isConfigVisible, setIsConfigVisible] = useState(false)
  const [apiWarning, setApiWarning] = useState()
  const [storeState, setStoreState] = useState(store.get('config.is_valid'))

  useEffect(() => {
    if (
      !storeExchange.get('exchangeInfoSync') ||
      !storeExchange.get('USDTBTCpairs')
    ) {
      async function fetchMyAPI() {
        await getExchangeInfo()
      }
      fetchMyAPI()
    }

    if (!store.get('config.is_valid')) {
      setApiWarning('^configure key^')
    }

    const syncTimeDate = new Date(
      parseInt(storeExchange.get('exchangeInfoSync'))
    ).toLocaleString()
    setLastSyncTime(syncTimeDate)
  }, [])

  useEffect(() => {
    store.onDidChange('config', (newV, oldV) => {
      setStoreState(store.get(newV))
    })
  }, [])

  const getExchangeInfo = async () => {
    setLastSyncTime('loading...')
    const response = await fetch(`/getExchangeInfo`)
    const responseJSON = await response.json()

    const filterUSDT = responseJSON.symbols.filter(
      (el) => el.symbol.search('BTC') > 0 || el.symbol.search('USDT') > 0
    )

    storeExchange.set('USDTBTCpairs', filterUSDT)
    storeExchange.set('exchangeInfoSync', responseJSON.serverTime)

    setLastSyncTime(new Date(responseJSON.serverTime).toLocaleString())
  }

  return (
    <div className="header-buttons-container">
      <div className="header-group">
        <button onClick={getExchangeInfo}>Sync exchange info</button>
        <p style={{ fontSize: 12 }}>{lastSyncTime}</p>
      </div>
      {!storeState && <div className="mask-fullscreen"></div>}
      <div className="header-group no-mask">
        <button
          onClick={() => setIsConfigVisible(true)}
          className="header-button-icon"
        >
          <IconSettings />
        </button>

        {!storeState && (
          <p style={{ fontSize: 12, color: 'orange' }}>{apiWarning}</p>
        )}
      </div>

      <ConfigModal
        isVisible={isConfigVisible}
        setIsVisible={setIsConfigVisible}
      />
    </div>
  )
}

export default Header
