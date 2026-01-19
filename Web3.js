// ==========================================================
//   ViTRide Logic - Prototyping Final Version
//   Mengcover Use Case A, B, dan C (Escrow Cycle)
// ==========================================================

let web3;
let contract;
let userAccount;

// [PENTING] Ganti dengan alamat kontrak hasil deploy Anda
const contractAddress = "0xf8e81D47203A594245E36C48e151709F0C19fBe8"; 

// ABI (Application Binary Interface)
const contractABI = [
    { "inputs": [{"internalType": "uint256","name": "_rideId","type": "uint256"}], "name": "acceptRide", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{"internalType": "uint256","name": "_rideId","type": "uint256"}], "name": "completeRide", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{"internalType": "uint256","name": "_rideId","type": "uint256"}], "name": "confirmArrival", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "anonymous": false, "inputs": [{"indexed": true,"internalType": "address","name": "driverAddress","type": "address"},{"indexed": false,"internalType": "string","name": "name","type": "string"}], "name": "DriverRegistered", "type": "event" },
    { "inputs": [{"internalType": "uint256","name": "_rideId","type": "uint256"}], "name": "fundRide", "outputs": [], "stateMutability": "payable", "type": "function" },
    { "inputs": [{"internalType": "string","name": "_name","type": "string"},{"internalType": "string","name": "_plate","type": "string"},{"internalType": "string","name": "_vehicleType","type": "string"},{"internalType": "uint256","name": "_rate","type": "uint256"}], "name": "registerDriver", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{"internalType": "string","name": "_pickup","type": "string"},{"internalType": "string","name": "_destination","type": "string"},{"internalType": "uint256","name": "_fare","type": "uint256"},{"internalType": "string","name": "_notes","type": "string"}], "name": "requestRide", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "anonymous": false, "inputs": [{"indexed": true,"internalType": "uint256","name": "rideId","type": "uint256"},{"indexed": true,"internalType": "address","name": "driver","type": "address"}], "name": "RideAccepted", "type": "event" },
    { "anonymous": false, "inputs": [{"indexed": true,"internalType": "uint256","name": "rideId","type": "uint256"}], "name": "RideCompleted", "type": "event" },
    { "anonymous": false, "inputs": [{"indexed": true,"internalType": "uint256","name": "rideId","type": "uint256"},{"indexed": false,"internalType": "uint256","name": "amountPaid","type": "uint256"}], "name": "RideFinalized", "type": "event" },
    { "anonymous": false, "inputs": [{"indexed": true,"internalType": "uint256","name": "rideId","type": "uint256"},{"indexed": false,"internalType": "uint256","name": "amount","type": "uint256"}], "name": "RideFunded", "type": "event" },
    { "anonymous": false, "inputs": [{"indexed": true,"internalType": "uint256","name": "rideId","type": "uint256"},{"indexed": true,"internalType": "address","name": "rider","type": "address"}], "name": "RideRequested", "type": "event" },
    { "anonymous": false, "inputs": [{"indexed": true,"internalType": "uint256","name": "rideId","type": "uint256"}], "name": "RideStarted", "type": "event" },
    { "inputs": [{"internalType": "uint256","name": "_rideId","type": "uint256"}], "name": "startRide", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{"internalType": "uint256","name": "","type": "uint256"}], "name": "driverList", "outputs": [{"internalType": "address","name": "","type": "address"}], "stateMutability": "view", "type": "function" },
    { "inputs": [{"internalType": "address","name": "","type": "address"}], "name": "drivers", "outputs": [{"internalType": "string","name": "name","type": "string"},{"internalType": "string","name": "plateNumber","type": "string"},{"internalType": "string","name": "vehicleType","type": "string"},{"internalType": "uint256","name": "ratePerKm","type": "uint256"},{"internalType": "bool","name": "isRegistered","type": "bool"},{"internalType": "address","name": "walletAddress","type": "address"}], "stateMutability": "view", "type": "function" },
    { "inputs": [{"internalType": "address","name": "_driverAddress","type": "address"}], "name": "getDriver", "outputs": [{"components": [{"internalType": "string","name": "name","type": "string"},{"internalType": "string","name": "plateNumber","type": "string"},{"internalType": "string","name": "vehicleType","type": "string"},{"internalType": "uint256","name": "ratePerKm","type": "uint256"},{"internalType": "bool","name": "isRegistered","type": "bool"},{"internalType": "address","name": "walletAddress","type": "address"}], "internalType": "struct RideSharing.Driver", "name": "", "type": "tuple"}], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "getRideCount", "outputs": [{"internalType": "uint256","name": "","type": "uint256"}], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "rideCounter", "outputs": [{"internalType": "uint256","name": "","type": "uint256"}], "stateMutability": "view", "type": "function" },
    { "inputs": [{"internalType": "uint256","name": "","type": "uint256"}], "name": "rides", "outputs": [{"internalType": "uint256","name": "rideId","type": "uint256"},{"internalType": "address payable","name": "rider","type": "address"},{"internalType": "address payable","name": "driver","type": "address"},{"internalType": "string","name": "pickupLocation","type": "string"},{"internalType": "string","name": "destination","type": "string"},{"internalType": "uint256","name": "fare","type": "uint256"},{"internalType": "string","name": "notes","type": "string"},{"internalType": "uint8","name": "status","type": "uint8"},{"internalType": "bool","name": "isValueLocked","type": "bool"}], "stateMutability": "view", "type": "function" }
];

