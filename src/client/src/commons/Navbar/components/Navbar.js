import React from 'react'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'

function Navbar(props) {
  const {classes, showing, handleStateChange} = props

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="title" color="inherit" className={classes.flex}>
            High Boltage Explorer
          </Typography>
          <Button
            variant={showing === 'explorer' ? 'outlined' : null}
            color="inherit"
            onClick={() => {
              handleStateChange('explorer')
            }}
          >
            Explorer
          </Button>
          <Button
            variant={showing === 'minters' ? 'outlined' : null}
            color="inherit"
            onClick={() => {
              handleStateChange('minters')
            }}
          >
            Minters & Peers
          </Button>
          <Button
            variant={showing === 'add' ? 'outlined' : null}
            color="inherit"
            onClick={() => {
              handleStateChange('add')
            }}
          >
            Add transaction
          </Button>
        </Toolbar>
      </AppBar>
    </div>
  )
}

export default Navbar
