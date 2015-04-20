contract example{
    address public owner;
    uint public fee;
    mapping (bytes32 => address) public names;

    function example() {
        owner = msg.sender;
        fee = 10000; // in wei
    }

    function setName(bytes32 name, address newAddress) returns (bool r) {
        if (!isOwner() || msg.value < fee || (names[name] != 0x0 && names[name] != msg.sender)) {
            return false;
        }
        names[name] = newAddress;

        if (msg.value > fee) {
            newAddress.send(msg.value - fee);
        }
        return true;
    }

    function setOwner(address newOwner) returns (bool r) {
        if (!isOwner()) return false;
        owner = newOwner;
        return true;
    }

    function setFee(uint32 newFee) returns (bool r) {
        if (!isOwner()) return false;
        fee = newFee;
        return true;
    }

    function isOwner() returns (bool r) {
        return msg.sender == owner;
    }

    function withdraw(uint32 amount) returns (bool r) {
        if (!isOwner()) return false;

        owner.send(amount);
        return true;
    }
}
