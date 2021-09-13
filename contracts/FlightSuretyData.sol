pragma solidity ^0.5.17;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => bool) private authorizedContracts;

    // Airline Variables
    struct Airline {
        bool isRegistered;
        bool isFunded;
        uint256 funds;
        uint256 votes;
    }
    mapping(address => Airline) private airlines;
    address [] airlinesAddressArray;

    uint256 private registeredAirlines = 0; // airline count
    uint256 private fundedAirlines = 0; // funded airlines

    // Flight Variables

    // Insurance Variables

    struct Insurance {
        address passenger;
        uint256 amount;
    }

    mapping(bytes32 => Insurance[]) private flightInsurances;
    mapping(address => uint256) private payouts;

    mapping(address => uint256) private passengerInsurance;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlineRegistered(address airline);
    event AirlineFunded(address airline);
    event InsuranceBought(bytes32 flightKey, address passenger, uint256 amount);
    event InsureesCredited(bytes32 flightKey, uint numOfInsurees);
    event InsuranceClaimed(address passenger, uint256 amount);


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                    address airline
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        
        airlines[airline] = Airline(true, false, 0, 0);
        registeredAirlines = registeredAirlines.add(1);
        airlinesAddressArray.push(airline);
        emit AirlineRegistered(airline);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAuthorizedCaller()
    {
        require(authorizedContracts[msg.sender], "Caller must be authorized!");
        _;
    }

    modifier requireAirlineIsRegistered( address airline )
    {
        require(airlines[airline].isRegistered, "Airline is not registered!");
        _;
    }

    modifier requireAirlineNotRegistered( address airline )
    {
        require(!airlines[airline].isRegistered, "Airline has already been registered!");
        _;
    }

    modifier requireAirlineIsFunded( address airline )
    {
        require(airlines[airline].isFunded, "Airline is not funded!");
        _;
    }

    modifier requireAirlineIsNotFunded( address airline )
    {
        require(!airlines[airline].isFunded, "Airline is already funded!");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner
    {
        operational = mode;
    }


    function authorizeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        authorizedContracts[contractAddress] = true;
    }

    function revokeCaller
                            (
                                address contractAddress
                            )
                            external
                            requireContractOwner
    {
        authorizedContracts[contractAddress] = false;
    }

    // Get Airline Registration Status
    function getAirlineIsRegistered
                            (
                                address airline
                            )
                            public view
                            requireIsOperational
                            returns(bool)
    {
        return airlines[airline].isRegistered;
    }

    // Get Airline Funded Status
    function getAirlineIsFunded
                            (
                                address airline
                            )
                            public view
                            requireIsOperational
                            returns(bool)
    {
        return airlines[airline].isFunded;
    }

    // Get Funds from Airline
    function getAirlineFunds
                            (
                                address airline
                            )
                            public view
                            requireIsOperational
                            returns(uint256)
    {
        return airlines[airline].funds;
    }

    function getNumOfAirlinesRegd
                            (
                            )
                            public view
                            requireIsOperational
                            returns(uint256)
    {
        return registeredAirlines;
    }

    function getNumOfAirlinesFunded
                            (
                            )
                            public view
                            requireIsOperational
                            returns(uint256)
    {
        return fundedAirlines;
    }

    function getAllAirlines
                            (
                            )
                            public view
                            requireIsOperational
                            returns(address[] memory)
    {
        return airlinesAddressArray;
    }

    // Helper method for test
    function getPassengerInsurance
                            (
                                address airline,
                                string memory flightName,
                                uint256 timestamp
                            )
                            public view
                            requireIsOperational
                            returns(address passengerInsured, uint256 amount)
    {
        require(getAirlineIsRegistered(airline), "Airline is not registered");
        require(getAirlineIsFunded(airline), "Airline is not funded");

        bytes32 flightKey = getFlightKey(airline, flightName, timestamp);

        Insurance memory insurance = flightInsurances[flightKey][0];
        return (insurance.passenger, insurance.amount);
    }

    function getPayout
                            (
                                address passenger
                            )
                            public view
                            requireIsOperational
                            returns(uint256 payout)
    {
        return payouts[passenger];
    }

    function getInsurance
                            (
                                address passenger
                            )
                            public view
                            requireIsOperational
                            returns(uint256 payout)
    {
        return passengerInsurance[passenger];
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (
                                address airline, 
                                address airlineRegisterer
                            )
                            external
                            requireIsOperational requireAuthorizedCaller 
                            requireAirlineNotRegistered(airline) 
                            requireAirlineIsRegistered(airlineRegisterer)
                            requireAirlineIsFunded(airlineRegisterer)
    {
        airlines[airline] = Airline(true, false, 0, 0);
        airlinesAddressArray.push(airline);
        registeredAirlines = registeredAirlines.add(1);
        emit AirlineRegistered(airline);
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (       
                                address passenger,
                                bytes32 flightKey                      
                            )
                            external
                            payable
                            requireIsOperational
    {
        require(msg.value <= 1 ether, "Only allowed up to 1 ether");

        Insurance memory insurance = Insurance(passenger, msg.value);

        flightInsurances[flightKey].push(insurance);
        passengerInsurance[passenger] = passengerInsurance[passenger] + msg.value;

        emit InsuranceBought(flightKey, passenger, msg.value);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    bytes32 flightKey
                                )
                                external
                                requireIsOperational
    {
        uint numOfInsurees = flightInsurances[flightKey].length;
        emit InsureesCredited(flightKey, numOfInsurees);

        for(uint i = 0; i < numOfInsurees; i++)
        {
            Insurance memory insurance = flightInsurances[flightKey][i];
            uint256 payout = (insurance.amount.mul(3)).div(2);

            payouts[insurance.passenger] = payouts[insurance.passenger] + payout;
        }
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                address payable passenger
                            )
                            external
                            requireIsOperational
    {
        uint256 amount = payouts[passenger];
        require(amount > 0, "cannot pay passenger with 0 balance");
        delete payouts[passenger];
        passenger.transfer(amount);

        emit InsuranceClaimed(passenger, amount);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (
                                address airline
                            )
                            public
                            payable
                            requireIsOperational 
                            requireAirlineIsRegistered(airline) requireAirlineIsNotFunded(airline)
    {
        airlines[airline].isFunded = true;
        airlines[airline].funds = msg.value;

        fundedAirlines = fundedAirlines.add(1);
        emit AirlineFunded(airline);
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund(msg.sender);
    }


}

