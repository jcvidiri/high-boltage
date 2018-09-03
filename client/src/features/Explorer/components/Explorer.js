import React from 'react'
import Blocks from './Blocks'

function Explorer(props) {
  const {classes, blocks} = props

  return (
    <React.Fragment>
      <main className={classes.layout}>
        <div className={classes.spacer} />
        <Blocks props={{classes, blocks}} />
      </main>
    </React.Fragment>
  )
}

export default Explorer
