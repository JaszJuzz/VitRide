// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DecentralizedRideSharing
 * @dev Smart Contract untuk layanan ride-sharing dengan sistem Escrow
 * Dibuat untuk memenuhi ujian Advanced Blockchain Programming
 */
contract RideSharing {
    
    // Enum untuk status perjalanan sesuai spesifikasi 
    enum RideStatus { Requested, Accepted, Funded, Started, CompletedByDriver, Finalized, Cancelled }

    // Struktur data untuk Pengemudi [cite: 37, 55]
    struct Driver {
        string name;
        string plateNumber;
        string vehicleType;
        uint256 ratePerKm; // atau rate tetap
        bool isRegistered;
        address walletAddress;
    }

    // Struktur data untuk Perjalanan (Ride) [cite: 42, 58]
    struct Ride {
        uint256 rideId;
        address payable rider;      // Penumpang
        address payable driver;     // Pengemudi
        string pickupLocation;
        string destination;
        uint256 fare;               // Harga yang disepakati
        string notes;
        RideStatus status;
        bool isValueLocked;         // Penanda apakah uang ada di escrow
    }

    uint256 public rideCounter;
    mapping(address => Driver) public drivers; // Mapping address ke data Driver [cite: 57]
    mapping(uint256 => Ride) public rides;     // Mapping ID ke data Ride
    address[] public driverList;               // Untuk keperluan frontend (list driver)

    // Events untuk logging aktivitas blockchain
    event DriverRegistered(address indexed driverAddress, string name);
    event RideRequested(uint256 indexed rideId, address indexed rider);
    event RideAccepted(uint256 indexed rideId, address indexed driver);
    event RideFunded(uint256 indexed rideId, uint256 amount);
    event RideStarted(uint256 indexed rideId);
    event RideCompleted(uint256 indexed rideId);
    event RideFinalized(uint256 indexed rideId, uint256 amountPaid);

    // --- A. DATA PENGEMUDI ---

    /**
     * @dev Mendaftarkan pengemudi baru [cite: 56]
     * @param _name Nama pengemudi
     * @param _plate Plat nomor kendaraan
     * @param _vehicleType Jenis kendaraan
     * @param _rate Tarif pengemudi
     */
    function registerDriver(string memory _name, string memory _plate, string memory _vehicleType, uint256 _rate) public {
        require(!drivers[msg.sender].isRegistered, "Driver already registered"); // [cite: 38]

        drivers[msg.sender] = Driver({
            name: _name,
            plateNumber: _plate,
            vehicleType: _vehicleType,
            ratePerKm: _rate,
            isRegistered: true,
            walletAddress: msg.sender
        });

        driverList.push(msg.sender);
        emit DriverRegistered(msg.sender, _name);
    }

    /**
     * @dev Melihat data pengemudi [cite: 57]
     */
    function getDriver(address _driverAddress) public view returns (Driver memory) {
        return drivers[_driverAddress];
    }

    // --- B. PEMESANAN PERJALANAN & ESCROW ---

    /**
     * @dev Penumpang membuat pesanan perjalanan [cite: 59]
     * Status awal: Requested [cite: 44]
     */
    function requestRide(string memory _pickup, string memory _destination, uint256 _fare, string memory _notes) public {
        rideCounter++;
        rides[rideCounter] = Ride({
            rideId: rideCounter,
            rider: payable(msg.sender),
            driver: payable(address(0)), // Belum ada driver
            pickupLocation: _pickup,
            destination: _destination,
            fare: _fare,
            notes: _notes,
            status: RideStatus.Requested,
            isValueLocked: false
        });

        emit RideRequested(rideCounter, msg.sender);
    }

    /**
     * @dev Pengemudi menerima pesanan [cite: 66]
     * Status berubah menjadi: Accepted [cite: 47]
     */
    function acceptRide(uint256 _rideId) public {
        require(drivers[msg.sender].isRegistered, "Only registered drivers can accept rides");
        require(rides[_rideId].status == RideStatus.Requested, "Ride not available");

        rides[_rideId].driver = payable(msg.sender);
        rides[_rideId].status = RideStatus.Accepted;

        emit RideAccepted(_rideId, msg.sender);
    }

    /**
     * @dev Penumpang membayar ke Smart Contract (Escrow) [cite: 66, 72]
     * Status berubah menjadi: Funded [cite: 48]
     * Fungsi ini 'payable' agar bisa menerima Ether.
     */
    function fundRide(uint256 _rideId) public payable {
        Ride storage ride = rides[_rideId];
        
        require(msg.sender == ride.rider, "Only rider can fund");
        require(ride.status == RideStatus.Accepted, "Ride not accepted yet");
        require(msg.value == ride.fare, "Incorrect fund amount");

        ride.isValueLocked = true;
        ride.status = RideStatus.Funded;

        emit RideFunded(_rideId, msg.value);
    }

    /**
     * @dev Pengemudi memulai perjalanan (Opsional untuk tracking status) [cite: 49]
     */
    function startRide(uint256 _rideId) public {
        require(msg.sender == rides[_rideId].driver, "Only driver can start");
        require(rides[_rideId].status == RideStatus.Funded, "Ride not funded yet");
        
        rides[_rideId].status = RideStatus.Started;
        emit RideStarted(_rideId);
    }

    /**
     * @dev Pengemudi menyelesaikan perjalanan [cite: 67]
     * Status berubah menjadi: CompletedByDriver [cite: 50]
     */
    function completeRide(uint256 _rideId) public {
        require(msg.sender == rides[_rideId].driver, "Only driver can complete");
        require(rides[_rideId].status == RideStatus.Started || rides[_rideId].status == RideStatus.Funded, "Invalid status");

        rides[_rideId].status = RideStatus.CompletedByDriver;
        emit RideCompleted(_rideId);
    }

    /**
     * @dev Penumpang konfirmasi selesai, dana cair ke Pengemudi [cite: 67, 73]
     * Status berubah menjadi: Finalized [cite: 51]
     */
    function confirmArrival(uint256 _rideId) public {
        Ride storage ride = rides[_rideId];

        require(msg.sender == ride.rider, "Only rider can confirm");
        require(ride.status == RideStatus.CompletedByDriver, "Driver has not completed ride");
        require(ride.isValueLocked, "No funds locked");

        // Perubahan state sebelum transfer (mencegah re-entrancy)
        ride.status = RideStatus.Finalized;
        ride.isValueLocked = false;
        uint256 amount = ride.fare;

        // Transfer dana dari kontrak ke pengemudi
        (bool success, ) = ride.driver.call{value: amount}("");
        require(success, "Transfer failed");

        emit RideFinalized(_rideId, amount);
    }
    
    // Fungsi bantuan untuk mendapatkan jumlah total ride (untuk frontend loop)
    function getRideCount() public view returns (uint256) {
        return rideCounter;
    }
}