// --- 1. KONEKSI & AUTHENTICATION ---
async function connectWallet() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            handleAccountsChanged(accounts);
        } catch (error) {
            alert("Koneksi Dibatalkan: " + error.message);
        }
    } else {
        alert("MetaMask tidak terdeteksi!");
    }
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else {
        userAccount = accounts[0];
        document.getElementById("loginSection").classList.add("hidden");
        document.getElementById("userSection").classList.remove("hidden");
        document.getElementById("accountDisplay").innerText = userAccount.substring(0, 6) + "..." + userAccount.substring(38);
        
        contract = new web3.eth.Contract(contractABI, contractAddress);
        loadRides(); // Load data otomatis saat connect
    }
}

function disconnectWallet() {
    userAccount = null;
    contract = null;
    document.getElementById("loginSection").classList.remove("hidden");
    document.getElementById("userSection").classList.add("hidden");
    document.getElementById("ridesContainer").innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px;">Silakan hubungkan wallet kembali.</div>';
}

if(window.ethereum) {
    window.ethereum.on('accountsChanged', handleAccountsChanged);
}

// --- USE CASE A: REGISTRASI PENGEMUDI ---
// Mencakup: Nama, Plat, Tipe Kendaraan, Tarif
async function registerDriver() {
    if (!contract) return alert("Konek wallet dulu!");
    
    const name = document.getElementById("driverName").value;
    const plate = document.getElementById("driverPlate").value;
    const vehicle = document.getElementById("driverVehicle").value; // Menangkap input select
    const rate = document.getElementById("driverRate").value;

    if (!name || !plate || !rate) return alert("Mohon lengkapi semua data!");

    try {
        await contract.methods.registerDriver(name, plate, vehicle, rate)
            .send({ from: userAccount });
        alert("✅ Registrasi Berhasil! Anda kini terdaftar di Blockchain.");
    } catch (err) {
        console.error(err);
        alert("Gagal Registrasi: " + err.message);
    }
}

// --- USE CASE B: PEMESANAN PERJALANAN ---
// Mencakup: Pickup, Destinasi, Tarif, Catatan
async function requestRide() {
    if (!contract) return alert("Konek wallet dulu!");

    const pickup = document.getElementById("pickup").value;
    const dest = document.getElementById("destination").value;
    const notes = document.getElementById("notes").value; // Menangkap input catatan
    const fareEth = document.getElementById("fare").value;

    if (!pickup || !dest || !fareEth) return alert("Mohon lengkapi detail pesanan!");

    try {
        const fareWei = web3.utils.toWei(fareEth, "ether");
        // Parameternya: _pickup, _destination, _fare, _notes
        await contract.methods.requestRide(pickup, dest, fareWei, notes)
            .send({ from: userAccount });
        
        alert("✅ Order Berhasil Dibuat dan Dipublikasikan!");
        loadRides();
    } catch (err) {
        console.error(err);
        alert("Gagal Request: " + err.message);
    }
}

