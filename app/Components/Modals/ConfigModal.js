import React, { useState, useRef } from 'react'
import Rodal from 'rodal'
const config = require('../../../env.json')
import '../../Style/rodal.scss'
const Store = require('electron-store')
const store = new Store()

const ConfigModal = ({ isVisible, setIsVisible }) => {
  const [key, setKey] = useState()
  const [secret, setSecret] = useState()
  const [isValidationLoading, setIsValidationLoading] = useState(false)
  const [validationStatus, setValidationStatus] = useState()
  const [apiValid, setApiValid] = useState(false)

  const keyRef = useRef(null)
  const secretRef = useRef(null)

  const closeModal = () => {
    keyRef.current.value = ''
    secretRef.current.value = ''
    setIsVisible(false)
    setIsValidationLoading(false)
  }

  const saveConfig = () => {
    store.set('config', { k: key, s: secret, is_valid: apiValid })
    closeModal()
  }

  const validateAPI = async () => {
    setIsValidationLoading(true)

    const persistedKey = store.get('config.k')
    const persistedSecret = store.get('config.s')

    if ((!persistedKey || !persistedSecret) && (!secret || !key)) {
      setValidationStatus('Error: enter API')
      setIsValidationLoading(false)
      return
    }

    const payload = {
      secretS: secret || persistedKey,
      keyS: key || persistedSecret,
    }

    const response = await fetch(`/account_status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const responseJSON = await response.json()

    if (responseJSON === 'Api-key is valid, you can use the application') {
      setApiValid(true)
    }

    setValidationStatus(responseJSON)
    setIsValidationLoading(false)
  }

  const changeKeyState = (e) => {
    setKey(e.target.value)
  }

  const changeSecretState = (e) => {
    setSecret(e.target.value)
  }

  return (
    <div>
      <Rodal visible={isVisible} onClose={closeModal} width={800} height={400}>
        <div className="modal-title-container">
          <div className="modal-title-text">Configuration</div>
          <div className="modal-title-border" />
        </div>

        <div className="modal-body-container">
          <div className="modal-body-row">
            <div className="modal-body-label">API Key</div>
            <div className="modal-body-key">
              <input
                placeholder="Enter binance API Key"
                onChange={changeKeyState}
                ref={keyRef}
              />
            </div>
          </div>

          <div className="modal-body-row">
            <div className="modal-body-label">API Secret</div>
            <div className="modal-body-key">
              <input
                placeholder="Enter binance API Secret"
                onChange={changeSecretState}
                ref={secretRef}
              />
            </div>
          </div>

          <div className="modal-body-row-novalue">
            <button
              className="modal-body-label"
              onClick={validateAPI}
              disabled={isValidationLoading}
            >
              {isValidationLoading ? 'Loading...' : 'Validate API'}
            </button>
            <p style={{ fontSize: '12px' }}>{validationStatus}</p>
          </div>
        </div>

        <div className="modal-footer-container">
          <button onClick={saveConfig}>Accept</button>
          <button onClick={closeModal}>Cancel</button>
        </div>
      </Rodal>
    </div>
  )
}

export default ConfigModal
