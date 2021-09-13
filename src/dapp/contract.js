import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.firstAirline = null;
        this.airlines = [];
        this.passengers = [];
        this.passenger = null;
        this.appAddress = config.appAddress;
    }

    initialize(callback) {
        
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];
            this.firstAirline = accts[1];
            this.passenger = accts[6];

            console.log(accts);
            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    getAllAirlines(callback) {
        let self = this;
        self.flightSuretyData.methods
            .getAllAirlines()
            .call( { from: self.owner}, callback);
    }

    getAllFlights(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .getAllFlights()
            .call( { from: self.owner}, callback);
    }

    registerAirline(airline, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .registerAirline(airline)
            .send({from: this.firstAirline, gas: 6000000}, callback)
            .then(value => {
                alert('Airline: ' + airline + ' has been registered successfully');
              }, reason => {
                  console.log(reason);
                alert('Airline: ' + airline + ' could not be registered !');
            });
    }

    fundAirline(airline, callback) {
        let self = this;
        let value = this.web3.utils.toWei("10", "ether");
        self.flightSuretyData.methods
            .fund(airline)
            .send({from: self.owner, value: value}, callback)
            .then(value => {
                alert('Airline: ' + airline + ' has been funded successfully');
              }, reason => {
                alert('Airline: ' + airline + ' has already been funded !');
            });
    }

    registerFlight(flight, callback) {
        let self = this
        let timestamp = Math.floor(Date.now() / 1000);

        self.flightSuretyApp.methods
            .registerFlight(flight, timestamp)
            .send({from: self.firstAirline, gas: 1000000}, callback)
            .then(value => {
                console.log(value);
                alert('Flight: ' + flight + ' has been registered successfully');
              }, reason => {
                alert('Flight: ' + flight + ' has already been registered !');
            });
    }

    buyInsurance(airline, flight, timestamp, amt, callback) {
        let self = this;
        let ethValue = this.web3.utils.toWei(amt, "ether");

        self.flightSuretyApp.methods
            .buyInsurance(airline, flight, timestamp)
            .send({from: self.passenger, gas: 1000000, value: ethValue}, callback)
            .then(res => {
                console.log(res);
                alert('Passenger: ' + self.passenger + ' bought insurance for flight: ' + flight);
              }, reason => {
                  console.log(reason);
                  alert('Passenger: ' + self.passenger + ' failed to buy insurance for flight: ' + flight);
            });
    }

    claim(passenger, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .claim()
            .send({from: passenger}, callback)
            .then(res => {
                console.log(res);
                alert('Passenger: ' + passenger + ' claimed their insurance');
              }, reason => {
                  console.log(reason);
                  alert('Passenger: ' + passenger + ' failed to claim their insurance');
            });
    }


    getNumOfAirlines(callback) {
        let self = this;
        self.flightSuretyData.methods
            .getNumOfAirlinesRegd()
            .call({from: self.owner}, callback);
    }

    getInsurance(address, callback) {
        let self = this;
        self.flightSuretyData.methods
            .getInsurance(address)
            .call(callback)
            .then(res => {
                console.log("insurance", res);
              }, reason => {
                  console.log(reason);
            });
    }

    getPayout(address, callback) {
        let self = this;
        self.flightSuretyData.methods
            .getPayout(address)
            .call(callback)
            .then(res => {
                console.log("payout", res);
              }, reason => {
                  console.log(reason);
            });
    }

    getMyIndexes(address, callback) {
        let self = this;
        self.flightSuretyApp.methods
            .getMyIndexes()
            .call({from: address}, callback);
    }

    fetchFlightStatus(airline, flight, timestamp, callback) {
        let self = this; 
        self.flightSuretyApp.methods
            .fetchFlightStatus(airline, flight, timestamp)
            .send({ from: self.owner, gas: 6000000},callback)
            .then(res => {
                console.log(res);
              }, reason => {
                  console.log(reason);
            });
    }

    authorizeCaller(address, callback) {
        let self = this;
        self.flightSuretyData.methods
            .authorizeCaller(address)
            .send({from: self.owner}, callback)
    }
}