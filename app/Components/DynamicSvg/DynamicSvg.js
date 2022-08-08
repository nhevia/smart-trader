import React, { useState, useEffect, useRef } from 'react'

const Icon = ({ name, ...rest }) => {
  const ImportedIconRef = useRef(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const importIcon = async () => {
      try {
        ImportedIconRef.current = (
          await import(`../../assets/coins/${name}.svg`)
        ).ReactComponent
      } catch (err) {
        // TODO implement own error handling logic
        throw err
      } finally {
        setLoading(false)
      }
    }
    importIcon()
  }, [name])

  if (!loading && ImportedIconRef.current) {
    const { current: ImportedIcon } = ImportedIconRef
    return <ImportedIcon {...rest} />
  }

  return null
}

export default Icon
