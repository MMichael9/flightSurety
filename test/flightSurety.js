
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
const testConfig = require('../config/testConfig.js');
const { Config } = require('../config/testConfig.js');

contract('Flight Surety Tests', async (accounts) => {

  var ethValue = "1";
  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call({from: config.owner});
    assert.equal(status, true, "Incorrect initial operating status value");
  
  });

it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false;
    try 
    {
        await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
    }
    catch(e) {
        accessDenied = true;
    }
    assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
          
});

it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

  // Ensure that access is allowed for Contract Owner account
  let accessDenied = false;
  try 
  {
      await config.flightSuretyData.setOperatingStatus(false, {from:config.owner});
  }
  catch(e) {
      accessDenied = true;
  }
  assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
  
});

it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

  await config.flightSuretyData.setOperatingStatus(false);

  let reverted = false;
  try 
  {
      await config.flightSurety.setTestingMode(true);
  }
  catch(e) {
      reverted = true;
  }
  assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

  // Set it back for other tests to work
  await config.flightSuretyData.setOperatingStatus(true);

});

it('funds the first airline', async function() {
    let firstAirline = config.firstAirline;
    let isFunded = await config.flightSuretyData.getAirlineIsFunded( firstAirline );
    assert.equal(false, isFunded, "Error, airline has not yet been funded");
    
    await config.flightSuretyApp.fundAirline({from: firstAirline, value: web3.utils.toWei("10", "ether")});

    isFunded = await config.flightSuretyData.getAirlineIsFunded( firstAirline );
    let funds = await config.flightSuretyData.getAirlineFunds( firstAirline );
    let numOfAirlinesFunded = await config.flightSuretyData.getNumOfAirlinesFunded();
    
    assert.equal(isFunded, true, "Error, airline has now been funded");
    assert.equal(funds, web3.utils.toWei("10", "ether"), "Error, should have funded 10 eth");
    assert.equal(numOfAirlinesFunded, 1, "Error, should have 1 airline funded");
});

it('registers a 2nd airline', async function() {
    let firstAirline = config.firstAirline;

    const newAirline = config.testAddresses[0];
    let numOfAirlines = await config.flightSuretyData.getNumOfAirlinesRegd.call();
    
    assert.equal(numOfAirlines, 1, "Error, should only have 1 airline");

    await config.flightSuretyApp.registerAirline(newAirline, {from: firstAirline});
    let isFunded = await config.flightSuretyData.getAirlineIsFunded.call( newAirline );
    let isRegd = await config.flightSuretyData.getAirlineIsRegistered.call( newAirline );
    numOfAirlines = await config.flightSuretyData.getNumOfAirlinesRegd.call();

    assert.equal(numOfAirlines, 2, "Error, should have 2 registered airlines");
    assert.equal(isRegd, true, "Error, airline has been registered");
    assert.equal(isFunded, false, "Error, airline has yet to be funded");
});

it('registers 2 more airlines', async function() {
  let firstAirline = config.firstAirline;

  const thirdAirline = config.testAddresses[1];
  const fourthAirline = config.testAddresses[2];

  let numOfAirlines = await config.flightSuretyData.getNumOfAirlinesRegd.call();
  assert.equal(numOfAirlines, 2, "Error, should only have 2 airlines");

  await config.flightSuretyApp.registerAirline(thirdAirline, {from: firstAirline});
  await config.flightSuretyApp.registerAirline(fourthAirline, {from: firstAirline});

  let is3rdFunded = await config.flightSuretyData.getAirlineIsFunded.call(thirdAirline);
  assert.equal(is3rdFunded, false, "Error, airline has not yet been registered");

  let is4thRegd = await config.flightSuretyData.getAirlineIsRegistered.call(thirdAirline);
  assert.equal(is4thRegd, true, "Error, airline has been registered");

  numOfAirlines = await config.flightSuretyData.getNumOfAirlinesRegd.call();
  assert.equal(numOfAirlines, 4, "Error, should only have 4 airlines");

});

it('tries to register a 5th airline, but fails', async function() {
  let firstAirline = config.firstAirline;

  const fifthAirline = config.testAddresses[3];

  let is5thRegd = await config.flightSuretyData.getAirlineIsRegistered.call(fifthAirline);
  assert.equal(is5thRegd, false, "Error, fifth airline has not yet been registered");

  let numOfAirlines = await config.flightSuretyData.getNumOfAirlinesRegd.call();
  assert.equal(numOfAirlines, 4, "Error, should only have 4 airlines");

  await config.flightSuretyApp.registerAirline(fifthAirline, {from: firstAirline});

  numOfAirlines = await config.flightSuretyData.getNumOfAirlinesRegd.call();
  assert.equal(numOfAirlines, 4, "Error, should only have 4 airlines");

  is5thRegd = await config.flightSuretyData.getAirlineIsRegistered.call(fifthAirline);
  assert.equal(is5thRegd, false, "Error, fifth airline has still not yet been registered after contract call");

  let airlineVoteTotal = await config.flightSuretyApp.getNumberOfVotes.call(fifthAirline);
  assert.equal(airlineVoteTotal, 1, "Error, Airline should have 1 vote at this point");

});

