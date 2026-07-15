// Firebase Configuration - Replace with your own keys to enable cloud sync
const firebaseConfig = {
    apiKey: "AIzaSyC7hl1xr_OGT7cYk9DWKfxbYcwgOkzJliM",
    authDomain: "rentifly-kota.firebaseapp.com",
    databaseURL: "https://rentifly-kota-default-rtdb.firebaseio.com",
    projectId: "rentifly-kota",
    storageBucket: "rentifly-kota.firebasestorage.app",
    messagingSenderId: "713852680523",
    appId: "1:713852680523:web:8dbcf31ce45582807910ce"
};

let db = null;
let isFirebaseActive = false;

// Check if Firebase settings have been customized
if (firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey.trim() !== "") {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        isFirebaseActive = true;
        console.log("Firebase Realtime Database initialized successfully.");
    } catch (error) {
        console.error("Failed to initialize Firebase:", error);
    }
} else {
    console.log("Firebase Config is set to default placeholders. Running in offline mode using localStorage.");
}

// Core Application State
let state = {
    bikes: [],
    rentals: []
};

// Seed Initial Data if LocalStorage is empty
const SEED_DATA = {
    bikes: [
        {
            id: "b1",
            name: "Specialized Rockhopper Sport",
            type: "Mountain",
            sn: "SN-RH9021",
            rate: 80.00,
            rateType: "Hour",
            status: "Available"
        },
        {
            id: "b2",
            name: "Trek Domane AL 2 Gen 4",
            type: "Road",
            sn: "SN-TD5820",
            rate: 120.00,
            rateType: "Hour",
            status: "Available"
        },
        {
            id: "b3",
            name: "Rad Power RadRunner 3 Plus",
            type: "Electric",
            sn: "SN-RR3005",
            rate: 200.00,
            rateType: "Hour",
            status: "Rented"
        },
        {
            id: "b4",
            name: "Giant Escape 3 Disc",
            type: "Hybrid",
            sn: "SN-GE9837",
            rate: 60.00,
            rateType: "Hour",
            status: "Available"
        },
        {
            id: "b5",
            name: "Cannondale Trail 5 Carbon",
            type: "Mountain",
            sn: "SN-CT4092",
            rate: 450.00,
            rateType: "Day",
            status: "Maintenance"
        },
        {
            id: "b6",
            name: "Lectric XP 3.0 Electric Cruiser",
            type: "Electric",
            sn: "SN-LXP8820",
            rate: 900.00,
            rateType: "Day",
            status: "Available"
        }
    ],
    rentals: [
        {
            id: "r1",
            bikeId: "b3",
            customerName: "Alice Johnson",
            customerPhone: "+1 (555) 123-4567",
            startTime: Date.now() - (3.5 * 60 * 60 * 1000), // 3.5 hours ago
            endTime: null,
            estDuration: 5,
            status: "Active",
            actualCost: null
        },
        {
            id: "r2",
            bikeId: "b1",
            customerName: "Robert Smith",
            customerPhone: "+1 (555) 987-6543",
            startTime: Date.now() - (28 * 60 * 60 * 1000), // 28 hours ago
            endTime: Date.now() - (24 * 60 * 60 * 1000),   // Completed 24 hours ago (duration 4 hrs)
            estDuration: 4,
            status: "Completed",
            actualCost: 320.00
        },
        {
            id: "r3",
            bikeId: "b4",
            customerName: "Carol White",
            customerPhone: "+1 (555) 456-7890",
            startTime: Date.now() - (48 * 60 * 60 * 1000), 
            endTime: Date.now() - (42 * 60 * 60 * 1000),   // Duration 6 hrs
            estDuration: 6,
            status: "Completed",
            actualCost: 360.00
        }
    ]
};

// SVG Illustration Generator for Bike Types
function getBikeSVG(type, status) {
    let accentColor = "var(--color-primary)";
    if (status === "Rented") accentColor = "var(--color-accent)";
    if (status === "Maintenance") accentColor = "var(--color-warning)";

    // Standard road bike skeleton geometry
    return `
    <svg class="bike-illustration" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <!-- Wheels -->
        <circle cx="25" cy="70" r="14" fill="none" stroke="var(--text-muted)" stroke-width="2.5" />
        <circle cx="25" cy="70" r="12" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
        <circle cx="25" cy="70" r="2" fill="var(--text-secondary)" />
        
        <circle cx="75" cy="70" r="14" fill="none" stroke="var(--text-muted)" stroke-width="2.5" />
        <circle cx="75" cy="70" r="12" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
        <circle cx="75" cy="70" r="2" fill="var(--text-secondary)" />

        <!-- Spokes -->
        <path d="M25 56v28M11 70h28M75 56v28M61 70h28" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

        <!-- Frame Chains & Crankset -->
        <circle cx="48" cy="70" r="4.5" fill="none" stroke="${accentColor}" stroke-width="1.5" />
        <path d="M25 70h23M25 70l15-18M48 70l27 0" stroke="${accentColor}" stroke-width="1.5" />

        <!-- Main Frame Triangles -->
        <path d="M48 70 L40 45 L62 45 L48 70" fill="none" stroke="${accentColor}" stroke-width="2.5" stroke-linejoin="round" />
        <path d="M25 70 L40 45" fill="none" stroke="${accentColor}" stroke-width="2.5" stroke-linejoin="round" />

        <!-- Fork and Handlebar -->
        <path d="M75 70 L64 36 M64 36 L60 30 M60 30 L66 30" fill="none" stroke="${accentColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Seat Post and Saddle -->
        <path d="M40 45 L38 34 M32 34 h10" fill="none" stroke="var(--text-primary)" stroke-width="2.5" stroke-linecap="round" />

        <!-- Category-specific visual accents -->
        ${type === 'Mountain' ? `
            <!-- Front suspension fork detail -->
            <path d="M71 58l-2-6" stroke="var(--text-primary)" stroke-width="3" stroke-linecap="round"/>
            <rect x="23" y="53" width="4" height="3" rx="1" fill="var(--text-secondary)" />
        ` : ''}
        ${type === 'Electric' ? `
            <!-- Integrated Battery frame module -->
            <rect x="42" y="52" width="13" height="7" rx="1.5" fill="${accentColor}" opacity="0.6"/>
            <!-- Motor Hub on Rear Wheel -->
            <circle cx="25" cy="70" r="5" fill="var(--text-primary)" />
        ` : ''}
        ${type === 'Road' ? `
            <!-- Drop Handlebars -->
            <path d="M60 30c0 4 4 4 4 1" fill="none" stroke="var(--text-primary)" stroke-width="2" stroke-linecap="round"/>
        ` : ''}
    </svg>`;
}

