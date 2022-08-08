import React, { useReducer } from 'react'
import { initialStateApp, AppContext, reducer } from './Context/AppContext'
import Header from './Components/Layout/Header'
import ListContainer from './Components/ListContainer/ListContainer'
import ResultFeedback from './Components/ResultFeedback/ResultFeedback'
import ReactNotification from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'
import './Style/style.scss'
const customTitlebar = require('custom-electron-titlebar')

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
