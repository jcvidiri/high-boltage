import React from 'react'
import Typography from '@material-ui/core/Typography'
import classNames from 'classnames'
import Grid from '@material-ui/core/Grid'

function Footer(props) {
  const links = [
    {
      title: 'GitHub',
      url: 'https://github.com/jcvidiri/high-boltage'
    }
  ]
  const {classes} = props
  return (
    <footer className={classNames(classes.footer, classes.layout)}>
      <Grid container spacing={32} justify="space-evenly">
        <Grid>
          <Typography variant="title" color="textPrimary" gutterBottom>
            High Boltage
          </Typography>
          {links.map(item => (
            <Typography key={item} variant="subheading" color="textSecondary">
              <a href={item.url}>{item.title}</a>
            </Typography>
          ))}
        </Grid>
      </Grid>
    </footer>
  )
}

export default Footer