// State Persistence Utilities
let isListenerBound = false;
function setupFirebaseListener() {
    if (!isFirebaseActive || !db || isListenerBound) return;
    isListenerBound = true;
    
    db.ref("rentifly_state").on("value", (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data.bikes) && Array.isArray(data.rentals)) {
            data.bikes = data.bikes.filter(b => b && typeof b === "object");
            data.rentals = data.rentals.filter(r => r && typeof r === "object");
            state = data;
            localStorage.setItem("rentifly_state", JSON.stringify(state));
        } else {
            // Migrate local storage or seed data to Firebase
            const saved = localStorage.getItem("rentifly_state") || localStorage.getItem("velorent_state");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed && Array.isArray(parsed.bikes) && Array.isArray(parsed.rentals)) {
                        state = parsed;
                    }
                } catch (e) {}
            }
            if (!state.bikes || state.bikes.length === 0) {
                state = JSON.parse(JSON.stringify(SEED_DATA));
            }
            db.ref("rentifly_state").set(state);
        }
        
        // Re-render the active view automatically when data changes
        const activeTab = document.querySelector(".menu-list .menu-item.active")?.getAttribute("data-target") || "dashboard";
        renderActiveView(activeTab);
    });
}

function loadState() {
    if (isFirebaseActive) {
        setupFirebaseListener();
        return;
    }
    try {
        // Fallback to older velorent_state to prevent data loss on rename
        const saved = localStorage.getItem("rentifly_state") || localStorage.getItem("velorent_state");
        if (saved) {
            const parsed = JSON.parse(saved);
            // Schema validation to prevent corruption bugs
            if (parsed && Array.isArray(parsed.bikes) && Array.isArray(parsed.rentals)) {
                state = parsed;
                // Migrate to new storage key if it was using the old one
                if (!localStorage.getItem("rentifly_state")) {
                    saveState();
                }
                return;
            }
        }
    } catch (e) {
        console.error("Error loading state from localStorage, resetting to default:", e);
    }
    // Safe deep-copy fallback to prevent SEED_DATA reference mutation
    state = JSON.parse(JSON.stringify(SEED_DATA));
    saveState();
}

function saveState() {
    try {
        localStorage.setItem("rentifly_state", JSON.stringify(state));
        if (isFirebaseActive && db) {
            db.ref("rentifly_state").set(state).catch(err => {
                console.error("Firebase save error:", err);
                if (err.message && err.message.includes("PERMISSION_DENIED")) {
                    showToast("Firebase Permission Denied! Set Rules to true in Console.", "error");
                } else {
                    showToast("Cloud sync error: " + err.message, "error");
                }
            });
        }
    } catch (e) {
        console.error("Failed to save state:", e);
    }
}

// ── TIERED PRICING: Electric Scooter ──────────────────────────────
// Hour 1: ₹80  | Hour 2: ₹70 | Hour 3: ₹60 | Hour 4+: ₹50 each
// (decreases by ₹10 each hour down to minimum ₹50)
const ELECTRIC_HOURLY_RATES = [80, 70, 60, 50]; // index 0=hr1, 1=hr2, 2=hr3, 3+=hr4+

function calculateElectricCost(hours) {
    // hours can be fractional; we bill per started hour
    const billedHours = Math.max(1, Math.ceil(hours));
    let total = 0;
    for (let h = 1; h <= billedHours; h++) {
        const rateIndex = Math.min(h - 1, ELECTRIC_HOURLY_RATES.length - 1);
        total += ELECTRIC_HOURLY_RATES[rateIndex];
    }
    return total;
}

function showPricingTable() {
    // Build the two-column breakdown
    let rows1 = "", rows2 = "";
    let running = 0;
    for (let h = 1; h <= 10; h++) {
        const rateIndex = Math.min(h - 1, ELECTRIC_HOURLY_RATES.length - 1);
        const rate = ELECTRIC_HOURLY_RATES[rateIndex];
        running += rate;
        const row = `<tr>
            <td style="padding:10px 14px; font-weight:700; color:#f2ba00;">${h}</td>
            <td style="padding:10px 14px;">₹${rate}</td>
            <td style="padding:10px 14px; font-weight:700; color:#00f2fe;">₹${running}</td>
        </tr>`;
        if (h <= 5) rows1 += row; else rows2 += row;
    }
    const tableStyle = `border-collapse:collapse; width:100%; background:rgba(0,0,0,0.3); border-radius:10px; overflow:hidden;`;
    const thStyle = `background:#f2ba00; color:#0a0e17; padding:10px 14px; font-weight:800; font-size:0.82rem; text-transform:uppercase; letter-spacing:0.5px; text-align:left;`;
    const html = `
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <table style="${tableStyle} flex:1; min-width:200px;">
                <thead><tr>
                    <th style="${thStyle}">Hour</th>
                    <th style="${thStyle}">Rate / hr</th>
                    <th style="${thStyle}">Total</th>
                </tr></thead>
                <tbody style="color:#f3f4f6; font-size:0.9rem;">${rows1}</tbody>
            </table>
            <table style="${tableStyle} flex:1; min-width:200px;">
                <thead><tr>
                    <th style="${thStyle}">Hour</th>
                    <th style="${thStyle}">Rate / hr</th>
                    <th style="${thStyle}">Total</th>
                </tr></thead>
                <tbody style="color:#f3f4f6; font-size:0.9rem;">${rows2}</tbody>
            </table>
        </div>
        <div style="margin-top:16px; background:rgba(242,186,0,0.08); border:1px solid rgba(242,186,0,0.3); border-radius:12px; padding:14px 18px; font-size:0.85rem; color:#f3f4f6; line-height:1.7;">
            <strong style="color:#f2ba00;">NOTE:</strong>&nbsp;
            • Rate decreases by ₹10 each hour till ₹50.&nbsp;&nbsp;
            • From the 4th hour onwards, the rate remains at <strong style="color:#f2ba00;">₹50 per hour</strong>.
            &nbsp;&nbsp;<span style="color:#ff4b2b; font-weight:700;">• NON-NEGOTIABLE PRICE.</span>
        </div>`;

    // Reuse the auth modal as a viewer
    const overlay = document.createElement("div");
    overlay.style = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.85);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;";
    overlay.innerHTML = `
        <div style="background:#0f1524;border:1px solid rgba(242,186,0,0.3);border-radius:20px;padding:28px;max-width:700px;width:100%;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.6);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <div>
                    <h3 style="font-size:1.25rem;font-weight:700;color:#f2ba00;">⚡ Electric Scooter Pricing</h3>
                    <p style="color:#9ca3af;font-size:0.85rem;margin-top:4px;">Tiered hourly rate — charged per started hour</p>
                </div>
                <button onclick="this.closest('[style*=position]').remove()" style="background:rgba(255,75,43,0.15);border:1px solid rgba(255,75,43,0.3);border-radius:8px;padding:6px 10px;color:#ff4b2b;cursor:pointer;font-size:1.1rem;font-weight:700;">&times;</button>
            </div>
            ${html}
        </div>`;
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

// Toast Notifications Helper
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "";
    if (type === "success") icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    if (type === "error") icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    if (type === "info") icon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = "toast-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Navigation logic
const navItems = document.querySelectorAll(".menu-list .menu-item");
const pageSections = document.querySelectorAll(".page-section");
const viewTitle = document.getElementById("view-title");
const viewDescription = document.getElementById("view-description");

const navigationMetadata = {
    dashboard: {
        title: "Dashboard",
        desc: "Overview of rental operations and fleet status."
    },
    inventory: {
        title: "Bike Inventory",
        desc: "Manage and audit rental bicycles."
    },
    rentals: {
        title: "Active Rentals",
        desc: "Track currently checked-out bikes."
    },
    history: {
        title: "Rental History",
        desc: "Past logs and transaction reports."
    }
};

