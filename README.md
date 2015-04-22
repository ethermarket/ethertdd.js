# EtherTDD.js 
EtherTDD is a collection of testing tools for Ethereum contracts.

EtherTDD.js simplifies the process of loading contracts from files and executing transactions in sequence. EtherTDD.js is best-suited for testing contracts on a blockchain from within a dapp browser such as Mist or AlethZero. This can be advantageous if your contract integrates with contracts controlled by third parties. However, this does mean that the testing process is heavier and slower than it would be with [EtherTDD.py](https://github.com/ethermarket/ethertdd.py). Ideally you'd write your integration tests with EtherTDD.js and write your unit tests with EtherTDD.py.

EtherTDD.js is testing-framework agnostic and language agnostic. In the examples provided, though, we use Jasmine and Solidity.

# Requirements

EtherTDD.js needs access to a `web3` instance connected to an Ethereum client. For best results, use in tandem with a promise library such as [Q](https://github.com/kriskowal/q) or [RSVP.js](https://github.com/tildeio/rsvp.js). In order to be compatible with EtherTDD.js, the promise library you use must implement a `defer` function that returns an object with `reject` and `resolve` functions.

# Installation

Download [ethertdd.min.js](https://raw.githubusercontent.com/ethermarket/ethertdd.js/master/dist/ethertdd.min.js) and import it into your testing page.

# Usage

By itself, EtherTDD.js provides a Contract factory function that can create [web3.eth.contract](https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethcontract) class instances by passing either a path to a compiled contract or by passing in the ABI and compiled hex for a contract and then calling `create`.

**Examples:**

Given a contract with an ABI file at `contracts/example.abi` and a binary file at `contracts/example.binary`:

    var web3 = require('web3');
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:8080'));
    var ethertdd = new EtherTDD(web3);
    var contract = ethertdd.Contract('contracts/example').create();

    // And then you can interact with it!
    contract.owner();

Given an ABI object and a hex string:

    var abi = ...
    var hex = ...
    var web3 = require('web3');
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:8080'));
    var ethertdd = new EtherTDD(web3);
    var contract = ethertdd.Contract(abi, hex).create();
    
Given the Q promise library, you can use `then` to chain transactions between blocks:

    var web3 = require('web3');
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:8080'));

    var ethertdd = new EtherTDD(web3, Q);
    ethertdd.Contract('contracts/example').create().then(function (contract) {
        // This will be executed in the block after the one the
        // contract creation transaction was broadcast during.
        console.log(contract.owner());
        return contract.setFee(500); // Transactions return promise objects.
    }).then(function (res) {
        // This will be executed in the block after the one
        // the setFee transaction was broadcast during.
        // `res` will be the return value of setFee.
        if (res === true) {
            console.log(contract.fee());
        } else {
            console.log("Failed to set fee!");
        }
    });

Given a previously deployed contract at address `0xe68c0c59974c6f24c799fa99ed7fba2176ee5ff6` with an ABI file at `contracts/example.abi` and a binary file at `contracts/example.binary`, you can create a contract object like so:

    var web3 = require('web3');
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:8080'));

    var ethertdd = new EtherTDD(web3, Q);
    ethertdd.Contract('contracts/example')
    .load('0xe68c0c59974c6f24c799fa99ed7fba2176ee5ff6')
    .then(function (contract) {
        console.log(contract.owner());
    });

`create` optionally takes the same arguments as [web3.eth.sendTransaction](https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethsendtransaction): `transactionObject` and `callback`.

`EtherTDD` also optionally takes a third argument: `BLOCK_DELAY`. This determines how many additional blocks to wait before resolving or rejecting the promise object returned. This can be useful if your transactions tend to not get included in the same block they were broadcast during. This is not a situation that should arise during testing on a private blockchain, but could potentially occur with some regularity if you choose to use EtherTDD.js in a production environment.

See [tests/example.js](https://raw.githubusercontent.com/ethermarket/ethertdd.js/master/tests/example.js) and [index.html](https://raw.githubusercontent.com/ethermarket/ethertdd.js/master/index.html) for an example of using EtherTDD.js with the Jasmine testing framework and the Q promise library.

# Running the example tests

1. `git clone https://github.com/ethermarket/ethertdd.js.git`
1. `cd ethertdd.js`
1. `python httpserver.py`
1. Launch [AlethZero v0.9.9](https://github.com/ethereum/cpp-ethereum/wiki) or greater.
1. Uncheck "NatSpec Enabled" under the "Special" menu to allow transactions to go through without prompting. (Be sure to re-check this when you're done!)
1. Check "Force Mining" and "Use Private Chain." Your "Special" menu should look like this when you're done:  
![Special menu](http://i.imgur.com/qtavYc7.png)
1. Click the "Mine" button.  
![Mine button](http://i.imgur.com/dCKGz1X.png)
1. Navigate to "http://localhost:8081" in the AlethZero browser.
1. Watch all the tests (hopefully) pass!
