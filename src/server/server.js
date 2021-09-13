import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

// Flight status codees
const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

const TEST_ORACLES_COUNT = 30;
var oracles = new Map();



let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);


function getRandomStatus()
{
  let status = ( Math.floor(Math.random() * 6) * 10);
  return status;
}

function submitOracleResponse(index, airline, flightName, flightTime)
{
  console.log('submit oracle response for : ', index, airline, flightName, flightTime);

  for(var [address, indexes] of oracles)
  {
    if( indexes.includes(index) )
    {
      //let statusCode = getRandomStatus();
      let statusCode = 20;

      console.log('Address: ', address, ' ... ', statusCode);

      flightSuretyApp.methods.submitOracleResponse(index, airline, flightName, flightTime, statusCode)
        .send({from: address, gas: 6000000})
        .catch((err) => {
          console.log('Error Submitting Oracle', address, index, indexes)
          console.log(err);
        });
    }
  }
}

function registerOracles() {

  const fee = web3.utils.toWei('1', 'ether');

  web3.eth.getAccounts((error, accts) => {
    if(error)
    {
      console.log('Web3 could not fetch accounts');
    }
    else
    {
      for(let i=10; i < TEST_ORACLES_COUNT; i++)
      {
        console.log(i, accts[i]);
        flightSuretyApp.methods.registerOracle().send({from: accts[i] , value: fee, gas: 6000000})
          .then( () => {
            flightSuretyApp.methods.getMyIndexes().call( {from: accts[i] })
            .then( (indexes) => {
              oracles.set(accts[i], indexes);
              console.log('Account: ', accts[i], 'has been registered as an oracle with indexes - ', indexes);
            }).catch( (err) => console.log('Failed to get indexes', err) );
          }).catch( (err) => console.log('Failed to register oracle', err) );
      }
    }
  });

  console.log(oracles);

}


flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, result) {
    
    if (error)
    {
      console.log('Oracle Request Error: ' + error);
      return;
    }
    else {
      console.log('Oracle Request');
      console.log(result);
      submitOracleResponse(result.returnValues.index, result.returnValues.airline, 
        result.returnValues.flight, result.returnValues.timestamp);
    }
});



const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

registerOracles();

export default app;


