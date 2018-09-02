import React from 'react'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'

function Navbar(props) {
  const {classes} = props
  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="title" color="inherit" className={classes.flex}>
            High Boltage Explorer
          </Typography>
          <Button color="inherit">Blocks</Button>
          <Button color="inherit">Minters & Peers</Button>
          <Button color="inherit">Add transaction</Button>
        </Toolbar>
      </AppBar>
    </div>
  )
}

export default Navbar
