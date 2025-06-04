class PIDController {
    constructor(kp = 1.0, ki = 0.1, kd = 0.05) {
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;
        this.previousError = 0;
        this.integral = 0;
        this.lastTime = Date.now();
    }

    update(setpoint, currentValue) {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        const error = setpoint - currentValue;

        // Proportional term
        const pTerm = this.kp * error;

        // Integral term
        this.integral += error * deltaTime;
        this.integral = Math.max(-50, Math.min(50, this.integral));
        const iTerm = this.ki * this.integral;

        // Derivative term
        const derivative = deltaTime > 0 ? (error - this.previousError) / deltaTime : 0;
        const dTerm = this.kd * derivative;

        // Calculate output
        const output = pTerm + iTerm + dTerm;

        // Update for next iteration
        this.previousError = error;
        this.lastTime = currentTime;

        return {
            output: output,
            pTerm: pTerm,
            iTerm: iTerm,
            dTerm: dTerm,
            error: error
        };
    }

    setParameters(kp, ki, kd) {
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;
    }

    reset() {
        this.previousError = 0;
        this.integral = 0;
        this.lastTime = Date.now();
    }
}

class EnhancedPIDGame {
    constructor() {
        this.currentExample = 'car';
        this.pid = new PIDController();
        this.currentValue = 30;
        this.setpoint = 60;
        this.manualInput = 0;
        this.animationId = null;
        this.isPaused = false;
        
        // Game state
        this.gameMode = 'sandbox';
        this.playerLevel = 1;
        this.experience = 0;
        this.score = 0;
        this.difficulty = 'easy';
        this.controlSensitivity = 1.0;
        this.soundEnabled = true;
        
        // Performance tracking
        this.stabilityScore = 0;
        this.speedScore = 0;
        this.accuracyScore = 0;
        this.sessionStartTime = Date.now();
        
        // Control states
        this.keyStates = {
            w: false, a: false, s: false, d: false,
            arrowUp: false, arrowLeft: false, arrowDown: false, arrowRight: false,
            space: false, shift: false, ctrl: false, r: false
        };
        
        this.pedalStates = {
            brake: false,
            accelerator: false
        };
        
        // Flight mode for drone
        this.flightMode = 'NORMAL'; // NORMAL, BOOST, PRECISION
        this.battery = 85; // Battery percentage
        this.droneOrientation = 0; // Degrees
        
        this.chartData = {
            time: [],
            setpoint: [],
            actual: [],
            output: [],
            manual: []
        };
        this.maxDataPoints = 100;
        
        this.initializeGame();
    }

    initializeGame() {
        this.setupWelcomeScreen();
        this.initializeChart();
        this.initializeControls();
        this.initializeKeyboardControls();
        this.initializePedalControls();
        this.setupSettingsPanel();
        this.updateGameHUD();
        this.loadGameState();
    }

