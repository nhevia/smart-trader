import React, { useReducer } from 'react'
import ReactNotification from 'react-notifications-component'
const customTitlebar = require('custom-electron-titlebar')
import { initialStateApp, AppContext, reducer } from 'context/AppContext'
import Header from 'components/Layout/Header'
import ListContainer from 'components/ListContainer/ListContainer'
import ResultFeedback from 'components/ResultFeedback/ResultFeedback'
import 'react-notifications-component/dist/theme.css'
import 'style/style.scss'

// changed font-size in class "".titlebar .window-title"
// file located in node_modules/custom-electron-titlebar/lib/themebar.js
new customTitlebar.Titlebar({
  backgroundColor: customTitlebar.Color.fromHex('#444'),
  menu: null,
})

const App = () => {
  const [store, dispatch] = useReducer(reducer, initialStateApp)

  return (
    <div className="app">
      <AppContext.Provider value={{ store, dispatch }}>
        <ReactNotification />
        <div className="layout-header">
          <Header />
        </div>
        <div className="layout-main-content">
          <ListContainer />
          <ResultFeedback />
        </div>
      </AppContext.Provider>
    </div>
  )
}

export default App
