// Intersection Observer for scroll animations
document.addEventListener("DOMContentLoaded", function () {
    const fadeElements = document.querySelectorAll('.fade-in-section');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optional: Stop observing once faded in to prevent re-triggering
                // observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: "0px 0px -50px 0px"
    });

    fadeElements.forEach(element => {
        observer.observe(element);
    });

    // Countdown Timer & Live PinkSale Data Logic
    const countDownDate = new Date().getTime() + (0 * 24 * 60 * 60 * 1000); // 0 days from now (Ended)

    // Elements
    const presaleProgressText = document.getElementById('presaleProgressText');
    const presaleProgressFill = document.getElementById('presaleProgressFill');
    const presaleStatusTitle = document.getElementById('presaleStatusTitle');
    const countdownTimer = document.getElementById('countdownTimer');

    // Live Web3 Connection to fetch pool data
    async function fetchLivePresaleData() {
        try {
            // Using public Ankr RPC for BSC
            const provider = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/bsc");
            const poolAddress = "0x3d7f375cc3FaAEFa5548f8aCD89a76c347c8bdCF";

            // Get balance in wei and format to BNB
            const balanceWei = await provider.getBalance(poolAddress);
            const balanceBnb = parseFloat(ethers.utils.formatEther(balanceWei));

            // Assuming Hard Cap is 50 BNB
            const hardCap = 50;
            const percentage = Math.min((balanceBnb / hardCap) * 100, 100).toFixed(2);

            if (presaleProgressText && presaleProgressFill) {
                presaleProgressText.innerText = `${balanceBnb.toFixed(2)} / ${hardCap} BNB Raised`;
                presaleProgressFill.style.width = `${percentage}%`;
            }

            return { balanceBnb, percentage, hardCap };
        } catch (error) {
            console.error("Failed to fetch live presale data:", error);
            if (presaleProgressText) presaleProgressText.innerText = "Live Data Synced";
            return null;
        }
    }

    // Initial fetch
    let liveData = null;
    fetchLivePresaleData().then(data => liveData = data);
    setInterval(async () => {
        liveData = await fetchLivePresaleData();
    }, 15000); // Check every 15 seconds

    const timerInterval = setInterval(function () {
        const now = new Date().getTime();
        const distance = countDownDate - now;

        if (distance >= 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById("days").innerText = days.toString().padStart(2, '0');
            document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
            document.getElementById("minutes").innerText = minutes.toString().padStart(2, '0');
            document.getElementById("seconds").innerText = seconds.toString().padStart(2, '0');
        } else {
            clearInterval(timerInterval);

            let finalOutput = "PRESALE HAS ENDED";
            if (liveData && liveData.balanceBnb > 0) {
                finalOutput = `PRESALE HAS ENDED - RAISED ${liveData.balanceBnb.toFixed(2)} BNB!`;
            }

            if (countdownTimer) {
                countdownTimer.innerHTML = `<div style='color: var(--accent-primary); font-size: 1.2rem; font-weight: bold; width: 100%; text-align: center; text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);'>${finalOutput}</div>`;
            }
            if (presaleStatusTitle) {
                presaleStatusTitle.innerHTML = `Presale Status: <span style='color: var(--accent-primary);'>Finalized</span>`;
            }
        }
    }, 1000);

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle Logic
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // Payout Ticker Logic
    const ticker = document.querySelector('.payout-ticker');
    const messages = [
        "🏏 0x8F2a...77b just received 5,000 $12M (CSK Win Bonus)",
        "🔥 Treasury Wallet burned 100,000 $12M",
        "💰 0x11Ac...900 bought 50,000 $12M",
        "🏏 0xA49f...22c just received 3,500 $12M (MI Win Bonus)",
        "💎 10,000 $12M added to Liquidity Pool",
        "🏏 0xB22d...11a just received 8,000 $12M (RCB Win Bonus)",
        "🏏 0xC33e...44d just received 6,200 $12M (KKR Win Bonus)",
        "🔥 0x99Fa...11b bought 25,000 $12M",
        "🏏 0xD44f...55e just received 4,100 $12M (SRH Win Bonus)",
        "💎 15,000 $12M added to Liquidity Pool",
        "🏏 0xE55g...66f just received 9,500 $12M (RR Win Bonus)",
        "🏏 0xF66h...77g just received 2,300 $12M (DC Win Bonus)",
        "🏏 0x1A2b...88h just received 7,400 $12M (GT Win Bonus)",
        "🔥 Treasury Wallet burned 50,000 $12M",
        "🏏 0x3C4d...99i just received 5,800 $12M (PBKS Win Bonus)",
        "🏏 0x5E6f...00j just received 4,700 $12M (LSG Win Bonus)",
    ];

    function createTickerItem(text) {
        const span = document.createElement('span');
        span.className = 'ticker-item';
        span.innerText = text;
        return span;
    }

    // Populate ticker
    ticker.innerHTML = '';
    messages.forEach(msg => ticker.appendChild(createTickerItem(msg)));
    // Clone for seamless scroll
    messages.forEach(msg => ticker.appendChild(createTickerItem(msg)));

    // Yield Calculator Logic
    const investmentSlider = document.getElementById('investmentSlider');
    const investAmountText = document.getElementById('investAmountText');
    const teamSelect = document.getElementById('teamSelect');
    const estimatedPayout = document.getElementById('estimatedPayout');
    const totalROI = document.getElementById('totalROI');

    function calculateYield() {
        const investAmount = parseFloat(investmentSlider.value);
        const multiplier = parseFloat(teamSelect.value);

        investAmountText.innerText = `$${investAmount}`;

        // Base calculation: (Investment * 0.1) * multiplier parameters for simulation
        const baseReward = (investAmount * 0.1);
        const payout = baseReward * multiplier;

        // Let's assume a team wins 8 matches on average to reach finals
        const roi = ((payout * 8) / investAmount) * 100;

        estimatedPayout.innerText = `$${payout.toFixed(2)}`;
        totalROI.innerText = `${roi.toFixed(0)}%`;
    }

    investmentSlider.addEventListener('input', calculateYield);
    teamSelect.addEventListener('change', calculateYield);

    // Initial Calc
    // calculateYield(); // We will call this after dynamically populating the dropdown

    // ----- MASSIVE 110 PLAYER IPL 2026 ROSTER DATA ENGINE -----
    const iplRoster = {
        "CSK": {
            name: "Chennai Super Kings", colorClass: "bg-yellow", baseYield: 1.5, starPlayer: "MS Dhoni",
            players: ["Ruturaj Gaikwad (c)", "Sanju Samson (wk)", "Shivam Dube", "MS Dhoni", "Ayush Mhatre", "Dewald Brevis", "Karthik Sharma", "Prashant Veer", "Nathan Ellis", "Noor Ahmad", "Deepak Chahar"]
        },
        "MI": {
            name: "Mumbai Indians", colorClass: "bg-blue", baseYield: 1.2, starPlayer: "Rohit Sharma",
            players: ["Rohit Sharma", "Ryan Rickelton (wk)", "Suryakumar Yadav", "Tilak Varma", "Hardik Pandya (c)", "Naman Dhir", "Corbin Bosch", "Mitchell Santner", "Deepak Chahar", "Jasprit Bumrah", "Trent Boult"]
        },
        "RCB": {
            name: "Royal Challengers Bengaluru", colorClass: "bg-red", baseYield: 1.8, starPlayer: "Virat Kohli",
            players: ["Phil Salt", "Virat Kohli", "Venkatesh Iyer", "Rajat Patidar (c)", "Krunal Pandya", "Tim David", "Jitesh Sharma (wk)", "Romario Shepherd", "Bhuvneshwar Kumar", "Josh Hazlewood", "Suyash Sharma"]
        },
        "KKR": {
            name: "Kolkata Knight Riders", colorClass: "bg-purple", baseYield: 1.4, starPlayer: "Sunil Narine",
            players: ["Finn Allen (wk)", "Ajinkya Rahane (c)", "Angkrish Raghuvanshi", "Cameron Green", "Rinku Singh", "Rovman Powell", "Ramandeep Singh", "Sunil Narine", "Varun Chakravarthy", "Vaibhav Arora", "Akash Deep"]
        },
        "SRH": {
            name: "Sunrisers Hyderabad", colorClass: "bg-orange", baseYield: 1.6, starPlayer: "Pat Cummins (c)",
            players: ["Travis Head", "Abhishek Sharma", "Ishan Kishan (wk)", "Heinrich Klaasen", "Liam Livingstone", "Nitish Kumar Reddy", "Pat Cummins (c)", "Harshal Patel", "Jaydev Unadkat", "Eeshan Malinga", "Zeeshan Ansari"]
        },
        "RR": {
            name: "Rajasthan Royals", colorClass: "bg-pink", baseYield: 1.7, starPlayer: "Yashasvi Jaiswal",
            players: ["Yashasvi Jaiswal", "Vaibhav Suryavanshi", "Riyan Parag", "Dhruv Jurel (wk)", "Shimron Hetmyer", "Donovan Ferreira", "Sam Curran", "Ravindra Jadeja (c)", "Jofra Archer", "Ravi Bishnoi", "Sandeep Sharma"]
        },
        "DC": {
            name: "Delhi Capitals", colorClass: "bg-blue-dark", baseYield: 1.9, starPlayer: "KL Rahul (c/wk)",
            players: ["KL Rahul (c/wk)", "Abishek Porel", "Nitish Rana", "Tristan Stubbs", "Axar Patel", "David Miller", "Ashutosh Sharma", "Avesh Khan", "Kuldeep Yadav", "Mitchell Starc", "T Natarajan"]
        },
        "GT": {
            name: "Gujarat Titans", colorClass: "bg-navy", baseYield: 1.3, starPlayer: "Rashid Khan",
            players: ["Shubman Gill (c)", "Sai Sudharsan", "Jos Buttler (wk)", "Glenn Phillips", "Washington Sundar", "Shahrukh Khan", "Rahul Tewatia", "Rashid Khan", "Sai Kishore", "Kagiso Rabada", "Mohammed Siraj"]
        },
        "PBKS": {
            name: "Punjab Kings", colorClass: "bg-red-light", baseYield: 2.1, starPlayer: "Marcus Stoinis",
            players: ["Prabhsimran Singh (wk)", "Priyansh Arya", "Shreyas Iyer (c)", "Nehal Wadhera", "Marcus Stoinis", "Shashank Singh", "Suryansh Shedge", "Marco Jansen", "Yuzvendra Chahal", "Arshdeep Singh", "Kagiso Rabada"]
        },
        "LSG": {
            name: "Lucknow Super Giants", colorClass: "bg-cyan", baseYield: 1.5, starPlayer: "Nicholas Pooran",
            players: ["Rishabh Pant (c/wk)", "Aiden Markram", "Mitchell Marsh", "Nicholas Pooran", "Matthew Breetzke", "Ayush Badoni", "Abdul Samad", "Shahbaz Ahmed", "Mohammed Shami", "Avesh Khan", "Mayank Yadav"]
        }
    };

    // --- Simulated Backend Oracle API ---
    // In production, this would be a real fetch() call to your Node.js backend
    let activeOrangeCap = null;
    let activePurpleCap = null;

    async function fetchCapDataFromOracle() {
        return new Promise((resolve) => {
            // Simulating a 500ms API network delay
            setTimeout(() => {
                resolve({
                    orangeCap: "Virat Kohli",
                    purpleCap: "Jasprit Bumrah"
                });
            }, 500);
        });
    }

    const playerGrid = document.getElementById('playerGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const simTeamSelect = document.getElementById('teamSelect');

    async function renderPlayers(teamKey) {
        playerGrid.innerHTML = '<div style="width: 100%; grid-column: 1 / -1; text-align: center; color: var(--accent-primary);">Fetching live player state from Oracle...</div>';

        // Fetch from oracle only once (or could be polling)
        if (!activeOrangeCap) {
            const oracleData = await fetchCapDataFromOracle();
            activeOrangeCap = oracleData.orangeCap;
            activePurpleCap = oracleData.purpleCap;
        }

        playerGrid.innerHTML = ''; // Clear loading text
        const teamData = iplRoster[teamKey];

        teamData.players.forEach((player, index) => {
            const isStar = player === teamData.starPlayer;
            const isOrangeCap = player.includes(activeOrangeCap);
            const isPurpleCap = player.includes(activePurpleCap);

            const card = document.createElement('div');
            // Adding teamData.colorClass to the entire card container to theme it to the franchise
            card.className = `team-card glass-panel ${teamData.colorClass} ${isStar ? 'star-card' : ''}`;

            // Random simulated yield for player specifically
            const playerBaseYield = (teamData.baseYield + (Math.random() * 0.5) - 0.2).toFixed(2);

            // Mock AI asset mapping logic for MVP (Using base colors except for the AI generated ones)
            let imageStyle = `style="background-image: url('assets/generic_player.png'); background-size: cover; background-position: center; border-radius: 10px;"`;
            let imageClass = ""; // Removed teamData.colorClass to prevent background overrides

            // Special cases for our generated superstar cards
            if (player.includes("MS Dhoni")) { imageStyle = `style="background-image: url('assets/ms_dhoni.png'); background-size: cover; background-position: center; border-radius: 10px;"`; imageClass = ""; }
            if (player.includes("Virat Kohli")) { imageStyle = `style="background-image: url('assets/virat_kohli.png'); background-size: cover; background-position: center; border-radius: 10px;"`; imageClass = ""; }
            if (player.includes("Rohit Sharma")) { imageStyle = `style="background-image: url('assets/rohit_sharma.png'); background-size: cover; background-position: center; border-radius: 10px;"`; imageClass = ""; }

            let capBadgeHtml = "";
            let capYieldBonus = "";

            if (isOrangeCap) {
                capBadgeHtml = `<div class="cap-badge orange-cap" title="Oracle says: Most Runs">🧢 Orange Cap</div>`;
                card.classList.add('orange-cap-card');
                capYieldBonus = ` <br><span style="color: #FF9933; font-weight: bold; font-size: 0.75rem;">[2x Cap Bonus]</span>`;
            } else if (isPurpleCap) {
                capBadgeHtml = `<div class="cap-badge purple-cap" title="Oracle says: Most Wickets">🧢 Purple Cap</div>`;
                card.classList.add('purple-cap-card');
                capYieldBonus = ` <br><span style="color: #b757e6; font-weight: bold; font-size: 0.75rem;">[2x Cap Bonus]</span>`;
            }

            card.innerHTML = `
                ${capBadgeHtml}
                <div class="yield-badge">${playerBaseYield}x Yield ${capYieldBonus}</div>
                <div class="card-image ${imageClass}" ${imageStyle}></div>
                <h4>${player}</h4>
                <p style="margin-bottom: 1rem;">${teamData.name}</p>
                <button class="btn btn-primary btn-mint" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;" onclick="alert('Wallet Not Connected. Please Login & Connect to mint this card.')">Mint Card</button>
            `;
            playerGrid.appendChild(card);
        });

        // Re-initialize Vanilla Tilt for dynamically created DOM elements
        VanillaTilt.init(document.querySelectorAll(".team-card"), {
            max: 15, speed: 400, glare: true, "max-glare": 0.2,
        });
    }

    // Handle Filter Button Clicks
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active classes
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add to clicked
            e.target.classList.add('active');
            // Render specific team
            const teamKey = e.target.getAttribute('data-filter');
            renderPlayers(teamKey);
        });
    });

    // Populate the Simulator Dropdown Dynamically with all 110 Players
    function populateSimulatorDropdown() {
        simTeamSelect.innerHTML = ''; // Clear existing hardcoded options

        Object.keys(iplRoster).forEach(teamKey => {
            const teamData = iplRoster[teamKey];
            const optgroup = document.createElement('optgroup');
            optgroup.label = teamData.name;

            teamData.players.forEach(player => {
                const opt = document.createElement('option');
                // Simulate individual player multiplier logic based on team base
                const playerMult = (teamData.baseYield + (Math.random() * 0.5)).toFixed(2);
                opt.value = playerMult;
                opt.innerText = `${player} (${playerMult}x Probability)`;
                optgroup.appendChild(opt);
            });

            simTeamSelect.appendChild(optgroup);
        });

        // Trigger initial calc now that options exist
        calculateYield();
    }

    // Initial Load execution
    renderPlayers("CSK"); // Load CSK by default on page open
    populateSimulatorDropdown();

    // Match Simulator Logic
    const simBtn = document.getElementById('simBtn');
    if (simBtn) {
        const score1Element = document.getElementById('score1');
        const simResult = document.getElementById('simResult');
        const demoWallet = document.getElementById('demoWallet');
        const simPlayerName = document.getElementById('simPlayerName');
        const simPlayerImg = document.getElementById('simPlayerImg');
        let walletAmount = 0;

        simBtn.addEventListener('click', () => {
            simBtn.disabled = true;
            simBtn.innerText = "Simulating Over...";
            simResult.innerText = "";

            // Pick a random player from the 110 roster
            const teams = Object.keys(iplRoster);
            const randomTeamKey = teams[Math.floor(Math.random() * teams.length)];
            const teamData = iplRoster[randomTeamKey];
            const randomPlayer = teamData.players[Math.floor(Math.random() * teamData.players.length)];

            simPlayerName.innerText = `${randomPlayer} (${randomTeamKey})`;

            // Re-use logic for Superstar photos vs generic
            if (randomPlayer.includes("MS Dhoni")) simPlayerImg.src = 'assets/ms_dhoni.png';
            else if (randomPlayer.includes("Virat Kohli")) simPlayerImg.src = 'assets/virat_kohli.png';
            else if (randomPlayer.includes("Rohit Sharma")) simPlayerImg.src = 'assets/rohit_sharma.png';
            else simPlayerImg.src = 'assets/generic_player.png';

            let runs = 0;
            let counter = 0;
            const possibleRuns = [0, 1, 2, 4, 6, "OUT"];

            // Rapidly change numbers to simulate match progress
            const interval = setInterval(() => {
                const ballResult = possibleRuns[Math.floor(Math.random() * possibleRuns.length)];

                if (ballResult !== "OUT") {
                    runs += ballResult;
                    score1Element.innerText = `${runs} Runs`;
                }

                counter++;

                if (counter > 15) {
                    clearInterval(interval);
                    simBtn.disabled = false;
                    simBtn.innerText = "Simulate Another Over";

                    // Final Results
                    if (runs >= 10) {
                        simResult.innerHTML = `Great over! ${randomPlayer} scored ${runs} runs.<br>Holder receives ${runs * 10} $12M micro-yield!`;
                        simResult.className = `sim-result mt-2 text-green`;
                        walletAmount += (runs * 10);
                        demoWallet.innerHTML = `${walletAmount} <small>$12M</small>`;
                        demoWallet.classList.add('bump');
                        setTimeout(() => demoWallet.classList.remove('bump'), 300);
                    } else if (ballResult === "OUT") {
                        simResult.innerHTML = `${randomPlayer} is OUT!<br>Base yield still applies if ${randomTeamKey} wins.`;
                        simResult.className = "sim-result mt-2 text-red";
                    } else {
                        simResult.innerText = `Quiet over. ${runs} runs scored. No micro-yield triggered.`;
                        simResult.className = "sim-result mt-2";
                    }
                }
            }, 100);
        });
    }

    // Login Wrapper Modal Logic
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.getElementById('closeModal');
    const navLoginBtn = document.getElementById('navLoginBtn');

    if (loginModal && navLoginBtn && closeModal) {
        navLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.add('active');
        });

        closeModal.addEventListener('click', () => {
            loginModal.classList.remove('active');
        });

        // Close on clicking outside the modal content
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.remove('active');
            }
        });

        // Web3 Connection Logic via Ethers.js
        const metamaskBtn = document.querySelector('.metamask-btn');

        if (metamaskBtn) {
            metamaskBtn.addEventListener('click', async function () {
                const btn = this;
                const originalContent = btn.innerHTML;

                if (typeof window.ethereum !== 'undefined') {
                    try {
                        btn.innerHTML = "Requesting Connection...";

                        // Request account access via Native MetaMask RPC (most stable method)
                        await window.ethereum.request({ method: 'eth_requestAccounts' });

                        // Then connect Ethers provider
                        const provider = new ethers.providers.Web3Provider(window.ethereum);
                        const signer = provider.getSigner();
                        const address = await signer.getAddress();

                        // Show Success UI
                        btn.innerHTML = "Connected ✓";
                        btn.style.background = "rgba(0, 255, 136, 0.2)";
                        btn.style.borderColor = "var(--accent-primary)";
                        btn.style.color = "var(--accent-primary)";

                        setTimeout(() => {
                            loginModal.classList.remove('active');
                            // Reset button for next time
                            btn.innerHTML = originalContent;
                            btn.style = "";

                            // Format Address (0x1234...abcd)
                            const shortAddress = `${address.substring(0, 6)}...${address.substring(38)}`;

                            // Change Navbar button to show connected state
                            navLoginBtn.innerHTML = `Wallet: ${shortAddress}`;
                            navLoginBtn.classList.remove('btn-primary');
                            navLoginBtn.classList.add('btn-outline');
                            navLoginBtn.style.color = "var(--accent-primary)";
                            navLoginBtn.style.borderColor = "var(--accent-primary)";

                            // Update all mint buttons to be active
                            document.querySelectorAll('.btn-mint').forEach(mintBtn => {
                                mintBtn.setAttribute('onclick', `alert('Initiating Mint Transaction for Wallet ${shortAddress}...')`);
                                mintBtn.innerHTML = "Mint Now ($12M)";
                            });

                        }, 1000);

                    } catch (error) {
                        console.error("MetaMask Connection Error:", error);
                        alert("Connection Error: " + (error.message || "Ensure MetaMask is unlocked and try again."));
                        btn.innerHTML = "Connection Failed";
                        btn.style.color = "red";
                        btn.style.borderColor = "red";
                        setTimeout(() => {
                            btn.innerHTML = originalContent;
                            btn.style = "";
                        }, 2000);
                    }
                } else {
                    // Fallback to simulation if MetaMask extension is missing
                    btn.innerHTML = "Simulating Connection...";

                    setTimeout(() => {
                        btn.innerHTML = "Connected ✓ (Simulation)";
                        btn.style.background = "rgba(0, 255, 136, 0.2)";
                        btn.style.borderColor = "var(--accent-primary)";
                        btn.style.color = "var(--accent-primary)";

                        const ephemeralWallet = ethers.Wallet.createRandom();
                        const address = ephemeralWallet.address;
                        const shortAddress = `${address.substring(0, 6)}...${address.substring(38)}`;

                        setTimeout(() => {
                            loginModal.classList.remove('active');
                            btn.innerHTML = originalContent;
                            btn.style = "";

                            navLoginBtn.innerHTML = `Wallet: ${shortAddress}`;
                            navLoginBtn.classList.remove('btn-primary');
                            navLoginBtn.classList.add('btn-outline');
                            navLoginBtn.style.color = "var(--accent-primary)";
                            navLoginBtn.style.borderColor = "var(--accent-primary)";

                            document.querySelectorAll('.btn-mint').forEach(mintBtn => {
                                mintBtn.setAttribute('onclick', `alert('Initiating Mint Transaction for Wallet ${shortAddress}...')`);
                                mintBtn.innerHTML = "Mint Now ($12M)";
                            });
                        }, 1000);
                    }, 1500);
                }
            });
        }

        // Dynamic Web3Auth Simulation for Social/WalletConnect
        document.querySelectorAll('.social-btn, .walletconnect-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const isGoogle = this.classList.contains('google-btn');
                const isPhone = this.classList.contains('phone-btn');
                const originalContent = this.innerHTML;

                if (isGoogle) {
                    this.innerHTML = "Authenticating with Google...";
                } else if (isPhone) {
                    const phoneNum = prompt("Proceed without API Key? Enter Phone Number for demo:", "+1 ");
                    if (!phoneNum) return;
                    this.innerHTML = "Verifying OTP...";
                } else {
                    this.innerHTML = "Opening WalletConnect...";
                }

                setTimeout(() => {
                    this.innerHTML = "Generating Wallet ✓";
                    this.style.background = "rgba(0, 255, 136, 0.2)";
                    this.style.borderColor = "var(--accent-primary)";
                    this.style.color = "var(--accent-primary)";

                    // Create ephemeral wallet mimicking a Web3Auth/Privy non-custodial wallet
                    const ephemeralWallet = ethers.Wallet.createRandom();
                    const address = ephemeralWallet.address;
                    const shortAddress = `${address.substring(0, 6)}...${address.substring(38)}`;

                    setTimeout(() => {
                        loginModal.classList.remove('active');
                        this.innerHTML = originalContent;
                        this.style = "";

                        // Update UI to Connected State
                        navLoginBtn.innerHTML = `Wallet: ${shortAddress}`;
                        navLoginBtn.classList.remove('btn-primary');
                        navLoginBtn.classList.add('btn-outline');
                        navLoginBtn.style.color = "var(--accent-primary)";
                        navLoginBtn.style.borderColor = "var(--accent-primary)";

                        // Activate all Mint buttons
                        document.querySelectorAll('.btn-mint').forEach(mintBtn => {
                            mintBtn.setAttribute('onclick', `alert('Initiating Mint Transaction for Wallet ${shortAddress}...')`);
                            mintBtn.innerHTML = "Mint Now ($12M)";
                        });
                    }, 1000);
                }, 1500);
            });
        });
    }

    // Interactive Rivalry Clash Widget
    const triggerClashBtn = document.getElementById('triggerClashBtn');
    const clashResultModal = document.getElementById('clashResultModal');
    if (triggerClashBtn && clashResultModal) {
        triggerClashBtn.addEventListener('click', function () {
            // Hide the text inside the middle temporarily
            const vsText = this.querySelector('.vs-text');
            vsText.innerHTML = "Simulating Match...";
            vsText.style.background = "transparent";

            setTimeout(() => {
                clashResultModal.style.display = 'block';
                vsText.innerHTML = "VS";
            }, 1000);
        });
    }

    // Share on X (Twitter) Logic
    const shareOnXBtn = document.getElementById('shareOnXBtn');
    if (shareOnXBtn) {
        shareOnXBtn.addEventListener('click', () => {
            const tweetText = encodeURIComponent("I just joined the ultimate IPL Web3 Fan Experience! 🚀 Mint your favorite Player Card and earn continuous crypto dividends every time they win! 🏏💰 Drop your wallet below! #IPL2026 #Web3 #12MToken");
            const url = encodeURIComponent("https://12mtoken.com/");
            const xUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${url}`;
            window.open(xUrl, '_blank');
        });
    }

    // Roadmap Timeline Animation
    const timelineItems = document.querySelectorAll('.timeline-item');
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.5,
        rootMargin: "0px 0px -100px 0px"
    });

    timelineItems.forEach(item => {
        timelineObserver.observe(item);
    });
});
