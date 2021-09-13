
const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraKey = "e982b8dc204e4b2491e4f2ad28264673";

const mnemonic = "depart library surge dog false behave fair accident hinge door vehicle micro";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 9545,
      network_id: "*" // Match any network id
    }, 
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${infuraKey}`),
        network_id: 4,       // rinkeby's id
    }
  },

  compilers: {
    solc: {
      version: "0.5.17"
    }
  }
};