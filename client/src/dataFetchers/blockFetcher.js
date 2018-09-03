import fetch from 'isomorphic-fetch'

async function blockFetcher() {
  const SERVER_API = 'http://localhost:3001'
  const options = {
    method: 'GET'
    // mode: 'no-cors'
  }

  let res = await fetch(`${SERVER_API}/blocks`, options)

  if (res.status >= 400) {
    return {unauthorized: true}
  }

  // todo the no-cors makes res.json fail [!!!] WTF??
  return res.json()
}

export default blockFetcher