// --- USE CASE C: SIKLUS HIDUP RIDE & ESCROW (DISPLAY LOGIC) ---
async function loadRides() {
    if (!contract) return;
    const container = document.getElementById("ridesContainer");
    container.innerHTML = '<div style="text-align:center; padding:20px;">Memuat data dari Blockchain...</div>';

    try {
        const rideCount = await contract.methods.rideCounter().call();
        let htmlContent = "";
        
        // Warna status untuk badge
        const statusConfig = [
            { label: "REQUESTED", color: "#6B7280", bg: "#F3F4F6" },   // 0
            { label: "ACCEPTED", color: "#2563EB", bg: "#EFF6FF" },    // 1
            { label: "FUNDED", color: "#7C3AED", bg: "#F5F3FF" },      // 2
            { label: "STARTED", color: "#D97706", bg: "#FFFBEB" },     // 3
            { label: "ARRIVED", color: "#EA580C", bg: "#FFF7ED" },     // 4
            { label: "FINALIZED", color: "#059669", bg: "#ECFDF5" },   // 5
            { label: "CANCELLED", color: "#DC2626", bg: "#FEF2F2" }    // 6
        ];

        // Loop order dari terbaru (Descending)
        for (let i = rideCount; i >= 1; i--) {
            const ride = await contract.methods.rides(i).call();
            const status = parseInt(ride.status);
            const conf = statusConfig[status] || statusConfig[0];
            
            // Cek Peran User untuk menampilkan tombol yang tepat
            const isRider = (userAccount.toLowerCase() === ride.rider.toLowerCase());
            const isDriver = (userAccount.toLowerCase() === ride.driver.toLowerCase());
            
            let btnAction = "";

            // LOGIKA USE CASE C (Escrow Flow)
            
            // 1. Status REQUESTED -> Driver (siapa saja) bisa Accept
            if (status === 0) {
                btnAction = `<button class="btn-action bg-blue" onclick="processRide(${ride.rideId}, 'accept')">🚗 Driver: Terima Order Ini</button>`;
            }
            
            // 2. Status ACCEPTED -> Penumpang (Rider Only) Bayar Escrow
            else if (status === 1) {
                if (isRider) {
                    btnAction = `<button class="btn-action bg-purple" onclick="processRide(${ride.rideId}, 'fund', '${ride.fare}')">💸 Penumpang: Bayar ke Escrow</button>`;
                } else {
                    btnAction = `<div style="font-size:0.8rem; color:#888; margin-top:10px;">Menunggu pembayaran penumpang...</div>`;
                }
            }
            
            // 3. Status FUNDED -> Driver (Accepted Driver Only) Start Jalan
            else if (status === 2) {
                if (isDriver) {
                    btnAction = `<button class="btn-action bg-yellow" onclick="processRide(${ride.rideId}, 'start')">▶️ Driver: Mulai Perjalanan</button>`;
                } else {
                    btnAction = `<div style="font-size:0.8rem; color:#888; margin-top:10px;">Menunggu driver memulai jalan...</div>`;
                }
            }
            
            // 4. Status STARTED -> Driver (Accepted Driver Only) Complete
            else if (status === 3) {
                if (isDriver) {
                    btnAction = `<button class="btn-action bg-orange" onclick="processRide(${ride.rideId}, 'complete')">🏁 Driver: Sampai Tujuan</button>`;
                }
            }
            
            // 5. Status COMPLETED -> Penumpang (Rider Only) Konfirmasi
            else if (status === 4) {
                if (isRider) {
                    btnAction = `<button class="btn-action bg-green" onclick="processRide(${ride.rideId}, 'confirm')">✅ Penumpang: Konfirmasi & Cairkan Dana</button>`;
                } else {
                    btnAction = `<div style="font-size:0.8rem; color:#888; margin-top:10px;">Menunggu konfirmasi penumpang...</div>`;
                }
            }
            
            // 6. FINALIZED
            else if (status === 5) {
                btnAction = `<div style="margin-top:10px; color:#059669; font-weight:bold; font-size:0.9rem;">✨ Transaksi Selesai & Dana Cair</div>`;
            }

            htmlContent += `
            <div class="ride-card" style="border-left-color: ${conf.color}">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <h3 style="margin:0;">Ride #${ride.rideId}</h3>
                    <span class="status-badge" style="color:${conf.color}; background:${conf.bg}">${conf.label}</span>
                </div>
                
                <div class="ride-info">
                    <strong>📍 Jemput:</strong> ${ride.pickupLocation}<br>
                    <strong>🏁 Tujuan:</strong> ${ride.destination}<br>
                    <strong>📝 Catatan:</strong> ${ride.notes || "-"}<br>
                    <strong>💰 Tarif:</strong> ${web3.utils.fromWei(ride.fare, 'ether')} ETH
                </div>
                
                ${btnAction}
            </div>`;
        }

        container.innerHTML = htmlContent || '<div style="text-align:center; padding:40px; color:#aaa;">Belum ada order. Jadilah yang pertama!</div>';

    } catch (err) {
        console.error(err);
        container.innerHTML = '<div style="color:red; text-align:center;">Gagal memuat data. Pastikan terkoneksi ke Sepolia.</div>';
    }
}

// --- EKSEKUTOR TRANSAKSI ---
async function processRide(id, action, amount) {
    try {
        if (action === 'accept') await contract.methods.acceptRide(id).send({ from: userAccount });
        if (action === 'fund') await contract.methods.fundRide(id).send({ from: userAccount, value: amount });
        if (action === 'start') await contract.methods.startRide(id).send({ from: userAccount });
        if (action === 'complete') await contract.methods.completeRide(id).send({ from: userAccount });
        if (action === 'confirm') {
            await contract.methods.confirmArrival(id).send({ from: userAccount });
            alert("Terima kasih! Dana escrow telah diteruskan ke Driver.");
        }
        loadRides();
    } catch (err) {
        alert("Gagal: " + err.message);
    }
}