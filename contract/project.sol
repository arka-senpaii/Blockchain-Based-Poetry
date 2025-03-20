// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PoetryContract {
    struct Poem {
        string title;
        string content;
        address author;
        uint256 timestamp;
    }

    Poem[] public poems;
    mapping(address => uint256) public authorPoemCount;

    event PoemWritten(address indexed author, string title, uint256 timestamp);

    function writePoem(string memory _title, string memory _content) public {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_content).length > 0, "Content cannot be empty");

        poems.push(Poem(_title, _content, msg.sender, block.timestamp));
        authorPoemCount[msg.sender]++;

        emit PoemWritten(msg.sender, _title, block.timestamp);
    }

    function getPoem(uint256 index) public view returns (string memory, string memory, address, uint256) {
        require(index < poems.length, "Invalid poem index");
        Poem storage poem = poems[index];
        return (poem.title, poem.content, poem.author, poem.timestamp);
    }

    function getTotalPoems() public view returns (uint256) {
        return poems.length;
    }
}

