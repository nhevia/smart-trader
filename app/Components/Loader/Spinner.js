import React from 'react'
import Loader from 'react-loader-spinner'

const Spinner = () => {
  return (
    <Loader
      type="Puff"
      color="#00BFFF"
      height={25}
      width={25}
      timeout={3000}
      style={{ textAlign: 'center', marginTop: '20px' }}
    />
  )
}

export default Spinner
