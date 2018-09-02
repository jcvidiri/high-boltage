import React from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import CssBaseline from '@material-ui/core/CssBaseline'
import Grid from '@material-ui/core/Grid'
import StarIcon from '@material-ui/icons/StarBorder'
import CompareArrowsIcon from '@material-ui/icons/CompareArrows'
import Typography from '@material-ui/core/Typography'

const blocks = [
  {
    height: '0',
    transactions: '0',
    description: ['lorem ipsum', 'foo bar', 'block stuff....', 'genesis block'],
    buttonVariant: 'contained'
  },
  {
    height: '1',
    // subheader: 'some subheader',
    transactions: '15',
    description: ['lorem ipsum', 'foo bar', 'block stuff....', 'Priority'],
    buttonVariant: 'outlined'
  },
  {
    height: '2',
    transactions: '30',
    description: ['lorem ipsum', 'foo bar', 'block stuff....', 'sigscript'],
    buttonVariant: 'outlined'
  }
]

function Explorer(props) {
  const {classes} = props

  return (
    <React.Fragment>
      <CssBaseline />
      <main className={classes.layout}>
        <div className={classes.spacer} />
        <Grid container spacing={40} alignItems="flex-end">
          {blocks.map(block => (
            // Enterprise card is full width at sm breakpoint
            <Grid item key={block.height} xs={12} sm={block.height === '0' ? 12 : 6} md={4}>
              <Card>
                <CardHeader
                  title={block.height}
                  subheader={block.subheader}
                  titleTypographyProps={{align: 'center'}}
                  subheaderTypographyProps={{align: 'center'}}
                  action={block.height === 'Pro' ? <StarIcon /> : null}
                  className={classes.cardHeader}
                />
                <CardContent>
                  <div className={classes.cardPricing}>
                    <Typography variant="display2" color="textPrimary">
                      {block.transactions}
                    </Typography>
                    <Typography variant="title" color="textSecondary">
                      transactions
                    </Typography>
                  </div>
                  {block.description.map(line => (
                    <Typography variant="subheading" align="center" key={line}>
                      {line}
                    </Typography>
                  ))}
                </CardContent>
                <CardActions className={classes.cardActions}>
                  <Button variant={block.buttonVariant} color="primary">
                    {block.buttonText}
                    <CompareArrowsIcon />
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </main>
    </React.Fragment>
  )
}

Explorer.propTypes = {
  classes: PropTypes.object.isRequired
}

export default Explorer