it('registers 5th airline through multiparty concensus', async function() {
  let firstAirline = config.firstAirline;
  let secondAirline = config.testAddresses[0];
  let thirdAirline = config.testAddresses[1];
  let fourthAirline = config.testAddresses[2];
  let fifthAirline = config.testAddresses[3];

  let airlineVoteTotal = await config.flightSuretyApp.getNumberOfVotes.call(fifthAirline);
  assert.equal(airlineVoteTotal, 1, "Error, Airline should have 1 vote at this point");

  let registered = await config.flightSuretyData.getAirlineIsRegistered.call(fifthAirline);
  assert.equal(registered, false, "Error, fifth airline has not yet been registered");

  await config.flightSuretyApp.fundAirline({from: secondAirline, value: web3.utils.toWei("10", "ether")});
  await config.flightSuretyApp.registerAirline(fifthAirline, {from: secondAirline});
  
  registered = await config.flightSuretyData.getAirlineIsRegistered.call(fifthAirline);
  assert.equal(registered, true, "Error, fifth airline has been registered");

  airlineVoteTotal = await config.flightSuretyApp.getNumberOfVotes.call(fifthAirline);
  assert.equal(airlineVoteTotal, 2, "Error, Airline should have 2 votes at this point");

  let numOfAirlines = await config.flightSuretyData.getNumOfAirlinesRegd.call();
  assert.equal(numOfAirlines, 5, "Error, should have 5 airlines");

});

it('registers a flight but fails', async function() {
  let thirdAirline = config.testAddresses[1];

  let registered = await config.flightSuretyData.getAirlineIsRegistered.call(thirdAirline);
  assert.equal(registered, true, "Error, fifth airline has been registered");

  let funded = await config.flightSuretyData.getAirlineIsFunded.call(thirdAirline);
  assert.equal(funded, false, "Error, Airline is not funded");

  let timestamp = Math.floor(Date.now() / 1000);

  let failedFlight = false;
  try 
  {
    await config.flightSuretyApp.registerFlight("Flight One", timestamp, {from: thirdAirline});
  }
  catch(e) {
    failedFlight = true;
  }

  assert.equal(failedFlight, true, "Error, flight registration should be failed");
});

it('registers a flight using the first airline', async function () {
  let firstAirline = config.firstAirline;

  let registered = await config.flightSuretyData.getAirlineIsRegistered.call(firstAirline);
  assert.equal(registered, true, "Error, first airline has been registered");
  let funded = await config.flightSuretyData.getAirlineIsFunded.call(firstAirline);
  assert.equal(funded, true, "Error, Airline is funded");
  let numOfFlights = await config.flightSuretyApp.getFlightCount.call();
  assert.equal(numOfFlights, 0, "Error, zero flights have been registered at this point");

  let flightName = "FlightOne"
  let timestamp = 1629334068;

  await config.flightSuretyApp.registerFlight(flightName, timestamp, {from: firstAirline});

  numOfFlights = await config.flightSuretyApp.getFlightCount.call();
  assert.equal(numOfFlights, 1, "Error, one flight has been registered at this point");
});

it('buys insurance for a registered flight', async function () {
  let firstAirline = config.firstAirline;
  let passenger = config.testAddresses[4];
  let flightName = "FlightOne"
  let timestamp = 1629334068;

  await config.flightSuretyApp.buyInsurance(firstAirline, flightName, timestamp, {from: passenger, value: web3.utils.toWei(ethValue, "ether")});

  let passengerInfo = await config.flightSuretyData.getPassengerInsurance(firstAirline, flightName, timestamp);

  assert.equal(passengerInfo.passengerInsured, passenger, "Error, passenger address should add up");
  assert.equal(passengerInfo.amount, web3.utils.toWei(ethValue, "ether"), "Error, passenger amount should be 1 ether");
});

it('fails to buy insurance for a non-registered flight', async function () {
  let firstAirline = config.firstAirline;
  let passenger = config.testAddresses[4];
  let flightName = "FlightTwo"
  let timestamp = 1629334068;

  let fail=false

  try {
    await config.flightSuretyApp.buyInsurance(firstAirline, flightName, timestamp, {from: passenger, value: web3.utils.toWei(ethValue, "ether")});
  }
  catch(e) {
    fail=true
  }

  assert(fail, true, "Error, passenger should not be able to buy insurance for flight");
})

it('credits a list of insurees based on a specific flight', async function() {
  let firstAirline = config.firstAirline;
  let passenger = config.testAddresses[4];
  let flightName = "FlightOne"
  let timestamp = 1629334068;

  let fail=false

  try {
    await config.flightSuretyApp.credit(firstAirline, flightName, timestamp);
  }
  catch(e) {
    fail=true
  }

  let passengerInfo = await config.flightSuretyData.getPayout(passenger);

  assert.equal(passengerInfo, web3.utils.toWei("1.5", "ether"), "Error, passenger amount should be 1.5 ether");
})

it('withdraws insurance for passenger', async function() {
  let passenger = config.testAddresses[4];

  let fail=false;

  try {
    await config.flightSuretyApp.claim({from: passenger});
  }
  catch(e) {
    fail=true;
  }

  assert.equal(fail, false, "No error should occur while trying to withdraw funds");
})

it('tries to withdraw insurance for passenger again but should fail', async function() {
  let passenger = config.testAddresses[4];

  let fail=false;

  try {
    await config.flightSuretyApp.claim({from: passenger});
  }
  catch(e) {
    fail=true;
  }

  assert.equal(fail, true, "Error, cannot withdraw when you have no funds available");
})

});
