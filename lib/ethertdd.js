var EtherTDD = function(web3, promiselib, BLOCK_DELAY) {
    BLOCK_DELAY = BLOCK_DELAY || 0;

    var _cache = {};
    var get = function(file, callback) {
        if (_cache[file]) {
            return callback(_cache[file]);
        }

        var req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            if (req.readyState == 4 && req.status == 200) {
                _cache[file] = req.responseText;
                callback(req.responseText);
            }
        };
        req.open('GET', file, true);
        req.send();
    };

    var nextBlockPromise = function (deferral) {
        return function(err, res) {
            var oldBlock;
            var newBlockFilter = web3.eth.filter('latest');
            newBlockFilter.watch(function () {
                if (!oldBlock) {
                    oldBlock = web3.eth.blockNumber + BLOCK_DELAY;
                }

                if (oldBlock >= web3.eth.blockNumber) return;
                if (err) {
                    deferral.reject(err);
                } else {
                    deferral.resolve(res);
                }
                newBlockFilter.stopWatching();
            });
        };
    };

    var addPromiseFunctionsToContract = function (contract, desc, address) {
        // Modified version of the function at https://github.com/ethereum/web3.js/
        // blob/271b00f0692e9b89f7a3a611df79d078bc7a2d26/dist/web3.js#L1374
        var ETH_SIGNATURE_LENGTH = 4;
        var inputParser = web3.abi.inputParser(desc);
        var outputParser = web3.abi.outputParser(desc);

        var filterFunctions = function (json) {
            return json.filter(function (current) {
                return current.type === 'function'; 
            });
        }

        var utils = { 
            extractDisplayName: function (name) {
                var length = name.indexOf('('); 
                return length !== -1 ? name.substr(0, length) : name;
            },
            extractTypeName: function (name) {
                /// TODO: make it invulnerable
                var length = name.indexOf('(');
                return length !== -1 ? name.substr(length + 1, name.length - 1 - (length + 1)).replace(' ', '') : ""; 
            }
        };

        var functionSignatureFromAscii = function (name) {
            return web3.sha3(web3.fromAscii(name)).slice(0, 2 + ETH_SIGNATURE_LENGTH * 2); 
        };

        // create contract functions
        filterFunctions(desc).forEach(function (method) {

            var displayName = utils.extractDisplayName(method.name);
            var typeName = utils.extractTypeName(method.name);

            var impl = function () {
                /*jshint maxcomplexity:7 */
                var params = Array.prototype.slice.call(arguments);
                var sign = functionSignatureFromAscii(method.name);
                var parsed = inputParser[displayName][typeName].apply(null, params);

                var options = contract._options || {};
                options.to = address;
                options.data = sign + parsed;
                
                var isTransaction = contract._isTransaction === true || (contract._isTransaction !== false && !method.constant);
                var collapse = options.collapse !== false;
                
                // reset
                contract._options = {};
                contract._isTransaction = null;

                if (isTransaction) {
                    var callback = undefined;
                    var promise = undefined;

                    if (promiselib && promiselib.defer) {
                        var deferral = promiselib.defer();
                        promise = deferral.promise;
                        callback = nextBlockPromise(deferral);
                    }

                    web3.eth.sendTransaction(options, callback);
                    return promise;
                }
                
                var output = web3.eth.call(options);
                var ret = outputParser[displayName][typeName](output);
                if (collapse)
                {
                    if (ret.length === 1)
                        ret = ret[0];
                    else if (ret.length === 0)
                        ret = null;
                }
                return ret;
            };

            contract[displayName] = impl;
            contract[displayName][typeName] = impl;
        });
    };

    var Contract = function() {
        var contractPath;
        var abi;
        var compiledCode;

        if (arguments.length == 1) {
            contractPath = arguments[0];

        } else if (arguments.length == 2) {
            abi = arguments[0];
            compiledCode = arguments[1];

        } else {
            return;
        }

        var _loadContract = function (abi, address, callback, err) {
            var cclass = web3.eth.contract(abi);

            if (address) {
                contract = cclass(address);
            }

            if (contract && promiselib) {
                addPromiseFunctionsToContract(contract, abi, address);
            }

            callback(err, contract);
        };

        var _load = function(address, callback) {
            var promise = undefined;
         
            if (callback === undefined && promiselib !== undefined) {
                var deferral = promiselib.defer();
                callback = function (err, res) {
                    if (err) {
                        deferral.reject(err);
                    } else {
                        deferral.resolve(res);
                    }
                };
                promise = deferral.promise;
            }

            get(contractPath + '.abi', function(abi) {
                abi = JSON.parse(abi);
                _loadContract(abi, address, callback);
            });
            
            return promise;
        };

        var _createContract = function(abi, options, callback) {
            web3.eth.sendTransaction(options, function(err, address) {
                console.log(address);
                _loadContract(abi, address, callback, err);
            });
        };

        var _create = function(options, callback) {
            var promise = undefined;
            options = options || {};
            options.from = options.from || web3.eth.accounts[0];
            options.gas = options.gas || 1000000;
            options.gasprice = options.gasprice || 10;

            if (callback === undefined && promiselib !== undefined) {
                var deferral = promiselib.defer();
                callback = nextBlockPromise(deferral);
                promise = deferral.promise;
            }
         
            if (abi && compiledCode) {
                options.data = compiledCode;
                _createContract(abi, options, callback);
                return promise;
            }

            get(contractPath + '.binary', function(hex) {    
                options.data = '0x'+hex.replace(/\n/g, "");

                get(contractPath + '.abi', function(abi) {
                    abi = JSON.parse(abi);
                    _createContract(abi, options, callback);
                });
            });

            return promise;
        };

        return {
            'create': _create,
            'load': _load
        }
    };

    return {
        'Contract': Contract,
    };
};

EtherTDD.NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
