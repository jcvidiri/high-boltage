import Navbar from '../components/Navbar'
import {withStyles} from '@material-ui/core/styles'

const styles = {
  root: {
    flexGrow: 1
  },
  flex: {
    flexGrow: 1,
    float: 'left'
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20
  }
}

export default withStyles(styles)(Navbar)
