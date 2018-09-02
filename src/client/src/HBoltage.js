import React, {Component} from 'react'
import './HBoltage.css'
import Explorer from './features/Explorer'
import Navbar from './commons/Navbar'
import Footer from './commons/Footer'

class HBoltage extends Component {
  render() {
    return (
      <div className="HBoltage">
        <Navbar />
        <Explorer />
        <Footer />
      </div>
    )
  }
}

export default HBoltage
