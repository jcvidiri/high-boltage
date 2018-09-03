import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import AddIcon from '@material-ui/icons/Add'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Grid from '@material-ui/core/Grid'
import StarIcon from '@material-ui/icons/StarBorder'
import CompareArrowsIcon from '@material-ui/icons/CompareArrows'
import Typography from '@material-ui/core/Typography'

function Block({props}) {
  const {block, classes} = props
  return (
    <React.Fragment>
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
            {block.description &&
              block.description.map(line => (
                <Typography variant="subheading" align="center" key={line}>
                  {line}
                </Typography>
              ))}
          </CardContent>
          <CardActions className={classes.cardActions}>
            <IconButton variant={block.buttonVariant} color="primary">
              {block.buttonText}
              <CompareArrowsIcon />
            </IconButton>
            {block.lastBlock && (
              <IconButton className={classes.button} color="secondary" aria-label="Add transaction">
                <AddIcon />
              </IconButton>
            )}
          </CardActions>
        </Card>
      </Grid>
    </React.Fragment>
  )
}

export default Block
