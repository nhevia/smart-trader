import React from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import SmartBuy from '../ItemList/SmartBuy'
import Tsl from '../ItemList/Tsl'
import Information from '../ItemList/Information'
import NavButtons from '../Navigation/NavButtons'

const ListContainer = () => {
  return (
    <div className="list-container">
      <NavButtons />
      <Switch>
        <Route path="/trade" component={SmartBuy} />
        <Route path="/tls" component={Tsl} />
        <Route path="/information" component={Information} />
        <Route render={() => <Redirect to="/trade" />} />
      </Switch>
    </div>
  )
}

export default ListContainer
