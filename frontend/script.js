const CONTRACT_ADDRESS = "0x8a7fD35b2c3E4A1B9e2A5c6F7d8C9b0A1e2F3d45";

// Web3.Storage API token (optional). If left empty, user must paste CID.
const WEB3STORAGE_TOKEN = ""; // set your token here if you want auto-upload

const ABI = [
  "function sendMessage(address to, string calldata cid) external",
  "function getInbox(address user) external view returns (uint256[] memory)",
  "function getMessage(uint256 id) external view returns (address from, address to, string memory cid, uint256 timestamp)"
];

let provider, signer, contract;

async function connectWallet() {
  if (!window.ethereum) {
    alert("Install MetaMask or compatible wallet.");
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  const addr = await signer.getAddress();
  document.getElementById("status").innerText = `Connected: ${addr}`;
  document.getElementById("connectButton").classList.add("hidden");
  document.getElementById("sendSection").classList.remove("hidden");
  document.getElementById("inboxSection").classList.remove("hidden");
}

async function uploadToWeb3Storage(text) {
  if (!WEB3STORAGE_TOKEN) return null;
  try {
    const client = new Web3Storage({ token: WEB3STORAGE_TOKEN });
    const blob = new Blob([text], { type: "text/plain" });
    const cid = await client.put([new File([blob], "message.txt")], { wrapWithDirectory: false });
    return cid;
  } catch (err) {
    console.error("upload failed", err);
    return null;
  }
}

async function sendMessageFlow(useCidOnly = false) {
  const to = document.getElementById("toInput").value.trim();
  if (!to) return alert("Enter recipient address.");
  let cid = document.getElementById("cidInput").value.trim();

  if (!useCidOnly) {
    const text = document.getElementById("messageInput").value.trim();
    if (!text && !cid) return alert("Either enter message text or paste CID.");
    if (text && !cid) {
      if (!WEB3STORAGE_TOKEN) {
        cid = prompt("No WEB3STORAGE_TOKEN set in script. Please upload your message to IPFS and paste the CID here:");
        if (!cid) return;
      } else {
        document.getElementById("status").innerText = "Uploading message to Web3.Storage...";
        cid = await uploadToWeb3Storage(text);
        if (!cid) return alert("Upload failed; paste CID manually.");
      }
    }
  } else {
    if (!cid) return alert("Paste a CID to send.");
  }

  try {
    const tx = await contract.sendMessage(to, cid);
    document.getElementById("status").innerText = "Sending message on-chain...";
    await tx.wait();
    document.getElementById("status").innerText = `Message sent (CID: ${cid})`;
  } catch (err) {
    console.error(err);
    document.getElementById("status").innerText = "Send failed or rejected.";
  }
}

async function refreshInbox() {
  try {
    const addr = await signer.getAddress();
    const ids = await contract.getInbox(addr);
    const list = document.getElementById("inboxList");
    list.innerHTML = "";
    if (ids.length === 0) {
      list.innerHTML = "<li>(no messages)</li>";
      return;
    }
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i].toNumber ? ids[i].toNumber() : parseInt(ids[i]);
      const msg = await contract.getMessage(id);
      const from = msg[0];
      const cid = msg[2];
      const ts = msg[3].toNumber ? msg[3].toNumber() : parseInt(msg[3]);
      const date = new Date(ts * 1000).toLocaleString();
      const li = document.createElement("li");
      li.innerHTML = `<strong>From:</strong> ${from}<br/>
                      <strong>Date:</strong> ${date}<br/>
                      <strong>CID:</strong> <a href="https://ipfs.io/ipfs/${cid}" target="_blank">${cid}</a>`;
      list.appendChild(li);
    }
  } catch (err) {
    console.error(err);
    document.getElementById("inboxList").innerHTML = "<li>Unable to load inbox</li>";
  }
}

document.getElementById("connectButton").onclick = connectWallet;
document.getElementById("sendButton").onclick = () => sendMessageFlow(false);
document.getElementById("sendCidButton").onclick = () => sendMessageFlow(true);
document.getElementById("refreshInbox").onclick = refreshInbox;

/* Optional: Web3.Storage import if token used (dynamic)
   To use Web3.Storage upload, include their script in index.html:
   <script type="module">
     import { Web3Storage } from "https://unpkg.com/web3.storage/dist/bundle.esm.min.js"
     window.Web3Storage = Web3Storage;
   </script>
*/