    setupWelcomeScreen() {
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.gameMode = e.currentTarget.dataset.mode;
                this.startGame();
            });
        });
    }

    startGame() {
        const overlay = document.getElementById('gameOverlay');
        
        anime({
            targets: overlay,
            opacity: [1, 0],
            duration: 500,
            easing: 'easeOutQuad',
            complete: () => {
                overlay.style.display = 'none';
            }
        });
        
        this.loadExample('car');
        this.startAnimation();
        this.showNotification('Welcome to PID Academy!', 'success');
        
        // Show control help after 2 seconds
        setTimeout(() => {
            this.showControlHelp();
        }, 2000);
    }

    initializeChart() {
        const ctx = document.getElementById('pidChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Setpoint',
                        data: [],
                        borderColor: '#FFD700',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Actual',
                        data: [],
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'PID Output',
                        data: [],
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        borderWidth: 1,
                        fill: false,
                        yAxisID: 'y1',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 0 },
                scales: {
                    x: { display: false },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'white', font: { size: 10 } }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: 'white', font: { size: 10 } }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'white',
                            font: { size: 10 }
                        }
                    }
                },
                elements: {
                    point: { radius: 0, hoverRadius: 4 }
                }
            }
        });
    }

    initializeControls() {
        // System selector
        document.querySelectorAll('.system-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.system-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.loadExample(e.target.dataset.example);
                this.addExperience(10);
            });
        });

        // Settings toggle
        document.getElementById('settingsToggle').addEventListener('click', () => {
            this.toggleSettingsPanel();
        });

        // Control help
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' || e.key === 'H') {
                this.toggleControlHelp();
            }
        });

        document.getElementById('closeHelp').addEventListener('click', () => {
            this.hideControlHelp();
        });
    }

    initializeKeyboardControls() {
        // Keyboard event listeners
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });

        // Prevent default behavior for game keys
        document.addEventListener('keydown', (e) => {
            const gameKeys = ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
            if (gameKeys.includes(e.key)) {
                e.preventDefault();
            }
        });
    }

    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        
        // Movement keys
        if (key === 'w' || e.key === 'ArrowUp') {
            this.keyStates.w = true;
            this.updateControlIndicator('wKey', true);
        }
        if (key === 'a' || e.key === 'ArrowLeft') {
            this.keyStates.a = true;
            this.updateControlIndicator('aKey', true);
        }
        if (key === 's' || e.key === 'ArrowDown') {
            this.keyStates.s = true;
            this.updateControlIndicator('sKey', true);
        }
        if (key === 'd' || e.key === 'ArrowRight') {
            this.keyStates.d = true;
            this.updateControlIndicator('dKey', true);
        }
        
        // Special keys
        if (e.key === ' ') {
            this.keyStates.space = true;
            this.updateControlIndicator('spaceKey', true);
        }
        if (e.shiftKey) {
            this.keyStates.shift = true;
            this.updateControlIndicator('shiftKey', true);
            this.setFlightMode('BOOST');
        }
        if (e.ctrlKey) {
            this.keyStates.ctrl = true;
            this.updateControlIndicator('ctrlKey', true);
            this.setFlightMode('PRECISION');
        }
        if (key === 'r') {
            this.keyStates.r = true;
            this.resetOrientation();
        }
        
        // System switching (1-4)
        if (key >= '1' && key <= '4') {
            const systems = ['car', 'drone', 'temperature', 'pendulum'];
            const index = parseInt(key) - 1;
            if (systems[index]) {
                const btn = document.querySelector(`[data-example="${systems[index]}"]`);
                if (btn) btn.click();
            }
        }
        
        this.addExperience(1);
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        
        if (key === 'w' || e.key === 'ArrowUp') {
            this.keyStates.w = false;
            this.updateControlIndicator('wKey', false);
        }
        if (key === 'a' || e.key === 'ArrowLeft') {
            this.keyStates.a = false;
            this.updateControlIndicator('aKey', false);
        }
        if (key === 's' || e.key === 'ArrowDown') {
            this.keyStates.s = false;
            this.updateControlIndicator('sKey', false);
        }
        if (key === 'd' || e.key === 'ArrowRight') {
            this.keyStates.d = false;
            this.updateControlIndicator('dKey', false);
        }
        if (e.key === ' ') {
            this.keyStates.space = false;
            this.updateControlIndicator('spaceKey', false);
        }
        if (!e.shiftKey) {
            this.keyStates.shift = false;
            this.updateControlIndicator('shiftKey', false);
            this.setFlightMode('NORMAL');
        }
        if (!e.ctrlKey) {
            this.keyStates.ctrl = false;
            this.updateControlIndicator('ctrlKey', false);
            if (!this.keyStates.shift) {
                this.setFlightMode('NORMAL');
            }
        }
        if (key === 'r') {
            this.keyStates.r = false;
        }
    }

    updateControlIndicator(elementId, active) {
        const element = document.getElementById(elementId);
        if (element) {
            if (active) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        }
    }

    setFlightMode(mode) {
        this.flightMode = mode;
        const modeElement = document.getElementById('flightMode');
        if (modeElement) {
            modeElement.textContent = mode;
            
            // Visual feedback
            anime({
                targets: modeElement,
                scale: [1, 1.2, 1],
                duration: 300,
                easing: 'easeOutBack'
            });
        }
    }

    resetOrientation() {
        this.droneOrientation = 0;
        this.showNotification('Orientation Reset', 'success');
        this.addExperience(5);
    }

    initializePedalControls() {
        const brakePedal = document.getElementById('brakePedal');
        const acceleratorPedal = document.getElementById('acceleratorPedal');

        // Brake pedal events
        const brakeEvents = {
            start: () => {
                this.pedalStates.brake = true;
                brakePedal.classList.add('pressed');
                this.addExperience(2);
                this.playSound('brake');
            },
            end: () => {
                this.pedalStates.brake = false;
                brakePedal.classList.remove('pressed');
            }
        };

        // Accelerator pedal events
        const acceleratorEvents = {
            start: () => {
                this.pedalStates.accelerator = true;
                acceleratorPedal.classList.add('pressed');
                this.addExperience(2);
                this.playSound('accelerator');
            },
            end: () => {
                this.pedalStates.accelerator = false;
                acceleratorPedal.classList.remove('pressed');
            }
        };

        // Mouse events
        brakePedal.addEventListener('mousedown', brakeEvents.start);
        brakePedal.addEventListener('mouseup', brakeEvents.end);
        brakePedal.addEventListener('mouseleave', brakeEvents.end);
        
        acceleratorPedal.addEventListener('mousedown', acceleratorEvents.start);
        acceleratorPedal.addEventListener('mouseup', acceleratorEvents.end);
        acceleratorPedal.addEventListener('mouseleave', acceleratorEvents.end);

        // Touch events
        brakePedal.addEventListener('touchstart', (e) => { e.preventDefault(); brakeEvents.start(); });
        brakePedal.addEventListener('touchend', (e) => { e.preventDefault(); brakeEvents.end(); });
        
        acceleratorPedal.addEventListener('touchstart', (e) => { e.preventDefault(); acceleratorEvents.start(); });
        acceleratorPedal.addEventListener('touchend', (e) => { e.preventDefault(); acceleratorEvents.end(); });
    }

    setupSettingsPanel() {
        // Close panel button
        document.getElementById('closePanel').addEventListener('click', () => {
            this.closeSettingsPanel();
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // PID sliders
        const sliders = ['kp', 'ki', 'kd', 'setpoint'];
        sliders.forEach(param => {
            const slider = document.getElementById(`${param}Slider`);
            const value = document.getElementById(`${param}Value`);
            
            slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                value.textContent = val.toFixed(param === 'setpoint' ? 0 : 2);
                
                if (param === 'kp' || param === 'ki' || param === 'kd') {
                    this.pid.setParameters(
                        parseFloat(document.getElementById('kpSlider').value),
                        parseFloat(document.getElementById('kiSlider').value),
                        parseFloat(document.getElementById('kdSlider').value)
                    );
                    this.pid.reset();
                    this.providePIDFeedback(param, val);
                    this.addExperience(5);
                } else if (param === 'setpoint') {
                    this.setpoint = val;
                    this.pid.reset();
                }
            });
        });

        // Game settings
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.applyDifficultySettings();
            this.addExperience(15);
        });

        document.getElementById('sensitivitySlider').addEventListener('input', (e) => {
            this.controlSensitivity = parseFloat(e.target.value);
            document.getElementById('sensitivityValue').textContent = this.controlSensitivity.toFixed(1);
        });

        document.getElementById('soundEnabled').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });

        // Debug controls
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetSimulation());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveConfiguration());
    }

    providePIDFeedback(param, value) {
        const feedback = document.getElementById(`${param}Feedback`);
        let message = '';
        let className = '';

        switch(param) {
            case 'kp':
                if (value < 0.5) {
                    message = 'Low Kp: Slow response, steady-state error possible';
                    className = 'warning';
                } else if (value > 3) {
                    message = 'High Kp: Fast response but may oscillate';
                    className = 'warning';
                } else {
                    message = 'Good Kp range: Balanced response';
                    className = 'good';
                }
                break;
            case 'ki':
                if (value < 0.01) {
                    message = 'Low Ki: Steady-state error may persist';
                    className = 'warning';
                } else if (value > 1) {
                    message = 'High Ki: Risk of integral windup';
                    className = 'bad';
                } else {
                    message = 'Good Ki range: Eliminates steady-state error';
                    className = 'good';
                }
                break;
            case 'kd':
                if (value > 0.5) {
                    message = 'High Kd: Very sensitive to noise';
                    className = 'warning';
                } else if (value < 0.01) {
                    message = 'Low Kd: More overshoot possible';
                    className = 'warning';
                } else {
                    message = 'Good Kd range: Reduces overshoot';
                    className = 'good';
                }
                break;
        }

        feedback.textContent = message;
        feedback.className = `param-feedback ${className}`;
    }

    applyDifficultySettings() {
        const settings = {
            easy: { noise: 0.1, disturbance: 0.5, delay: 0, multiplier: 1.0 },
            medium: { noise: 0.3, disturbance: 1.0, delay: 0.1, multiplier: 1.5 },
            hard: { noise: 0.5, disturbance: 1.5, delay: 0.2, multiplier: 2.0 },
            expert: { noise: 0.8, disturbance: 2.0, delay: 0.3, multiplier: 3.0 }
        };
        
        this.difficultySettings = settings[this.difficulty];
        this.showNotification(`Difficulty: ${this.difficulty.toUpperCase()}`, 'success');
    }

    toggleSettingsPanel() {
        const panel = document.getElementById('settingsPanel');
        panel.classList.toggle('open');
    }

    closeSettingsPanel() {
        const panel = document.getElementById('settingsPanel');
        panel.classList.remove('open');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}Tab`).classList.remove('hidden');
    }

    loadExample(example) {
        this.currentExample = example;
        const container = document.getElementById('animationContainer');
        
        // Fade out animation
        anime({
            targets: container,
            opacity: [1, 0],
            duration: 200,
            easing: 'easeOutQuad',
            complete: () => {
                switch (example) {
                    case 'car':
                        this.loadCarExample(container);
                        break;
                    case 'drone':
                        this.loadDroneExample(container);
                        break;
                    case 'temperature':
                        this.loadTemperatureExample(container);
                        break;
                    case 'pendulum':
                        this.loadPendulumExample(container);
                        break;
                }
                
                // Fade in animation
                anime({
                    targets: container,
                    opacity: [0, 1],
                    duration: 400,
                    easing: 'easeOutQuad'
                });
            }
        });
        
        this.pid.reset();
        this.chartData = { time: [], setpoint: [], actual: [], output: [], manual: [] };
        this.updateSystemInfo();
        this.resetPerformanceMetrics();
    }

    loadCarExample(container) {
        container.innerHTML = `
            <div class="car-road"></div>
            <div class="car" id="car"></div>
            <div class="speedometer">
                <div style="font-size: 12px; margin-bottom: 5px;">SPEED</div>
                <div style="font-size: 28px; font-weight: bold;" id="speedDisplayBig">30</div>
                <div style="font-size: 10px; margin-top: 5px;">mph</div>
            </div>
        `;
        this.currentValue = 30;
        this.setpoint = 60;
        this.updateSliders();
    }

    loadDroneExample(container) {
        container.innerHTML = `
            <div class="drone-area">
                <div class="drone" id="drone">
                    <div class="propeller" style="top: -15px; left: -15px;"></div>
                    <div class="propeller" style="top: -15px; right: -15px;"></div>
                    <div class="propeller" style="bottom: -15px; left: -15px;"></div>
                    <div class="propeller" style="bottom: -15px; right: -15px;"></div>
                </div>
            </div>
        `;
        this.currentValue = 50;
        this.setpoint = 50;
        this.updateSliders();
        this.battery = 85;
        this.droneOrientation = 0;
        this.updateFlightStatus();
    }

    loadTemperatureExample(container) {
        container.innerHTML = `
            <div class="temperature-system">
                <div class="thermometer">
                    <div class="mercury" id="mercury"></div>
                </div>
            </div>
        `;
        this.currentValue = 20;
        this.setpoint = 25;
        this.updateSliders();
    }

    loadPendulumExample(container) {
        container.innerHTML = `
            <div class="pendulum-system">
                <div class="pendulum-pivot"></div>
                <div class="pendulum-rod" id="pendulumRod">
                    <div class="pendulum-bob"></div>
                </div>
                <div class="pendulum-base" id="pendulumBase"></div>
            </div>
        `;
        this.currentValue = 0;
        this.setpoint = 0;
        this.updateSliders();
    }

    updateSliders() {
        document.getElementById('setpointSlider').value = this.setpoint;
        document.getElementById('setpointValue').textContent = this.setpoint.toString();
    }

    updateSystemInfo() {
        // Update flight status for drone
        if (this.currentExample === 'drone') {
            this.updateFlightStatus();
        }
        
        // Update game stats
        this.updateGameStats();
    }

    updateFlightStatus() {
        const altElement = document.getElementById('altitudeValue');
        const speedElement = document.getElementById('speedValue');
        const batteryFill = document.getElementById('batteryFill');
        const compass = document.querySelector('.compass-needle');
        
        if (altElement) altElement.textContent = `${Math.round(this.currentValue)}m`;
        if (speedElement) speedElement.textContent = this.calculateSpeed();
        if (batteryFill) batteryFill.style.width = `${this.battery}%`;
        if (compass) compass.style.transform = `translate(-50%, -100%) rotate(${this.droneOrientation}deg)`;
        
        // Decrease battery over time
        this.battery = Math.max(0, this.battery - 0.01);
    }

    calculateSpeed() {
        let speed = 0;
        if (this.keyStates.w || this.keyStates.s || this.keyStates.a || this.keyStates.d) {
            speed = this.keyStates.shift ? 15 : this.keyStates.ctrl ? 3 : 8;
        }
        return speed;
    }

    updateGameStats() {
        const scoreElement = document.getElementById('gameScore');
        const gradeElement = document.getElementById('currentGrade');
        
        if (scoreElement) scoreElement.textContent = this.score.toLocaleString();
        
        if (gradeElement) {
            const overallScore = (this.stabilityScore + this.speedScore + this.accuracyScore) / 3;
            const grade = this.getGrade(overallScore);
            gradeElement.textContent = grade;
            gradeElement.className = `stat-value grade ${grade}`;
        }
    }

    animate() {
        if (this.isPaused) {
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }

        const pidResult = this.pid.update(this.setpoint, this.currentValue);
        
        // Calculate manual input based on controls
        this.calculateManualInput();
        
        // Apply system dynamics
        switch (this.currentExample) {
            case 'car':
                this.updateCarSystem(pidResult);
                break;
            case 'drone':
                this.updateDroneSystem(pidResult);
                break;
            case 'temperature':
                this.updateTemperatureSystem(pidResult);
                break;
            case 'pendulum':
                this.updatePendulumSystem(pidResult);
                break;
        }

        // Update PID displays
        document.getElementById('pTerm').textContent = pidResult.pTerm.toFixed(2);
        document.getElementById('iTerm').textContent = pidResult.iTerm.toFixed(2);
        document.getElementById('dTerm').textContent = pidResult.dTerm.toFixed(2);

        // Update performance metrics
        this.updatePerformanceMetrics(pidResult);
        
        // Update chart
        this.updateChart(pidResult);

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    calculateManualInput() {
        let manualForce = 0;
        
        switch (this.currentExample) {
            case 'car':
                if (this.pedalStates.accelerator) manualForce += 50;
                if (this.pedalStates.brake) manualForce -= 40;
                if (this.keyStates.w) manualForce += 30;
                if (this.keyStates.s) manualForce -= 25;
                break;
                
            case 'drone':
                if (this.keyStates.w) manualForce += 20;
                if (this.keyStates.s) manualForce -= 20;
                if (this.keyStates.space) manualForce = 0; // Emergency brake
                
                // Apply flight mode multipliers
                if (this.flightMode === 'BOOST') {
                    manualForce *= 2;
                } else if (this.flightMode === 'PRECISION') {
                    manualForce *= 0.3;
                }
                break;
                
            case 'temperature':
                if (this.keyStates.w) manualForce += 30;
                if (this.keyStates.s) manualForce -= 15;
                break;
                
            case 'pendulum':
                if (this.keyStates.a || this.pedalStates.brake) manualForce -= 15;
                if (this.keyStates.d || this.pedalStates.accelerator) manualForce += 15;
                break;
        }
        
        this.manualInput = manualForce * this.controlSensitivity;
    }

    updateCarSystem(pidResult) {
        // Add difficulty-based effects
        const noise = (Math.random() - 0.5) * (this.difficultySettings?.noise || 0.1);
        const disturbance = Math.sin(Date.now() * 0.001) * (this.difficultySettings?.disturbance || 0.5);
        
        const totalInput = pidResult.output + this.manualInput + disturbance;
        const acceleration = totalInput * 0.08;
        const drag = this.currentValue * 0.025;
        
        this.currentValue += (acceleration - drag + noise) * 0.1;
        this.currentValue = Math.max(0, Math.min(150, this.currentValue));

        // Update visual
        const car = document.getElementById('car');
        const speedDisplay = document.getElementById('speedDisplayBig');
        
        if (car) {
            const speed = this.currentValue / 150;
            const wobble = Math.sin(Date.now() * 0.02) * speed * 6;
            car.style.transform = `scaleX(${1 + speed * 0.15}) translateX(${wobble}px)`;
        }
        
        if (speedDisplay) {
            speedDisplay.textContent = Math.round(this.currentValue);
        }
    }

    updateDroneSystem(pidResult) {
        // Add difficulty and environmental effects
        const noise = (Math.random() - 0.5) * (this.difficultySettings?.noise || 0.1);
        const windDisturbance = Math.sin(Date.now() * 0.002) * (this.difficultySettings?.disturbance || 0.5);
        
        const totalThrust = pidResult.output + this.manualInput + windDisturbance;
        const thrust = totalThrust * 0.03;
        const gravity = -9.8 * 0.008;
        
        this.currentValue += (thrust + gravity + noise) * 0.1;
        this.currentValue = Math.max(0, Math.min(100, this.currentValue));

        // Update drone orientation based on movement
        if (this.keyStates.a) this.droneOrientation -= 2;
        if (this.keyStates.d) this.droneOrientation += 2;
        this.droneOrientation = this.droneOrientation % 360;

        // Update visual
        const drone = document.getElementById('drone');
        if (drone) {
            const altitude = (100 - this.currentValue) / 100;
            const hover = Math.sin(Date.now() * 0.01) * 2;
            const sway = Math.sin(Date.now() * 0.005) * 10;
            
            drone.style.top = `${altitude * 300 + 80 + hover}px`;
            drone.style.left = `${300 + sway}px`;
            drone.style.transform = `rotate(${this.droneOrientation * 0.1}deg)`;
        }
        
        this.updateFlightStatus();
    }

    updateTemperatureSystem(pidResult) {
        const noise = (Math.random() - 0.5) * (this.difficultySettings?.noise || 0.1);
        const ambientVariation = Math.sin(Date.now() * 0.0005) * (this.difficultySettings?.disturbance || 0.5);
        
        const totalHeating = Math.max(0, pidResult.output + this.manualInput);
        const heating = totalHeating * 0.015;
        const cooling = (this.currentValue - (20 + ambientVariation)) * 0.012;
        
        this.currentValue += (heating - cooling + noise) * 0.1;
        this.currentValue = Math.max(0, Math.min(100, this.currentValue));

        // Update visual
        const mercury = document.getElementById('mercury');
        if (mercury) {
            const height = Math.min(100, Math.max(0, this.currentValue));
            mercury.style.height = `${height}%`;
            
            // Dynamic color based on temperature
            const hue = Math.max(0, Math.min(60, height * 0.6));
            mercury.style.background = `linear-gradient(to top, hsl(${360 - hue * 4}, 70%, 50%), hsl(${60 - hue}, 80%, 60%))`;
        }
    }

    updatePendulumSystem(pidResult) {
        const noise = (Math.random() - 0.5) * (this.difficultySettings?.noise || 0.1);
        const externalForce = Math.sin(Date.now() * 0.003) * (this.difficultySettings?.disturbance || 0.5);
        
        const totalForce = pidResult.output + this.manualInput + externalForce;
        const force = totalForce * 0.08;
        const gravity = Math.sin(this.currentValue * Math.PI / 180) * 3;
        const damping = this.currentValue * 0.08;
        
        this.currentValue += (force - gravity - damping + noise) * 0.1;
        this.currentValue = Math.max(-75, Math.min(75, this.currentValue));

        // Update visual
        const rod = document.getElementById('pendulumRod');
        const base = document.getElementById('pendulumBase');
        
        if (rod) {
            rod.style.transform = `rotate(${this.currentValue}deg)`;
        }
        
        if (base) {
            const baseOffset = totalForce * 0.3;
            base.style.transform = `translateX(calc(-50% + ${baseOffset}px))`;
        }
    }

    updatePerformanceMetrics(pidResult) {
        const error = Math.abs(pidResult.error);
        const setpointRange = Math.abs(this.setpoint) || 1;
        const errorPercent = (error / setpointRange) * 100;
        
        // Calculate scores
        const stabilityScore = Math.max(0, 100 - errorPercent * 2);
        const responseTime = (Date.now() - this.sessionStartTime) / 1000;
        const speedScore = Math.max(0, 100 - Math.min(responseTime * 2, 50));
        const accuracyScore = Math.max(0, 100 - errorPercent);
        
        // Smooth the scores
        this.stabilityScore = this.stabilityScore * 0.9 + stabilityScore * 0.1;
        this.speedScore = this.speedScore * 0.9 + speedScore * 0.1;
        this.accuracyScore = this.accuracyScore * 0.9 + accuracyScore * 0.1;
        
        // Update UI
        this.updateMetricBar('stability', this.stabilityScore);
        this.updateMetricBar('speed', this.speedScore);
        this.updateMetricBar('accuracy', this.accuracyScore);
        
        // Add XP for good performance
        if ((this.stabilityScore + this.speedScore + this.accuracyScore) / 3 > 80) {
            this.addExperience(1);
        }
    }

    updateMetricBar(metric, score) {
        const fill = document.getElementById(`${metric}Fill`);
        const value = document.getElementById(`${metric}Value`);
        
        if (fill && value) {
            fill.style.width = `${score}%`;
            value.textContent = `${Math.round(score)}%`;
        }
    }

    getGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    resetPerformanceMetrics() {
        this.stabilityScore = 0;
        this.speedScore = 0;
        this.accuracyScore = 0;
        this.sessionStartTime = Date.now();
    }

    updateChart(pidResult) {
        const currentTime = Date.now();
        
        this.chartData.time.push(currentTime);
        this.chartData.setpoint.push(this.setpoint);
        this.chartData.actual.push(this.currentValue);
        this.chartData.output.push(pidResult.output);

        if (this.chartData.time.length > this.maxDataPoints) {
            this.chartData.time.shift();
            this.chartData.setpoint.shift();
            this.chartData.actual.shift();
            this.chartData.output.shift();
        }

        this.chart.data.labels = this.chartData.time.map((_, i) => i);
        this.chart.data.datasets[0].data = this.chartData.setpoint;
        this.chart.data.datasets[1].data = this.chartData.actual;
        this.chart.data.datasets[2].data = this.chartData.output;
        this.chart.update('none');
    }

    // Game management functions
    addExperience(amount) {
        if (this.konamiMode) amount *= 5; // Easter egg bonus
        
        const bonusXP = Math.round(amount * (this.difficultySettings?.multiplier || 1));
        this.experience += bonusXP;
        
        const newLevel = Math.floor(this.experience / 100) + 1;
        if (newLevel > this.playerLevel) {
            this.playerLevel = newLevel;
            this.showNotification(`Level Up! Welcome to Level ${this.playerLevel}!`, 'success');
            this.addScore(this.playerLevel * 50);
            this.playSound('levelup');
        }
        
        this.updateGameHUD();
    }

    addScore(points) {
        this.score += points;
        this.updateGameHUD();
        
        anime({
            targets: '#scoreValue',
            scale: [1, 1.2, 1],
            duration: 400,
            easing: 'easeOutBack'
        });
    }

    updateGameHUD() {
        document.getElementById('playerLevel').textContent = this.playerLevel;
        
        const xpInLevel = this.experience % 100;
        const xpFill = document.getElementById('xpFill');
        const xpText = document.getElementById('xpText');
        
        if (xpFill && xpText) {
            xpFill.style.width = `${xpInLevel}%`;
            xpText.textContent = `${xpInLevel}/100 XP`;
        }
        
        document.getElementById('scoreValue').textContent = this.score.toLocaleString();
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                container.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showControlHelp() {
        const helpElement = document.getElementById('controlHelp');
        helpElement.classList.add('show');
        
        setTimeout(() => {
            this.hideControlHelp();
        }, 8000);
    }

    hideControlHelp() {
        const helpElement = document.getElementById('controlHelp');
        helpElement.classList.remove('show');
    }

    toggleControlHelp() {
        const helpElement = document.getElementById('controlHelp');
        if (helpElement.classList.contains('show')) {
            this.hideControlHelp();
        } else {
            this.showControlHelp();
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        
        // Placeholder for Web Audio API implementation
        console.log(`Playing ${type} sound`);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('pauseBtn');
        btn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
        
        this.showNotification(this.isPaused ? 'Simulation Paused' : 'Simulation Resumed', 'info');
    }

    resetSimulation() {
        this.pid.reset();
        this.chartData = { time: [], setpoint: [], actual: [], output: [], manual: [] };
        
        // Reset to appropriate starting values
        switch(this.currentExample) {
            case 'car': this.currentValue = 30; break;
            case 'drone': this.currentValue = 50; this.battery = 85; this.droneOrientation = 0; break;
            case 'temperature': this.currentValue = 20; break;
            case 'pendulum': this.currentValue = 0; break;
        }
        
        this.resetPerformanceMetrics();
        this.showNotification('Simulation Reset', 'success');
        this.addExperience(10);
    }

    saveConfiguration() {
        const config = {
            timestamp: new Date().toISOString(),
            user: 'al-chris',
            system: this.currentExample,
            difficulty: this.difficulty,
            pid: {
                kp: this.pid.kp,
                ki: this.pid.ki,
                kd: this.pid.kd
            },
            setpoint: this.setpoint,
            performance: {
                stability: this.stabilityScore,
                speed: this.speedScore,
                accuracy: this.accuracyScore,
                grade: this.getGrade((this.stabilityScore + this.speedScore + this.accuracyScore) / 3)
            },
            playerLevel: this.playerLevel,
            score: this.score
        };
        
        // Save to localStorage
        const savedConfigs = JSON.parse(localStorage.getItem('pidConfigs') || '[]');
        savedConfigs.push(config);
        localStorage.setItem('pidConfigs', JSON.stringify(savedConfigs));
        
        this.showNotification('Configuration Saved!', 'success');
        this.addExperience(20);
        
        // Download as JSON
        this.downloadConfig(config);
    }

    downloadConfig(config) {
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `pid-config-${this.currentExample}-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    saveGameState() {
        const gameState = {
            playerLevel: this.playerLevel,
            experience: this.experience,
            score: this.score,
            difficulty: this.difficulty,
            controlSensitivity: this.controlSensitivity,
            soundEnabled: this.soundEnabled,
            lastPlayed: new Date().toISOString()
        };
        
        localStorage.setItem('pidGameState', JSON.stringify(gameState));
    }

    loadGameState() {
        const savedState = localStorage.getItem('pidGameState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.playerLevel = state.playerLevel || 1;
            this.experience = state.experience || 0;
            this.score = state.score || 0;
            this.difficulty = state.difficulty || 'easy';
            this.controlSensitivity = state.controlSensitivity || 1.0;
            this.soundEnabled = state.soundEnabled !== undefined ? state.soundEnabled : true;
            
            // Update UI elements
            document.getElementById('difficultySelect').value = this.difficulty;
            document.getElementById('sensitivitySlider').value = this.controlSensitivity;
            document.getElementById('sensitivityValue').textContent = this.controlSensitivity.toFixed(1);
            document.getElementById('soundEnabled').checked = this.soundEnabled;
            
            this.applyDifficultySettings();
        }
    }

    startAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.animate();
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// Initialize the enhanced game
window.addEventListener('load', () => {
    const game = new EnhancedPIDGame();
    
    // Store global reference for debugging
    window.gameInstance = game;
    
    // Add entrance animations
    anime({
        targets: '.game-hud',
        translateY: [-60, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutBack',
        delay: 300
    });
    
    anime({
        targets: '.system-selector .system-btn',
        scale: [0, 1],
        opacity: [0, 1],
        delay: anime.stagger(100, {start: 600}),
        duration: 600,
        easing: 'easeOutElastic(1, .8)'
    });
    
    anime({
        targets: '.game-area',
        scale: [0.9, 1],
        opacity: [0, 1],
        duration: 1000,
        easing: 'easeOutQuad',
        delay: 500
    });
    
    console.log(`
🎮 PID Academy Enhanced - Loaded Successfully!
==========================================
👤 User: al-chris
🕒 Session: ${new Date().toISOString()}
🎯 Enhanced Controls & Responsive Layout Active
==========================================

Enhanced Features:
✅ Responsive viewport-friendly design
✅ Advanced keyboard controls (WASD + Special keys)
✅ Realistic pedal system with visual feedback
✅ Collapsible settings panel
✅ Flight modes for drone (Normal/Boost/Precision)
✅ Real-time performance metrics
✅ Mobile-friendly touch controls
✅ Auto-save functionality

Controls:
🎮 WASD/Arrow Keys: Movement
⚡ Shift: Boost mode
🎯 Ctrl: Precision mode
🚫 Space: Emergency brake
🔄 R: Reset orientation
🔢 1-4: Switch systems
❓ H: Toggle help

Ready to master PID control! 🚀
    `);
});

// Auto-save on page unload
window.addEventListener('beforeunload', () => {
    if (window.gameInstance) {
        window.gameInstance.saveGameState();
        window.gameInstance.stopAnimation();
    }
});

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.gameInstance) {
        if (document.hidden) {
            window.gameInstance.isPaused = true;
        } else {
            window.gameInstance.isPaused = false;
        }
    }
});

// Add resize handler
window.addEventListener('resize', () => {
    if (window.gameInstance && window.gameInstance.chart) {
        window.gameInstance.chart.resize();
    }
});