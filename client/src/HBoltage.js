import React, {Component} from 'react'
import './HBoltage.css'
import Explorer from './features/Explorer'
import Navbar from './commons/Navbar'
import Footer from './commons/Footer'
import CssBaseline from '@material-ui/core/CssBaseline'
import blockFetcher from './dataFetchers/blockFetcher'
class HBoltage extends Component {
  state = {
    showing: 'explorer',
    blocks: []
  }

  handleStateChange = selected => {
    this.setState({showing: selected})
  }

  async componentDidMount() {
    const blocks = await blockFetcher()

    this.setState({
      blocks: blocks
    })
  }

  render() {
    const {showing} = this.state

    return (
      <div className="HBoltage">
        <CssBaseline />
        <Navbar handleStateChange={this.handleStateChange} showing={this.state.showing} />
        {showing === 'explorer' && <Explorer blocks={this.state.blocks} />}
        <Footer />
      </div>
    )
  }
}

export default HBoltage
