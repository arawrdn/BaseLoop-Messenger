# BaseLoop Messenger

BaseLoop Messenger is a minimal decentralized messaging layer for the BaseLoop ecosystem.  
Send short messages between wallets or `.blup` identities; message contents are stored off-chain (IPFS / Web3.Storage) and the contract records immutable CIDs and timestamps on-chain.

**Core idea:** require a BLOOPASS NFT to reduce spam and link message senders to verified early supporters.

---

## Features
- Send message (IPFS CID) on-chain; contract stores `from`, `to`, `cid`, `timestamp`.
- Inbox lookup: read message IDs for any recipient and fetch message metadata.
- Sender must hold at least one BLOOPASS NFT (on-chain check).
- Minimal, audited-friendly Solidity (no OpenZeppelin).
- Frontend uses Ethers.js and supports optional Web3.Storage upload.

---

## Contracts
- `MessageRegistry.sol` — records message CIDs and provides inbox accessors.

Constructor args:
- `bloopassAddress` (address of BLOOPASS ERC721 contract)

---

## Frontend
- Simple HTML + JS UI to connect wallet, upload message to Web3.Storage (or paste CID), send message on-chain, and view inbox.
- Replace `CONTRACT_ADDRESS` and `WEB3STORAGE_TOKEN` in `frontend/script.js` after deploy.

---

## Future ideas
- Encrypted messages (symmetric encryption, store encrypted CID).
- Integration with `.blup` resolver for sending to name strings.
- Rate-limits / reputation via BLUP staking to further prevent spam.
- Attach NFTs (BLOOPASS badge) in the UI.

---

## License
MIT © 2026 BaseLoop Team
