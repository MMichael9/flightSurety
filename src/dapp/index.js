
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        contract.authorizeCaller(contract.appAddress, (error, result) => {
        });

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        contract.getAllAirlines((error, result) => {
            console.log(error, result);
            let arr = result;
            for (var i = 0; i < arr.length; i++) {
                displayAirlines(arr[i]);
            }
        })

        contract.flightSuretyApp.getPastEvents('FlightRegistered', {fromBlock: 0, toBLock: 'latest'}, (error, result) => {
            if (error) {
                console.log('Error');
            }
            else 
            {
                result.forEach((entry) => {
                    let airline = entry.returnValues.airline;
                    let flightName = entry.returnValues.flightName;
                    let flightTime = entry.returnValues.flightTime;
                    displayFlights(airline, flightName, flightTime)
                })
            }
        });

        contract.getInsurance(contract.passenger, (error, result) => {
            if (error)
            {
                console.log(error);
            }
            else
            {
                let amount = contract.web3.utils.fromWei(result, "ether");
                displayInsuranceBought(amount);
            }
        })

        contract.getPayout(contract.passenger, (error, result) => {
            if (error)
            {
                console.log(error);
            }
            else
            {
                let amount = contract.web3.utils.fromWei(result, "ether");
                displayInsurancePayout(amount);
            }
        })

    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let selectDiv = DOM.elid('flight-select');
            let flight = (selectDiv.options[selectDiv.selectedIndex].value).split("_").map(item => item.trim());
            console.log(flight);
            // Write transaction
            contract.fetchFlightStatus(flight[0], flight[1], flight[2], (error, result) => {
                console.log(result);
                //display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });

            contract.getPayout(passenger, (error, result) => {
                if (error)
                {
                    console.log(error);
                }
                else
                {
                    let amount = contract.web3.utils.fromWei(result, "ether");
                    displayInsurancePayout(amount);
                }
            });
        })

        DOM.elid('register-airline').addEventListener('click', () => {
            let airline = DOM.elid('airline-name').value;

            contract.registerAirline(airline, (error, result) => {
                console.log(error, result);
                if (error) {
                    console.log("Could not add airline: " + error);
                } 
                else {
                    displayAirlines(airline);
                }
            });
        })

        DOM.elid('fund-airline').addEventListener('click', () => {
            let airline = DOM.elid('airline-name').value

            contract.fundAirline(airline, (error, result) => {
                console.log(error, result);
            });
        })


        DOM.elid('register-flight').addEventListener('click', () => {
            let flight = DOM.elid('flight-number').value;
            contract.registerFlight(flight, (error, result) => {
                console.log(error, result);
                
                if ( result )
                {
                    contract.flightSuretyApp.getPastEvents('FlightRegistered', {fromBlock: 0, toBLock: 'latest'}, (error, result) => {
                        if (error) {
                            console.log('Error');
                        }
                        else 
                        {
                            let selectDiv = DOM.elid('flight-select');
                            selectDiv.innerHTML = "";

                            result.forEach((entry) => {
                                let airline = entry.returnValues.airline;
                                let flightName = entry.returnValues.flightName;
                                let flightTime = entry.returnValues.flightTime;
                                displayFlights(airline, flightName, flightTime)
                            })
                        }
                    });
                }


            });
        })

        DOM.elid('buy-insurance').addEventListener('click', () => {
            let select = document.getElementById("flight-select");
            let flight = select.options[select.selectedIndex].value;
            console.log(flight);
            let flightArr = flight.split("_").map(obj => obj.trim());
            console.log(flightArr);

            let amt = DOM.elid('amount').value;

            contract.buyInsurance(flightArr[0], flightArr[1], flightArr[2], amt, (error, result) => {
                if (error) {
                    console.log(error);
                }
                else
                {

                    contract.getInsurance(contract.passenger, (error, result) => {
                        if (error)
                        {
                            console.log(error);
                        }
                        else
                        {
                            let amount = contract.web3.utils.fromWei(result, "ether");
                            displayInsuranceBought(amount);
                        }
                    })

                }
            })
        })


        DOM.elid('claim-insurance').addEventListener('click', () => {
            let passenger = contract.passenger;

            contract.claim(passenger, (error, result) => {
                if(error)
                {
                    console.log(error);
                }
                else
                {
                    console.log(result);
                }
            });

            contract.getInsurance(passenger, (error, result) => {
                if(error){
                    console.log(error);
                }
                else{
                }
            });

            contract.getPayout(passenger, (error, result) => {
                if (error)
                {
                    console.log(error);
                }
                else
                {
                    let amount = contract.web3.utils.fromWei(result, "ether");
                    displayInsurancePayout(amount);
                }
            });
        })
    
    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}

function displayAirlines(airlineName)
{
    let displayDiv = DOM.elid('airline-list');
    let section = DOM.div({className: 'airlines'});
    section.appendChild(DOM.h4(airlineName));
    displayDiv.append(section);
}

function displayFlights(airline, flightName, flightTime)
{
    let displayDiv = DOM.elid('flight-list');
    let selectDiv = DOM.elid('flight-select');
    
    let option = DOM.option({ value:airline + '_' + flightName + '_' + flightTime });
    option.innerHTML = flightName;
    selectDiv.appendChild(option);
    displayDiv.append(selectDiv);
}

function displayInsuranceBought(amount)
{
    let displayDiv = DOM.elid('insurance-bought');
    let text = DOM.elid('insurance-bought-text');
    text.innerHTML = 'Passenger has bought ' + amount + ' eth worth of insurance</br>';

    displayDiv.append(text);
}

function displayInsurancePayout(amount)
{
    let displayDiv = DOM.elid('insurance-payout');
    let text = DOM.elid('insurance-payout-text');
    text.innerHTML = 'Passenger has ' + amount + ' eth that can be claimed';

    displayDiv.append(text);
}