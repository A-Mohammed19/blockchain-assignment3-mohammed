// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

error LengthMismatch();
error CapExceeded();

contract MyToken is ERC20, ERC20Burnable, ERC20Capped, ERC20Pausable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 cap_,
        address initialReceiver_,
        uint256 initialMint_
    ) ERC20(name_, symbol_) ERC20Capped(cap_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        require(initialMint_ <= cap(), "Initial mint exceeds cap");
        _mint(initialReceiver_, initialMint_);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (totalSupply() + amount > cap()) revert CapExceeded();
        _mint(to, amount);
    }

    function airdrop(address[] calldata to, uint256[] calldata amounts) external onlyRole(MINTER_ROLE) {
        if (to.length != amounts.length) revert LengthMismatch();

        uint256 total = 0;
        for (uint i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }

        if (totalSupply() + total > cap()) revert CapExceeded();

        for (uint i = 0; i < to.length; i++) {
            _mint(to[i], amounts[i]);
        }
    }

    // ✅ This is now the ONLY override needed
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
