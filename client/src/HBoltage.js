import React, {Component} from 'react'
import './HBoltage.css'
import Explorer from './features/Explorer'
import Navbar from './commons/Navbar'
import Footer from './commons/Footer'
import CssBaseline from '@material-ui/core/CssBaseline'
class HBoltage extends Component {
  state = {
    showing: 'explorer'
  }

  handleStateChange = selected => {
    this.setState({showing: selected})
  }

  render() {
    const {showing} = this.state

    return (
      <div className="HBoltage">
        <CssBaseline />
        <Navbar handleStateChange={this.handleStateChange} showing={this.state.showing} />
        {showing === 'explorer' && <Explorer />}
        <Footer />
      </div>
    )
  }
}

export default HBoltage
