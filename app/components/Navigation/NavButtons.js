import React from 'react'
import { Link } from 'react-router-dom'
import IconTrade from 'assets/trade.svg'
import IconAnalysis from 'assets/market-analysis.svg'
import IconTsl from 'assets/trend.svg'

const NavButtons = () => {
  return (
    <div className="nav-buttons">
      <Link to="/trade">
        <button>
          <IconTrade className="small-svg-icon" />
        </button>
      </Link>
      <Link to="/tls">
        <button>
          <IconTsl className="small-svg-icon" />
        </button>
      </Link>
      <Link to="/information">
        <button>
          <IconAnalysis className="small-svg-icon" />
        </button>
      </Link>
    </div>
  )
}

export default NavButtons
