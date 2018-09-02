import Footer from '../components/Footer'
import {withStyles} from '@material-ui/core/styles'

const styles = theme => ({
  layout: {
    width: 'auto',
    marginLeft: theme.spacing.unit * 3,
    marginRight: theme.spacing.unit * 3,
    [theme.breakpoints.up(900 + theme.spacing.unit * 3 * 2)]: {
      width: 900,
      marginLeft: 'auto',
      marginRight: 'auto'
    }
  },
  footer: {
    position: 'fixed',
    left: `0px`,
    right: `0px`,
    bottom: `0px`,
    width: 'auto',
    marginTop: theme.spacing.unit,
    borderTop: `1px solid ${theme.palette.divider}`,
    padding: `${theme.spacing.unit * 3}px 0`,
    backgroundColor: theme.palette.common.white
  }
})

export default withStyles(styles)(Footer)
