// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/**
 * @title MessageRegistry
 * @notice Minimal on-chain registry for message CIDs (IPFS). Senders must hold at least one BLOOPASS NFT.
 *
 * Storage:
 *  - messages[]: array of Message structs (immutable once created)
 *  - inbox[recipient] => list of messageIds
 *
 * Usage:
 *  - sendMessage(to, cid)  -> stores cid and emits MessageSent
 *  - getInbox(user) -> returns array of message ids
 *  - getMessage(id) -> returns message details
 */

interface IBLOOPASS {
    function balanceOf(address owner) external view returns (uint256);
}

contract MessageRegistry {
    struct Message {
        address from;
        address to;
        string cid; // IPFS CID or other content-address
        uint256 timestamp;
    }

    address public owner;
    address public immutable bloopassAddress;

    Message[] private messages;
    mapping(address => uint256[]) private inbox;

    event MessageSent(uint256 indexed id, address indexed from, address indexed to, string cid, uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    constructor(address _bloopassAddress) {
        require(_bloopassAddress != address(0), "zero address");
        owner = msg.sender;
        bloopassAddress = _bloopassAddress;
    }

    /**
     * @notice Send a message to `to` with off-chain content referenced by `cid`.
     * Sender must own at least one BLOOPASS NFT.
     */
    function sendMessage(address to, string calldata cid) external {
        require(to != address(0), "zero recipient");
        require(bytes(cid).length != 0, "empty cid");

        // require sender to hold at least one BLOOPASS NFT
        uint256 bal = IBLOOPASS(bloopassAddress).balanceOf(msg.sender);
        require(bal > 0, "must hold BLOOPASS");

        Message memory m = Message({ from: msg.sender, to: to, cid: cid, timestamp: block.timestamp });
        messages.push(m);
        uint256 id = messages.length - 1;
        inbox[to].push(id);

        emit MessageSent(id, msg.sender, to, cid, block.timestamp);
    }

    /** @notice Returns message count (total) */
    function totalMessages() external view returns (uint256) {
        return messages.length;
    }

    /** @notice Get message by id */
    function getMessage(uint256 id) external view returns (address from, address to, string memory cid, uint256 timestamp) {
        require(id < messages.length, "invalid id");
        Message storage m = messages[id];
        return (m.from, m.to, m.cid, m.timestamp);
    }

    /** @notice Return inbox ids for an address */
    function getInbox(address user) external view returns (uint256[] memory) {
        return inbox[user];
    }

    /** Owner functions */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero address");
        address prev = owner;
        owner = newOwner;
        emit OwnershipTransferred(prev, newOwner);
    }

    // Receive ETH for future expansions
    receive() external payable {}
}
