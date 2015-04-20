var BLOCK_DELAY = 0;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

var web3 = require('web3');
var ethertdd = new EtherTDD(web3, Q, BLOCK_DELAY);
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8080'));

describe('ExampleContract', function() {
  var contract;

  beforeEach(function(done) {
    ethertdd.Contract('/contracts/example').create().then(function (obj) {
        contract = obj;
        done();
    });
  });

  it('should recognize its owner', function() {
    expect(contract.call().isOwner()).toBe(true);
  });

  it('should allow the fee to be set', function(done) {
    expect(contract.fee().toNumber()).toEqual(10000);
    contract.setFee(9000).then(function (res) {
        expect(contract.fee().toNumber()).toEqual(9000);
        done();
    });
  });

  it('should allow name registration', function(done) {
    expect(contract.names('foobar')).toEqual(EtherTDD.NULL_ADDRESS);

    var fee = contract.fee().toNumber();
    contract
    .sendTransaction({value: fee})
    .setName('foobar', web3.eth.accounts[0])
    .then(function (res) {    
        expect(contract.names('foobar')).toEqual(web3.eth.accounts[0]);
        done();
    });
  });

  if (web3.eth.accounts.length < 2) return;

  it('should allow transfers of ownership', function() {
    contract.setOwner(web3.eth.accounts[1]).then(function (res) {
        expect(contract.owner()).toEqual(web3.eth.accounts[1]);
    });
  });
});
