# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

Truffle v5.3.1 (core: 5.3.1) Solidity - 0.5.17 (solc-js) Node v10.13.0 Web3.js v1.2.0

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

PLEASE FOLLOW THESE INSTRUCTIONS WHEN DOWNLOADING...

Step 1
------
`npm install`

Step 2
------
`ganache-cli -p 9545 -a 30`

Step 3
------
`truffle console`

Step 4
------
`npm run dapp`
`npm run server`

Step 5
------

`truffle migrate --reset`


## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
