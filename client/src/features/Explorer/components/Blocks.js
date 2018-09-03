import React from 'react'
import Grid from '@material-ui/core/Grid'
import Block from './Block'

// const blocks = [
//   {
//     height: '0',
//     transactions: '0',
//     description: ['lorem ipsum', 'foo bar', 'block stuff....', 'genesis block'],
//     buttonVariant: 'contained'
//   },
//   {
//     height: '1',
//     // subheader: 'some subheader',
//     transactions: '15',
//     description: ['lorem ipsum', 'foo bar', 'block stuff....', 'Priority'],
//     buttonVariant: 'outlined'
//   },
//   {
//     height: '2',
//     transactions: '30',
//     description: ['lorem ipsum', 'foo bar', 'block stuff....', 'sigscript'],
//     buttonVariant: 'outlined',
//     lastBlock: true
//   }
// ]

function Blocks({props}) {
  const {classes, blocks} = props

  return (
    <React.Fragment>
      <Grid container spacing={40} alignItems="flex-end">
        {blocks && blocks.map(block => <Block key={block.height} props={{block, classes}} />)}
      </Grid>
    </React.Fragment>
  )
}

export default Blocks