navItems.forEach(item => {
    item.addEventListener("click", () => {
        const targetSection = item.getAttribute("data-target");
        renderActiveView(targetSection);
    });
});

// Main dynamic render hub
function renderActiveView(viewName) {
    // Synchronize Desktop & Mobile active tab highlights
    document.querySelectorAll(".menu-list .menu-item").forEach(item => {
        if (item.getAttribute("data-target") === viewName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    document.querySelectorAll(".mobile-bottom-nav .mobile-nav-item").forEach(item => {
        if (item.getAttribute("data-target") === viewName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Display target viewport
    pageSections.forEach(section => {
        section.classList.remove("active");
        if (section.id === `${viewName}-section`) {
            section.classList.add("active");
        }
    });

    // Update header details
    if (navigationMetadata[viewName]) {
        if (viewTitle) viewTitle.innerText = navigationMetadata[viewName].title;
        if (viewDescription) viewDescription.innerText = navigationMetadata[viewName].desc;
    }

    updateStats();
    if (viewName === "dashboard") {
        renderDashboard();
    } else if (viewName === "inventory") {
        renderInventory();
    } else if (viewName === "rentals") {
        renderRentals();
    } else if (viewName === "history") {
        renderHistory();
    }
}

// Bind Mobile Bottom Navigation & Top Logout Events
document.querySelectorAll(".mobile-bottom-nav .mobile-nav-item").forEach(item => {
    item.addEventListener("click", () => {
        const target = item.getAttribute("data-target");
        renderActiveView(target);
    });
});

const mobileLogoutBtn = document.getElementById("btn-logout-mobile");
if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("rentifly_logged_in");
        checkAuth();
        showToast("Logged out successfully.", "info");
    });
}

// Stats Calculation
function updateStats() {
    const totalFleet = state.bikes.length;
    const activeRentals = state.rentals.filter(r => r.status === "Active").length;
    const availableBikes = state.bikes.filter(b => b.status === "Available").length;
    const maintenanceBikes = state.bikes.filter(b => b.status === "Maintenance").length;
    
    // Earnings calculation
    const totalRevenue = state.rentals
        .filter(r => r.status === "Completed")
        .reduce((sum, r) => sum + (r.actualCost || 0), 0);

    // Fleet utilization rate
    const utilizationRate = totalFleet > 0 ? Math.round((activeRentals / totalFleet) * 100) : 0;

    // Push into DOM
    document.getElementById("stat-total-fleet").innerText = totalFleet;
    document.getElementById("stat-active-rentals").innerText = activeRentals;
    document.getElementById("stat-available-bikes").innerText = availableBikes;
    document.getElementById("stat-total-revenue").innerText = `₹${totalRevenue.toFixed(2)}`;
    document.getElementById("badge-maintenance-count").innerText = maintenanceBikes;
    document.getElementById("utilization-rate").innerText = `${utilizationRate}%`;
}

// RENDER: DASHBOARD
function renderDashboard() {
    const tableBody = document.getElementById("dashboard-active-rentals-table");
    tableBody.innerHTML = "";
    
    const forecastContainer = document.getElementById("dashboard-forecast-list");
    if (forecastContainer) forecastContainer.innerHTML = "";
    
    const activeRentals = state.rentals.filter(r => r.status === "Active");
    
    if (activeRentals.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 32px;">No bikes are currently checked out.</td></tr>`;
        if (forecastContainer) {
            forecastContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 24px; background: rgba(255,255,255,0.01); border: 1px dashed var(--border-color); border-radius: 12px; font-size: 0.9rem;">All bikes are currently available in the fleet.</div>`;
        }
        return;
    }

    activeRentals.forEach(rental => {
        const bike = state.bikes.find(b => b.id === rental.bikeId);
        if (!bike) return;

        const startTimeFormatted = new Date(rental.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Calculate current elapsed time for display
        const elapsedMs = Date.now() - rental.startTime;
        const elapsedHours = (elapsedMs / (1000 * 60 * 60)).toFixed(1);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div style="font-weight: 600; color: var(--text-primary);">${bike.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${bike.sn} &bull; ${bike.type}</div>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${rental.customerPhoto 
                        ? `<img src="${rental.customerPhoto}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--color-primary); cursor: pointer;" onclick="viewCustomerPhoto('${rental.customerPhoto}')" title="Click to enlarge">`
                        : `<div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; border: 1px solid var(--border-color);">${rental.customerName.charAt(0)}</div>`}
                    <div>
                        <div style="font-weight: 500;">${rental.customerName}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${rental.customerPhone}</div>
                    </div>
                </div>
            </td>
            <td>${startTimeFormatted} <span style="font-size: 0.8rem; color: var(--text-muted);">(${elapsedHours}h ago)</span></td>
            <td>${rental.estDuration} ${bike.rateType === 'Hour' ? 'hrs' : 'days'}</td>
            <td>
                <div style="display: flex; gap: 6px;">
                    <button class="btn btn-secondary btn-icon" onclick="openExtendModal('${rental.id}')" title="Extend Time">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e0a96d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </button>
                    <button class="btn btn-secondary btn-icon" onclick="openReturnModal('${rental.id}')" title="Complete Return">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // Populate Forecast Cards
    if (forecastContainer) {
        activeRentals.forEach(rental => {
            const bike = state.bikes.find(b => b.id === rental.bikeId);
            if (!bike) return;

            const durationMs = rental.estDuration * (bike.rateType === "Hour" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
            const expectedEndTime = rental.startTime + durationMs;
            const remainingMs = expectedEndTime - Date.now();
            
            let statusText = "";
            let isOverdue = remainingMs <= 0;
            
            if (bike.rateType === "Hour") {
                const remainingHours = remainingMs / (1000 * 60 * 60);
                if (isOverdue) {
                    const overdueHours = Math.abs(remainingHours);
                    statusText = overdueHours < 1 
                        ? `Overdue by ${Math.round(overdueHours * 60)} mins`
                        : `Overdue by ${overdueHours.toFixed(1)} hours`;
                } else {
                    statusText = remainingHours < 1
                        ? `Available in ${Math.round(remainingHours * 60)} mins`
                        : `Available in ${remainingHours.toFixed(1)} hours`;
                }
            } else {
                const remainingDays = remainingMs / (1000 * 60 * 60 * 24);
                if (isOverdue) {
                    statusText = `Overdue by ${Math.abs(remainingDays).toFixed(1)} days`;
                } else {
                    statusText = `Available in ${remainingDays.toFixed(1)} days`;
                }
            }

            const card = document.createElement("div");
            card.style = "background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s; position: relative; overflow: hidden;";
            
            card.onmouseenter = () => card.style.transform = "translateY(-2px)";
            card.onmouseleave = () => card.style.transform = "none";
            
            const badgeStyle = isOverdue
                ? "color: #ff4b2b; background: rgba(255, 75, 43, 0.08); border: 1px solid rgba(255, 75, 43, 0.2); box-shadow: 0 0 10px rgba(255, 75, 43, 0.05);"
                : "color: #00f2fe; background: rgba(0, 242, 254, 0.08); border: 1px solid rgba(0, 242, 254, 0.2); box-shadow: 0 0 10px rgba(0, 242, 254, 0.05);";

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin: 0;">${bike.name}</h4>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin: 2px 0 0 0;">SN: ${bike.sn} &bull; ${bike.type}</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-secondary); background: rgba(255,255,255,0.01); padding: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.02);">
                    ${rental.customerPhoto 
                        ? `<img src="${rental.customerPhoto}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;">`
                        : `<div style="width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 0.55rem; font-weight: 700; color: var(--text-muted);">${rental.customerName.charAt(0)}</div>`}
                    <span>${rental.customerName}</span>
                </div>
                <div style="font-size: 0.8rem; font-weight: 600; padding: 6px 10px; border-radius: 8px; text-align: center; ${badgeStyle}">
                    ${statusText}
                </div>
            `;
            forecastContainer.appendChild(card);
        });
    }
}

// RENDER: INVENTORY (GRID WITH CARDS)
function renderInventory() {
    const grid = document.getElementById("inventory-bikes-grid");
    const searchQuery = document.getElementById("search-inventory").value.toLowerCase();
    const typeFilter = document.getElementById("filter-type").value;
    const statusFilter = document.getElementById("filter-status").value;
    
    grid.innerHTML = "";

    const filteredBikes = state.bikes.filter(bike => {
        const matchesSearch = bike.name.toLowerCase().includes(searchQuery) || 
                              bike.sn.toLowerCase().includes(searchQuery) ||
                              bike.type.toLowerCase().includes(searchQuery);
        const matchesType = typeFilter === "all" || bike.type === typeFilter;
        const matchesStatus = statusFilter === "all" || bike.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    if (filteredBikes.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 48px;">No matching bikes found.</div>`;
        return;
    }

    filteredBikes.forEach(bike => {
        const card = document.createElement("div");
        card.className = "bike-card";
        
        let statusBadgeClass = "status-available";
        if (bike.status === "Rented") statusBadgeClass = "status-rented";
        if (bike.status === "Maintenance") statusBadgeClass = "status-maintenance";

        // Action button states
        let mainActionButtonHtml = "";
        if (bike.status === "Available") {
            mainActionButtonHtml = `<button class="btn btn-primary" onclick="openRentModal('${bike.id}')">Rent Now</button>`;
        } else if (bike.status === "Rented") {
            const activeRental = (state.rentals || []).find(r => r && r.bikeId === bike.id && r.status === "Active");
            mainActionButtonHtml = `<button class="btn btn-secondary" onclick="openReturnModal('${activeRental?.id}')">Return Bike</button>`;
        } else if (bike.status === "Maintenance") {
            mainActionButtonHtml = `<button class="btn btn-secondary" onclick="markReady('${bike.id}')">Mark Available</button>`;
        }

        card.innerHTML = `
            <div class="bike-image-container">
                ${(() => {
                    const n = bike.name.toLowerCase();
                    if (n.includes("black") && (n.includes("access") || n.includes("125"))) {
                        return `<img src="access125_black.jpg?v=2" alt="Access 125 Black"
                            style="width:100%;height:100%;object-fit:cover;border-radius:12px 12px 0 0;"
                            onerror="this.style.display='none'">`;
                    } else if (n.includes("white") && (n.includes("access") || n.includes("125"))) {
                        return `<img src="access125_white.jpg" alt="Access 125 White"
                            style="width:100%;height:100%;object-fit:cover;border-radius:12px 12px 0 0;"
                            onerror="this.style.display='none'">`;
                    } else if (n.includes("access") || n.includes("125")) {
                        return `<img src="access125.jpg" alt="Access 125"
                            style="width:100%;height:100%;object-fit:cover;border-radius:12px 12px 0 0;"
                            onerror="this.style.display='none'">`;
                    } else if (n.includes("ns 200") || n.includes("ns200")) {
                        return `<img src="ns200.jpg" alt="NS 200"
                            style="width:100%;height:100%;object-fit:cover;border-radius:12px 12px 0 0;"
                            onerror="this.style.display='none'">`;
                    } else if (bike.type === "Electric") {
                        return `<img src="electric_scooter.jpg" alt="Electric Scooter"
                            style="width:100%;height:100%;object-fit:cover;border-radius:12px 12px 0 0;"
                            onerror="this.style.display='none'">`;
                    } else {
                        return getBikeSVG(bike.type, bike.status);
                    }
                })()}
                <span class="bike-status-badge ${statusBadgeClass}">${bike.status}</span>
            </div>
            <div class="bike-details">
                <div class="bike-header">
                    <div>
                        <h4 class="bike-title">${bike.name}</h4>
                        <span class="bike-type">${bike.type}</span>
                    </div>
                    <div style="text-align:right;">
                        ${bike.type === "Electric" && bike.rateType === "Hour"
                            ? `<div style="font-size:0.75rem;color:#f2ba00;font-weight:600;line-height:1.3;">
                                 ₹80 → ₹70 → ₹50<span style="color:var(--text-muted);font-weight:400;">/hr</span>
                               </div>
                               <button onclick="showPricingTable()" style="margin-top:4px;font-size:0.65rem;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:#f2ba00;background:rgba(242,186,0,0.1);border:1px solid rgba(242,186,0,0.3);border-radius:6px;padding:3px 8px;cursor:pointer;">⚡ View Pricing</button>`
                            : `<span class="bike-rate">₹${bike.rate.toFixed(2)}<span style="font-size: 0.75rem; font-weight: 500; color: var(--text-secondary);">/${bike.rateType.toLowerCase()}</span></span>`
                        }
                    </div>
                </div>
                <div class="bike-meta">
                    <div><strong>Serial:</strong> ${bike.sn}</div>
                </div>
                <div class="bike-actions">
                    ${mainActionButtonHtml}
                    <button class="btn btn-secondary btn-icon" onclick="openEditBikeModal('${bike.id}')" title="Edit Bike">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                    </button>
                    <button class="btn btn-danger btn-icon" onclick="deleteBike('${bike.id}')" title="Delete Bike">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// RENDER: ACTIVE RENTALS (TABLE IN VIEW)
function renderRentals() {
    const tableBody = document.getElementById("rentals-active-table");
    const searchQuery = document.getElementById("search-rentals").value.toLowerCase();
    tableBody.innerHTML = "";

    const activeRentals = (state.rentals || []).filter(r => r && r.status === "Active");
    
    const filteredRentals = activeRentals.filter(rental => {
        const bike = (state.bikes || []).find(b => b && b.id === rental.bikeId);
        const bikeName = bike ? bike.name.toLowerCase() : "";
        return (rental.customerName || "").toLowerCase().includes(searchQuery) ||
               (rental.customerPhone || "").includes(searchQuery) ||
               bikeName.includes(searchQuery);
    });

    if (filteredRentals.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No matching active rentals found.</td></tr>`;
        return;
    }

    filteredRentals.forEach(rental => {
        const bike = state.bikes.find(b => b.id === rental.bikeId);
        if (!bike) return;

        const startTimeFormatted = new Date(rental.startTime).toLocaleString();
        
        tableBody.innerHTML += `
            <tr>
                <td><strong>${rental.id}</strong></td>
                <td>
                    <div style="font-weight: 600;">${bike.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${bike.type} &bull; SN: ${bike.sn}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${rental.customerPhoto 
                            ? `<img src="${rental.customerPhoto}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); cursor: pointer;" onclick="viewCustomerPhoto('${rental.customerPhoto}')" title="Click to enlarge">`
                            : `<div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--text-muted); font-weight: 700; border: 1px solid var(--border-color);">${rental.customerName.charAt(0)}</div>`}
                        <span>${rental.customerName}</span>
                    </div>
                </td>
                <td>${rental.customerPhone}</td>
                <td>${startTimeFormatted}</td>
                <td>${rental.estDuration} ${bike.rateType === 'Hour' ? 'hours' : 'days'}</td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn btn-secondary" onclick="openExtendModal('${rental.id}')">Extend</button>
                        <button class="btn btn-accent" onclick="openReturnModal('${rental.id}')">Return</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// RENDER: RENTAL HISTORY
function renderHistory() {
    const tableBody = document.getElementById("history-completed-table");
    const searchQuery = document.getElementById("search-history").value.toLowerCase();
    tableBody.innerHTML = "";

    const completedRentals = (state.rentals || []).filter(r => r && r.status === "Completed");

    const filteredHistory = completedRentals.filter(rental => {
        const bike = (state.bikes || []).find(b => b && b.id === rental.bikeId);
        const bikeName = bike ? bike.name.toLowerCase() : "";
        return (rental.customerName || "").toLowerCase().includes(searchQuery) ||
               bikeName.includes(searchQuery);
    });

    // Sort by return time (descending)
    filteredHistory.sort((a, b) => b.endTime - a.endTime);

    if (filteredHistory.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No completed transactions found.</td></tr>`;
        return;
    }

    filteredHistory.forEach(rental => {
        const bike = state.bikes.find(b => b.id === rental.bikeId);
        if (!bike) return;

        const start = new Date(rental.startTime);
        const end = new Date(rental.endTime);
        
        // Calculate duration display
        const durationHours = ((rental.endTime - rental.startTime) / (1000 * 60 * 60)).toFixed(1);
        const durationDisplay = bike.rateType === 'Hour' ? `${durationHours} hrs` : `${(durationHours / 24).toFixed(1)} days`;

        tableBody.innerHTML += `
            <tr>
                <td><strong>${rental.id}</strong></td>
                <td>
                    <div style="font-weight: 600;">${bike.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${bike.type} &bull; Rate: ₹${bike.rate}/${bike.rateType}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${rental.customerPhoto 
                            ? `<img src="${rental.customerPhoto}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); cursor: pointer;" onclick="viewCustomerPhoto('${rental.customerPhoto}')" title="Click to enlarge">`
                            : `<div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: var(--text-muted); font-weight: 700; border: 1px solid var(--border-color);">${rental.customerName.charAt(0)}</div>`}
                        <span>${rental.customerName}</span>
                    </div>
                </td>
                <td>${start.toLocaleDateString()} ${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                <td>${end.toLocaleDateString()} ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                <td>${durationDisplay}</td>
                <td style="color: var(--color-success); font-weight: 700;">₹${rental.actualCost.toFixed(2)}</td>
            </tr>
        `;
    });
}

// INVENTORY SEARCH & FILTER HANDLERS
document.getElementById("search-inventory").addEventListener("input", renderInventory);
document.getElementById("filter-type").addEventListener("change", renderInventory);
document.getElementById("filter-status").addEventListener("change", renderInventory);

// RENTALS & HISTORY SEARCH HANDLERS
document.getElementById("search-rentals").addEventListener("input", renderRentals);
document.getElementById("search-history").addEventListener("input", renderHistory);

// quick buttons on Dashboard
document.getElementById("btn-add-bike-quick").addEventListener("click", () => openAddBikeModal());
document.getElementById("btn-add-bike-top").addEventListener("click", () => openAddBikeModal());
document.getElementById("btn-view-inventory").addEventListener("click", () => {
    document.querySelector(".menu-list [data-target='inventory']").click();
});

// BIKE FORM MODAL SYSTEM
const modalBike = document.getElementById("modal-bike");
const formBike = document.getElementById("form-bike");

// ADMIN AUTHORIZATION SYSTEM
let pendingAdminAction = null;
const modalAuth = document.getElementById("modal-auth");
const formAuth = document.getElementById("form-auth");
const authPasswordInput = document.getElementById("auth-password");
const authErrorMsg = document.getElementById("auth-error-msg");

function requireAdminAuth(actionCallback) {
    pendingAdminAction = actionCallback;
    authPasswordInput.value = "";
    authErrorMsg.style.display = "none";
    modalAuth.classList.add("active");
    setTimeout(() => authPasswordInput.focus(), 100);
}

const closeAuthModal = () => {
    modalAuth.classList.remove("active");
    pendingAdminAction = null;
};
document.getElementById("modal-auth-close").addEventListener("click", closeAuthModal);
document.getElementById("modal-auth-cancel").addEventListener("click", closeAuthModal);

formAuth.addEventListener("submit", (e) => {
    e.preventDefault();
    const enteredPass = authPasswordInput.value;
    
    if (enteredPass === "847225") {
        const action = pendingAdminAction;
        closeAuthModal();
        if (typeof action === "function") {
            action();
        }
    } else {
        authErrorMsg.style.display = "block";
        authPasswordInput.value = "";
        authPasswordInput.focus();
        showToast("Authorization failed! Incorrect password.", "error");
    }
});

function openAddBikeModal() {
    requireAdminAuth(() => {
        document.getElementById("modal-bike-title").innerText = "Add New Bike";
        formBike.reset();
        document.getElementById("bike-form-id").value = "";
        document.getElementById("bike-status").disabled = false;
        modalBike.classList.add("active");
    });
}

function openEditBikeModal(bikeId) {
    const bike = state.bikes.find(b => b.id === bikeId);
    if (!bike) return;

    requireAdminAuth(() => {
        document.getElementById("modal-bike-title").innerText = "Edit Bike Details";
        document.getElementById("bike-form-id").value = bike.id;
        document.getElementById("bike-name").value = bike.name;
        document.getElementById("bike-type").value = bike.type;
        document.getElementById("bike-sn").value = bike.sn;
        document.getElementById("bike-rate").value = bike.rate;
        document.getElementById("bike-rate-type").value = bike.rateType;
        document.getElementById("bike-status").value = bike.status;
        
        // Disable status edits if rented to protect rental integrity
        document.getElementById("bike-status").disabled = bike.status === "Rented";

        modalBike.classList.add("active");
    });
}

// Close Bike Modal
const closeBikeModal = () => modalBike.classList.remove("active");
document.getElementById("modal-bike-close").addEventListener("click", closeBikeModal);
document.getElementById("modal-bike-cancel").addEventListener("click", closeBikeModal);

formBike.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("bike-form-id").value;
    const name = document.getElementById("bike-name").value;
    const type = document.getElementById("bike-type").value;
    const sn = document.getElementById("bike-sn").value;
    const rate = parseFloat(document.getElementById("bike-rate").value) || 0;
    const rateType = document.getElementById("bike-rate-type").value;
    const status = document.getElementById("bike-status").value;

    if (id) {
        // Edit flow
        const bikeIndex = state.bikes.findIndex(b => b.id === id);
        if (bikeIndex > -1) {
            state.bikes[bikeIndex] = { ...state.bikes[bikeIndex], name, type, sn, rate, rateType, status };
            showToast("Bike updated successfully!");
        }
    } else {
        // Create flow
        const newId = "b_" + Date.now();
        state.bikes.push({ id: newId, name, type, sn, rate, rateType, status });
        showToast("New bike added to fleet!");
    }

    saveState();
    closeBikeModal();
    
    // Clear search and dropdown filters so newly added bike is not hidden
    const searchInput = document.getElementById("search-inventory");
    const filterType = document.getElementById("filter-type");
    const filterStatus = document.getElementById("filter-status");
    if (searchInput) searchInput.value = "";
    if (filterType) filterType.value = "all";
    if (filterStatus) filterStatus.value = "all";

    // Switch to inventory tab and render
    const inventoryTab = document.querySelector(".menu-list [data-target='inventory']");
    if (inventoryTab) {
        inventoryTab.click();
    } else {
        renderActiveView("inventory");
    }
});

// DELETE BIKE
function deleteBike(id) {
    const bike = state.bikes.find(b => b.id === id);
    if (!bike) return;

    if (bike.status === "Rented") {
        showToast("Cannot delete a bike that is currently rented!", "error");
        return;
    }

    requireAdminAuth(() => {
        if (confirm(`Are you sure you want to remove ${bike.name} from the inventory?`)) {
            state.bikes = state.bikes.filter(b => b.id !== id);
            saveState();
            showToast("Bike removed from inventory.");
            renderInventory();
        }
    });
}

// QUICK STATE TOGGLES
function markReady(bikeId) {
    const bike = state.bikes.find(b => b.id === bikeId);
    if (bike) {
        bike.status = "Available";
        saveState();
        showToast(`${bike.name} is now available.`);
        renderInventory();
    }
}

// CAMERA CONTROL SYSTEM
let cameraStream = null;
let capturedPhotoData = null;

const videoElement = document.getElementById("rent-camera");
const canvasElement = document.getElementById("rent-canvas");
const photoPreview = document.getElementById("rent-photo-preview");
const cameraPlaceholder = document.getElementById("camera-placeholder");

const btnStartCamera = document.getElementById("btn-start-camera");
const btnCapturePhoto = document.getElementById("btn-capture-photo");
const btnRetakePhoto = document.getElementById("btn-retake-photo");

// Enforce numeric-only input on customer phone field
const customerPhoneInput = document.getElementById("customer-phone");
if (customerPhoneInput) {
    customerPhoneInput.addEventListener("input", function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
    });
}

// Enforce numeric-only input on alternate phone field
const altPhoneInput = document.getElementById("customer-alt-phone");
if (altPhoneInput) {
    altPhoneInput.addEventListener("input", function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
    });
}

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } })
        .then(stream => {
            cameraStream = stream;
            videoElement.srcObject = stream;
            videoElement.style.display = "block";
            photoPreview.style.display = "none";
            cameraPlaceholder.style.display = "none";
            
            btnStartCamera.style.display = "none";
            btnCapturePhoto.style.display = "block";
            btnRetakePhoto.style.display = "none";
        })
        .catch(err => {
            console.error("Camera access error: ", err);
            showToast("Could not access camera. Please check permissions.", "error");
        });
}

function capturePhoto() {
    if (!cameraStream) return;
    
    const context = canvasElement.getContext("2d");
    const width = videoElement.videoWidth || 320;
    const height = videoElement.videoHeight || 240;
    canvasElement.width = width;
    canvasElement.height = height;
    
    // No mirror flip — using back camera
    context.drawImage(videoElement, 0, 0, width, height);
    
    capturedPhotoData = canvasElement.toDataURL("image/jpeg");
    photoPreview.src = capturedPhotoData;
    
    photoPreview.style.display = "block";
    videoElement.style.display = "none";
    
    btnCapturePhoto.style.display = "none";
    btnRetakePhoto.style.display = "block";
    
    stopCamera();
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

function resetCameraUI() {
    stopCamera();
    capturedPhotoData = null;
    if (videoElement) {
        videoElement.srcObject = null;
        videoElement.style.display = "none";
    }
    if (photoPreview) {
        photoPreview.src = "";
        photoPreview.style.display = "none";
    }
    if (cameraPlaceholder) {
        cameraPlaceholder.style.display = "flex";
    }
    if (btnStartCamera) btnStartCamera.style.display = "block";
    if (btnCapturePhoto) btnCapturePhoto.style.display = "none";
    if (btnRetakePhoto) btnRetakePhoto.style.display = "none";
}

if (btnStartCamera) btnStartCamera.addEventListener("click", startCamera);
if (btnCapturePhoto) btnCapturePhoto.addEventListener("click", capturePhoto);
if (btnRetakePhoto) btnRetakePhoto.addEventListener("click", startCamera);

// Global customer photo viewer overlay
function viewCustomerPhoto(photoData) {
    if (!photoData) return;
    const viewer = document.createElement("div");
    viewer.style = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;";
    viewer.innerHTML = `<img src="${photoData}" style="max-width: 90%; max-height: 90%; border-radius: 12px; border: 2px solid #fff; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">`;
    viewer.onclick = () => viewer.remove();
    document.body.appendChild(viewer);
}

// INITIATE RENTAL MODAL SYSTEM
const modalRent = document.getElementById("modal-rent");
const formRent = document.getElementById("form-rent");

function openRentModal(bikeId) {
    const bike = state.bikes.find(b => b.id === bikeId);
    if (!bike || bike.status !== "Available") {
        showToast("Bike is not available for rent!", "error");
        return;
    }

    formRent.reset();
    document.getElementById("rent-bike-id").value = bike.id;
    document.getElementById("rent-bike-display-name").innerText = bike.name;
    document.getElementById("rent-bike-display-rate").innerText = `₹${bike.rate.toFixed(2)} per ${bike.rateType.toLowerCase()}`;
    document.getElementById("rent-duration-unit-label").innerText = `Est. Units (${bike.rateType}s)`;
    document.getElementById("rent-duration-unit").value = bike.rateType;
    document.getElementById("rent-estimated-cost").innerText = "₹0.00";
    
    resetCameraUI();

    modalRent.classList.add("active");
}

// Auto-estimate calculator during rent
document.getElementById("rent-duration").addEventListener("input", (e) => {
    const val = parseInt(e.target.value) || 0;
    const bikeId = document.getElementById("rent-bike-id").value;
    const bike = state.bikes.find(b => b.id === bikeId);
    if (bike) {
        let est;
        if (bike.type === "Electric" && bike.rateType === "Hour") {
            est = calculateElectricCost(val);
        } else {
            est = val * bike.rate;
        }
        document.getElementById("rent-estimated-cost").innerText = `₹${est.toFixed(2)}`;
    }
});

// Close Rent Modal
const closeRentModal = () => {
    modalRent.classList.remove("active");
    stopCamera();
};
document.getElementById("modal-rent-close").addEventListener("click", closeRentModal);
document.getElementById("modal-rent-cancel").addEventListener("click", closeRentModal);

const modalPaymentQr = document.getElementById("modal-payment-qr");
const paymentQrAmount = document.getElementById("payment-qr-amount");
const btnPaymentDone = document.getElementById("btn-payment-done");
const btnPaymentQrClose = document.getElementById("modal-payment-qr-close");

const closePaymentQrModal = () => {
    modalPaymentQr.classList.remove("active");
};
btnPaymentQrClose.addEventListener("click", closePaymentQrModal);

formRent.addEventListener("submit", (e) => {
    e.preventDefault();
    const bikeId = document.getElementById("rent-bike-id").value;
    const bike = state.bikes.find(b => b.id === bikeId);
    if (!bike || bike.status !== "Available") {
        showToast("Error renting bike.", "error");
        return;
    }
    
    // Transfer estimated cost to QR modal
    const estCost = document.getElementById("rent-estimated-cost").innerText;
    paymentQrAmount.innerText = estCost;
    
    // Switch modals
    closeRentModal();
    modalPaymentQr.classList.add("active");
});

btnPaymentDone.addEventListener("click", () => {
    const bikeId = document.getElementById("rent-bike-id").value;
    const customerName = document.getElementById("customer-name").value;
    const customerPhone = document.getElementById("customer-phone").value;
    const customerAltPhone = document.getElementById("customer-alt-phone").value || "";
    const customerAddress = document.getElementById("customer-address").value;
    const customerIdType = document.getElementById("customer-id-type").value;
    const customerIdNumber = document.getElementById("customer-id-number").value;
    const estDuration = parseInt(document.getElementById("rent-duration").value);

    const bike = state.bikes.find(b => b.id === bikeId);
    if (!bike || bike.status !== "Available") {
        showToast("Error processing rental.", "error");
        closePaymentQrModal();
        return;
    }

    // Set Bike to Rented
    bike.status = "Rented";

    // Create active rental log
    const rentalId = "r_" + Date.now();
    state.rentals.push({
        id: rentalId,
        bikeId: bike.id,
        customerName,
        customerPhone,
        customerAltPhone,
        customerAddress,
        customerIdType,
        customerIdNumber,
        customerPhoto: capturedPhotoData,
        startTime: Date.now(),
        endTime: null,
        estDuration,
        status: "Active",
        actualCost: null
    });

    saveState();
    closePaymentQrModal();
    showToast("Rental payment & process completed!");
    
    // Refresh Dashboard
    document.querySelector(".menu-list [data-target='dashboard']").click();
});

// RETURN BIKE MODAL SYSTEM
const modalReturn = document.getElementById("modal-return");
const formReturn = document.getElementById("form-return");

function openReturnModal(rentalId) {
    const rental = state.rentals.find(r => r.id === rentalId);
    if (!rental || rental.status !== "Active") {
        showToast("Cannot find active rental log.", "error");
        return;
    }

    const bike = state.bikes.find(b => b.id === rental.bikeId);
    if (!bike) return;

    document.getElementById("return-rental-id").value = rental.id;
    document.getElementById("return-bike-id").value = bike.id;
    
    document.getElementById("return-display-bike").innerText = bike.name;
    document.getElementById("return-display-customer").innerText = rental.customerName;
    
    const returnPhotoImg = document.getElementById("return-display-photo");
    if (rental.customerPhoto) {
        returnPhotoImg.src = rental.customerPhoto;
        returnPhotoImg.style.display = "block";
    } else {
        returnPhotoImg.style.display = "none";
    }
    
    const start = new Date(rental.startTime);
    document.getElementById("return-display-start").innerText = start.toLocaleString();
    
    const now = new Date();
    document.getElementById("return-display-end").innerText = now.toLocaleString();
    
    // Calculate difference (allow modification via custom prompt input or calculate mathematically)
    // To allow testers to modify durations (simulate hours since we just started it), we can do:
    let elapsedMs = now.getTime() - rental.startTime;
    
    // If it's less than 5 minutes, let's auto-simulate at least 1 unit so the cost isn't 0
    if (elapsedMs < 5 * 60 * 1000) {
        // Auto set 1 unit for testing convenience
        elapsedMs = (bike.rateType === "Hour" ? 1 : 24) * 60 * 60 * 1000;
    }

    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    let unitsElapsed = bike.rateType === "Hour" ? Math.max(1, Math.round(elapsedHours * 10) / 10) : Math.max(1, Math.round(elapsedHours / 24));
    
    document.getElementById("return-display-duration").innerText = `${unitsElapsed} ${bike.rateType.toLowerCase()}(s)`;
    
    const charge = (bike.type === "Electric" && bike.rateType === "Hour")
        ? calculateElectricCost(unitsElapsed)
        : unitsElapsed * bike.rate;
    document.getElementById("return-display-charge").innerText = `₹${charge.toFixed(2)}`;

    // Show pricing info button for Electric bikes
    const pricingHint = document.getElementById("electric-pricing-hint");
    if (pricingHint) pricingHint.style.display = (bike.type === "Electric") ? "block" : "none";

    modalReturn.classList.add("active");
}

// Close Return Modal
const closeReturnModal = () => modalReturn.classList.remove("active");
document.getElementById("modal-return-close").addEventListener("click", closeReturnModal);
document.getElementById("modal-return-cancel").addEventListener("click", closeReturnModal);

formReturn.addEventListener("submit", (e) => {
    e.preventDefault();
    const rentalId = document.getElementById("return-rental-id").value;
    const bikeId = document.getElementById("return-bike-id").value;
    const postStatus = document.getElementById("return-bike-status").value;

    const rental = state.rentals.find(r => r.id === rentalId);
    const bike = state.bikes.find(b => b.id === bikeId);

    if (!rental || !bike) {
        showToast("Error processing return.", "error");
        return;
    }

    // End rental time and calculate cost
    const endTime = Date.now();
    let elapsedMs = endTime - rental.startTime;
    
    // Test simulation fallback
    if (elapsedMs < 5 * 60 * 1000) {
        elapsedMs = (bike.rateType === "Hour" ? 1 : 24) * 60 * 60 * 1000;
    }

    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const unitsElapsed = bike.rateType === "Hour" ? Math.max(1, Math.round(elapsedHours * 10) / 10) : Math.max(1, Math.round(elapsedHours / 24));
    const cost = (bike.type === "Electric" && bike.rateType === "Hour")
        ? calculateElectricCost(unitsElapsed)
        : unitsElapsed * bike.rate;

    // Update Rental Log
    rental.endTime = endTime;
    rental.status = "Completed";
    rental.actualCost = cost;

    // Update Bike status
    bike.status = postStatus;

    saveState();
    closeReturnModal();
    showToast(`Bike returned. Charged: ₹${cost.toFixed(2)}`);

    // Refresh active section
    const activeTab = document.querySelector(".menu-list .menu-item.active").getAttribute("data-target");
    renderActiveView(activeTab);
});

// EXTEND RENTAL MODAL SYSTEM
const modalExtend = document.getElementById("modal-extend");
const formExtend = document.getElementById("form-extend");

function openExtendModal(rentalId) {
    const rental = state.rentals.find(r => r.id === rentalId);
    if (!rental || rental.status !== "Active") {
        showToast("Cannot find active rental log.", "error");
        return;
    }

    const bike = state.bikes.find(b => b.id === rental.bikeId);
    if (!bike) return;

    document.getElementById("extend-rental-id").value = rental.id;
    document.getElementById("extend-display-bike").innerText = bike.name;
    document.getElementById("extend-display-customer").innerText = rental.customerName;
    document.getElementById("extend-display-duration").innerText = `${rental.estDuration} ${bike.rateType.toLowerCase()}(s)`;
    
    const extendLabel = document.getElementById("extend-label");
    if (extendLabel) {
        extendLabel.innerText = `Extend By (${bike.rateType}s)`;
    }

    const extendAmountInput = document.getElementById("extend-amount");
    extendAmountInput.value = "";
    
    const initialCost = rental.estDuration * bike.rate;
    document.getElementById("extend-estimated-cost").innerText = `₹${initialCost.toFixed(2)}`;

    const calculateNewCost = () => {
        const val = parseInt(extendAmountInput.value) || 0;
        const newDuration = rental.estDuration + val;
        const newCost = newDuration * bike.rate;
        document.getElementById("extend-estimated-cost").innerText = `₹${newCost.toFixed(2)}`;
    };

    extendAmountInput.oninput = calculateNewCost;

    modalExtend.classList.add("active");
}

const closeExtendModal = () => {
    modalExtend.classList.remove("active");
};

document.getElementById("modal-extend-close").addEventListener("click", closeExtendModal);
document.getElementById("modal-extend-cancel").addEventListener("click", closeExtendModal);

formExtend.addEventListener("submit", (e) => {
    e.preventDefault();
    const rentalId = document.getElementById("extend-rental-id").value;
    const extendVal = parseInt(document.getElementById("extend-amount").value) || 0;

    const rental = state.rentals.find(r => r.id === rentalId);
    if (!rental) {
        showToast("Error finding rental to extend.", "error");
        return;
    }

    rental.estDuration += extendVal;
    
    saveState();
    closeExtendModal();
    showToast(`Rental duration extended by ${extendVal} unit(s).`);

    const activeTab = document.querySelector(".menu-list .menu-item.active").getAttribute("data-target");
    renderActiveView(activeTab);
});

// AUTHENTICATION SYSTEM
function checkAuth() {
    const loggedIn = sessionStorage.getItem("rentifly_logged_in");
    const loginOverlay = document.getElementById("login-overlay");
    const sidebar = document.querySelector("aside");
    const main = document.querySelector("main");
    const errorMsg = document.getElementById("login-error-msg");

    if (loggedIn === "true") {
        loginOverlay.style.display = "none";
        sidebar.style.display = "flex";
        main.style.display = "block";
        if (errorMsg) errorMsg.style.display = "none";
        
        // Load state and render the active tab
        loadState();
        const activeTab = document.querySelector(".menu-list .menu-item.active")?.getAttribute("data-target") || "dashboard";
        renderActiveView(activeTab);
    } else {
        loginOverlay.style.display = "flex";
        sidebar.style.display = "none";
        main.style.display = "none";
    }
}

// Define Admin accounts list
const ADMIN_ACCOUNTS = [
    { username: "8002079598", password: "847225" },
    { username: "7367915905", password: "847225" },
    { username: "6299532415", password: "847225" }
];

// Enforce numeric-only input and 10-digit limit on username field
const usernameInput = document.getElementById("login-username");
if (usernameInput) {
    usernameInput.addEventListener("input", function(e) {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 10);
    });
}

// Login Form submission
document.getElementById("form-login").addEventListener("submit", (e) => {
    e.preventDefault();
    const user = document.getElementById("login-username").value;
    const pass = document.getElementById("login-password").value;
    const errorMsg = document.getElementById("login-error-msg");

    const matchedAccount = ADMIN_ACCOUNTS.find(acc => acc.username === user && acc.password === pass);

    if (matchedAccount) {
        sessionStorage.setItem("rentifly_logged_in", "true");
        checkAuth();
        showToast("Welcome back, Admin!", "success");
    } else {
        if (errorMsg) errorMsg.style.display = "block";
        const passwordInput = document.getElementById("login-password");
        passwordInput.value = "";
        passwordInput.focus();
    }
});

// Logout Button handler
document.getElementById("btn-logout").addEventListener("click", () => {
    sessionStorage.removeItem("rentifly_logged_in");
    checkAuth();
    showToast("Logged out successfully.", "info");
});

// EARNINGS BREAKDOWN MODAL SYSTEM
const modalEarnings = document.getElementById("modal-earnings");
const cardRevenue = document.getElementById("card-revenue");

function openEarningsModal() {
    const completedRentals = state.rentals.filter(r => r.status === "Completed");
    
    const totalRevenue = completedRentals.reduce((sum, r) => sum + (r.actualCost || 0), 0);
    const totalCount = completedRentals.length;

    document.getElementById("earnings-total").innerText = `₹${totalRevenue.toFixed(2)}`;
    document.getElementById("earnings-count").innerText = totalCount;

    const breakdownList = document.getElementById("earnings-breakdown-list");
    breakdownList.innerHTML = "";

    if (totalCount === 0) {
        breakdownList.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 20px;">No completed transactions yet.</td></tr>`;
    } else {
        const sortedRentals = [...completedRentals].sort((a, b) => b.endTime - a.endTime);
        
        sortedRentals.forEach(rental => {
            const bike = state.bikes.find(b => b.id === rental.bikeId);
            const dateStr = new Date(rental.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
            
            const photoHtml = rental.customerPhoto 
                ? `<img src="${rental.customerPhoto}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color); cursor: pointer;" onclick="viewCustomerPhoto('${rental.customerPhoto}')" title="View photo">`
                : `<div style="width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 0.6rem; color: var(--text-muted); font-weight: 700; border: 1px solid var(--border-color);">${rental.customerName.charAt(0)}</div>`;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${bike ? bike.name : 'Deleted Bike'}</div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                        ${photoHtml}
                        <span>${rental.customerName} (${rental.customerPhone})</span>
                    </div>
                </td>
                <td><span style="font-size: 0.9rem; color: var(--text-secondary);">${dateStr}</span></td>
                <td style="color: var(--color-success); font-weight: 700; text-align: right;">₹${rental.actualCost.toFixed(2)}</td>
            `;
            breakdownList.appendChild(tr);
        });
    }

    modalEarnings.classList.add("active");
}

const closeEarningsModal = () => {
    modalEarnings.classList.remove("active");
};

if (cardRevenue) cardRevenue.addEventListener("click", openEarningsModal);
document.getElementById("modal-earnings-close").addEventListener("click", closeEarningsModal);
document.getElementById("modal-earnings-ok").addEventListener("click", closeEarningsModal);

// App Initialization
window.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    
    // Chrome-compatible mobile scroll lock for modals
    let scrollY = 0;
    const modals = document.querySelectorAll('.modal-overlay');
    
    function lockBodyScroll() {
        scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';
    }
    
    function unlockBodyScroll() {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
    }
    
    if (modals.length > 0) {
        const observer = new MutationObserver(() => {
            const isAnyModalOpen = Array.from(modals).some(m => m.classList.contains('active'));
            if (isAnyModalOpen) {
                lockBodyScroll();
            } else {
                unlockBodyScroll();
            }
        });
        modals.forEach(m => {
            observer.observe(m, { attributes: true, attributeFilter: ['class'] });
        });
    }
});
