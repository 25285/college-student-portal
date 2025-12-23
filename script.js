document.addEventListener("DOMContentLoaded", () => {
    // Initialize Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ==========================================
    //  PART 1: LOGIN PAGE LOGIC
    // ==========================================
    const rollInput = document.getElementById('rollNumber');

    if (rollInput) {
        // We are on the Login Page
        const toggleRollBtn = document.getElementById('toggleRoll');
        const otpForm = document.getElementById('otpForm');
        const sendOtpBtn = document.getElementById('sendOtpBtn');
        const otpSection = document.getElementById('otpSection');
        const verifyBtn = document.getElementById('verifyBtn');

        // Toggle Password View
        if (toggleRollBtn) {
            toggleRollBtn.addEventListener('click', () => {
                const isText = rollInput.getAttribute('type') === 'text';
                rollInput.setAttribute('type', isText ? 'password' : 'text');
                const newIcon = isText ? 'eye-off' : 'eye';
                toggleRollBtn.innerHTML = `<i data-lucide="${newIcon}"></i>`;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
        }

        // Send OTP
        if (otpForm) {
            otpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const emailValue = document.getElementById('email').value;
                const rollValue = rollInput.value;

                sendOtpBtn.innerText = "Sending...";
                sendOtpBtn.disabled = true;

                try {
                    const response = await fetch('/send-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rollNumber: rollValue, email: emailValue })
                    });
                    const data = await response.json();

                    if (data.success) {
                        alert("OTP Sent! Check your email.");
                        sendOtpBtn.style.display = 'none';
                        otpSection.style.display = 'block';
                        document.getElementById('email').disabled = true;
                        rollInput.disabled = true;
                    } else {
                        alert("Error: " + data.message);
                        sendOtpBtn.innerText = "Send OTP";
                        sendOtpBtn.disabled = false;
                    }
                } catch (error) {
                    console.error(error);
                    alert("System Error");
                    sendOtpBtn.innerText = "Send OTP";
                    sendOtpBtn.disabled = false;
                }
            });
        }

        // Verify OTP
        if (verifyBtn) {
            verifyBtn.addEventListener('click', async () => {
                const otpValue = document.getElementById('otpInput').value;
                const rollValue = rollInput.value;

                verifyBtn.innerText = "Verifying...";
                
                try {
                    const response = await fetch('/verify-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rollNumber: rollValue, otp: otpValue })
                    });
                    const data = await response.json();

                    if (data.success) {
                        // *** SAVE DATA TO MEMORY ***
                        localStorage.setItem("studentUser", JSON.stringify(data.user));
                        
                        alert("LOGIN SUCCESSFUL!");
                        window.location.href = "dashboard.html"; 
                    } else {
                        alert("Error: " + data.message);
                        verifyBtn.innerText = "Verify & Login";
                    }
                } catch (error) {
                    console.error(error);
                    alert("System Error");
                }
            });
        }
    }

    // ==========================================
    //  PART 2: DASHBOARD PAGE LOGIC
    // ==========================================
    const dashboardHeader = document.getElementById('dash_name_header');

    if (dashboardHeader) {
        // We are on the Dashboard Page
        const userDataJSON = localStorage.getItem("studentUser");

        if (!userDataJSON) {
            alert("Session expired. Please login again.");
            window.location.href = "index.html";
            return;
        }

        const user = JSON.parse(userDataJSON);

        // Inject Data into HTML (using the IDs)
        if(dashboardHeader) dashboardHeader.innerText = user.name.split(" ")[0]; // First name
        
        const dashNameCard = document.getElementById("dash_name_card");
        if(dashNameCard) dashNameCard.innerText = user.name;

        const dashRoll = document.getElementById("dash_roll");
        if(dashRoll) dashRoll.innerText = user.roll;

        const dashBranch = document.getElementById("dash_branch");
        if(dashBranch) dashBranch.innerText = user.branch;
        
        const dashYear = document.getElementById("dash_year");
        if(dashYear) dashYear.innerText = user.year;

        // Sidebar Navigation
        document.querySelectorAll(".nav-link").forEach((link) => {
            link.addEventListener("click", (e) => {
                if (link.getAttribute("onclick")) return; // Skip logout button
                e.preventDefault();
                document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
                link.classList.add("active");
            });
        });
    }
});

function logout() {
    localStorage.removeItem("studentUser");
    window.location.href = "index.html";
}