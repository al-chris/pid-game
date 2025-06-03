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
        // Prevent integral windup
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

class GamePIDDemo {
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
        this.achievements = [];
        this.activeChallenges = [];
        this.difficulty = 'easy';
        this.difficultySettings = { noise: 0.1, disturbance: 0.5, delay: 0 };
        
        // Performance tracking
        this.performanceHistory = [];
        this.stabilityScore = 0;
        this.speedScore = 0;
        this.accuracyScore = 0;
        this.sessionStartTime = Date.now();
        
        this.chartData = {
            time: [],
            setpoint: [],
            actual: [],
            output: [],
            manual: []
        };
        this.maxDataPoints = 100;
        
        // Input states
        this.inputStates = {
            gas: false,
            brake: false,
            steering: 0,
            joystick: { x: 0, y: 0 },
            throttle: 50,
            heater: 0,
            force: 0
        };
        
        // Hints system
        this.hints = [
            "Welcome to PID Academy! Try adjusting the Proportional (Kp) gain to see immediate response changes!",
            "The Integral (Ki) term helps eliminate steady-state error over time.",
            "Derivative (Kd) reduces overshoot and oscillations - great for smooth control!",
            "Higher difficulty adds more disturbances and noise to test your skills.",
            "Watch the performance metrics to optimize your PID parameters!",
            "Manual inputs help you test how well your PID controller responds to disturbances.",
            "Try different setpoints to see how your controller adapts!",
            "A good PID controller balances speed, stability, and accuracy.",
            "Press and hold the gas/brake pedals to disturb the car's speed!",
            "The drone's throttle slider controls altitude - try fighting against the PID!"
        ];
        this.currentHintIndex = 0;
        this.hintTimer = null;
        
        this.initializeGame();
    }

    initializeGame() {
        this.setupWelcomeScreen();
        this.initializeChart();
        this.initializeControls();
        this.initializeExamples();
        this.setupChallenges();
        this.setupHints();
        this.updateGameHUD();
        this.applyDifficultySettings();
    }

    setupWelcomeScreen() {
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.gameMode = e.currentTarget.dataset.mode;
                this.startGame();
                
                // Add entrance animation
                anime({
                    targets: '.mode-btn',
                    scale: [1, 0.8],
                    opacity: [1, 0],
                    duration: 300,
                    easing: 'easeInQuad'
                });
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
        
        // Animate HUD entrance
        anime({
            targets: '.game-hud',
            translateY: [-100, 0],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutBack'
        });
        
        // Start with tutorial hints for new players
        if (this.gameMode === 'tutorial') {
            this.startTutorial();
        } else if (this.gameMode === 'challenge') {
            this.startChallengeMode();
        } else {
            this.startSandboxMode();
        }
        
        this.loadExample('car');
        this.startAnimation();
        this.startHintTimer();
    }

    startTutorial() {
        this.updateMission("Tutorial: Learn the Basics", "Adjust PID parameters and observe the system response", 0);
        this.addChallenge({
            id: 'tutorial_1',
            title: 'First Steps',
            description: 'Adjust the Proportional (Kp) parameter to 2.0',
            target: 'kp_target',
            targetValue: 2.0,
            reward: 100,
            progress: 0
        });
        
        this.addChallenge({
            id: 'tutorial_2',
            title: 'Speed Control',
            description: 'Use the gas pedal to accelerate the car',
            target: 'gas_used',
            reward: 75,
            progress: 0
        });
    }

    startChallengeMode() {
        this.updateMission("Challenge Mode", "Complete missions to earn XP and unlock achievements", 0);
        this.setupChallengeMissions();
    }

    startSandboxMode() {
        this.updateMission("Sandbox Mode", "Experiment freely with PID control systems", 100);
        this.addExperience(25); // Bonus for starting
    }

    setupChallengeMissions() {
        const challenges = [
            {
                id: 'speed_master',
                title: 'Speed Master',
                description: 'Maintain target speed within 5% for 30 seconds',
                target: 'speed_stable',
                reward: 200,
                progress: 0
            },
            {
                id: 'smooth_operator',
                title: 'Smooth Operator',
                description: 'Achieve 90% stability score',
                target: 'stability_90',
                reward: 300,
                progress: 0
            },
            {
                id: 'quick_response',
                title: 'Quick Response',
                description: 'Reach setpoint in under 10 seconds',
                target: 'quick_response',
                reward: 150,
                progress: 0
            },
            {
                id: 'disturbance_handler',
                title: 'Disturbance Handler',
                description: 'Handle manual disturbances without losing control',
                target: 'handle_disturbance',
                reward: 250,
                progress: 0
            }
        ];
        
        challenges.forEach(challenge => this.addChallenge(challenge));
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
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Actual Value',
                        data: [],
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'PID Output',
                        data: [],
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        yAxisID: 'y1',
                        tension: 0.1
                    },
                    {
                        label: 'Manual Input',
                        data: [],
                        borderColor: '#9b59b6',
                        backgroundColor: 'rgba(155, 89, 182, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        yAxisID: 'y1',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    duration: 0
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'white',
                            font: {
                                weight: 'bold'
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            color: 'white',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'white',
                            font: {
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        borderWidth: 1
                    }
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 6
                    }
                }
            }
        });
    }

    initializeControls() {
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
                    this.checkChallengeProgress('kp_adjusted');
                    this.checkChallengeProgress('kp_target', val);
                    this.addExperience(5);
                    
                    // Visual feedback
                    anime({
                        targets: `#${param}Value`,
                        scale: [1, 1.2, 1],
                        duration: 300,
                        easing: 'easeOutBack'
                    });
                    
                } else if (param === 'setpoint') {
                    this.setpoint = val;
                    this.checkChallengeProgress('setpoint_changed');
                    this.pid.reset(); // Reset to avoid large derivative spike
                }
            });
        });

        // Difficulty selector
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.applyDifficultySettings();
            this.addExperience(15);
        });

        // Chart controls
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
                    message = 'Low Kp: Slow response, may have steady-state error';
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
                    message = 'High Ki: May cause integral windup';
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
        
        // Add pulse animation for feedback
        anime({
            targets: feedback,
            scale: [1, 1.05, 1],
            duration: 400,
            easing: 'easeOutQuad'
        });
    }

    applyDifficultySettings() {
        const settings = {
            easy: { noise: 0.1, disturbance: 0.5, delay: 0, multiplier: 1.0 },
            medium: { noise: 0.3, disturbance: 1.0, delay: 0.1, multiplier: 1.5 },
            hard: { noise: 0.5, disturbance: 1.5, delay: 0.2, multiplier: 2.0 },
            expert: { noise: 0.8, disturbance: 2.0, delay: 0.3, multiplier: 3.0 }
        };
        
        this.difficultySettings = settings[this.difficulty];
        this.showAchievement(`Difficulty: ${this.difficulty.toUpperCase()}`, `XP multiplier: ${this.difficultySettings.multiplier}x`);
    }

    initializeExamples() {
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.example-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.loadExample(e.target.dataset.example);
                this.addExperience(10);
                
                // Button animation
                anime({
                    targets: e.target,
                    scale: [1, 0.95, 1],
                    duration: 200,
                    easing: 'easeOutQuad'
                });
            });
        });
    }

    loadExample(example) {
        this.currentExample = example;
        const container = document.getElementById('animationContainer');
        
        // Reset input states
        this.inputStates = {
            gas: false,
            brake: false,
            steering: 0,
            joystick: { x: 0, y: 0 },
            throttle: 50,
            heater: 0,
            force: 0
        };
        
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
            <div class="control-instruction">🚗 Use gas and brake pedals to test your cruise control system!</div>
            <div class="status-display">
                <div>Speed: <span id="speedDisplay">30</span> mph</div>
                <div>Target: <span id="targetSpeedDisplay">60</span> mph</div>
                <div>Gas Input: <span id="gasInput">0</span>%</div>
                <div>Brake Input: <span id="brakeInput">0</span>%</div>
                <div>PID Output: <span id="pidOutput">0</span>%</div>
            </div>
            <div class="car-road"></div>
            <div class="car" id="car"></div>
            <div class="speedometer">
                <div style="font-size: 14px; margin-bottom: 8px;">SPEED</div>
                <div style="font-size: 32px; font-weight: bold;" id="speedDisplayBig">30</div>
                <div style="font-size: 12px; margin-top: 8px;">mph</div>
            </div>
            <div class="interactive-controls">
                <div class="pedal" id="gasPedal">
                    <div class="pedal-icon">⛽</div>
                    <div class="pedal-label">GAS</div>
                </div>
                <div class="pedal brake" id="brakePedal">
                    <div class="pedal-icon">🛑</div>
                    <div class="pedal-label">BRAKE</div>
                </div>
            </div>
        `;
        this.setupCarControls();
        this.currentValue = 30;
        this.setpoint = 60;
        document.getElementById('setpointSlider').value = 60;
        document.getElementById('setpointValue').textContent = '60';
    }

    loadDroneExample(container) {
        container.innerHTML = `
            <div class="control-instruction">🚁 Control the drone's altitude with the throttle slider!</div>
            <div class="drone-area">
                <div class="status-display">
                    <div>Altitude: <span id="altitudeDisplay">50</span>m</div>
                    <div>Target: <span id="targetAltDisplay">50</span>m</div>
                    <div>Throttle: <span id="throttleInput">50</span>%</div>
                    <div>PID Thrust: <span id="pidThrust">0</span>%</div>
                    <div>Total Power: <span id="totalPower">50</span>%</div>
                </div>
                <div class="drone" id="drone">
                    <div class="propeller" style="top: -18px; left: -18px;"></div>
                    <div class="propeller" style="top: -18px; right: -18px;"></div>
                    <div class="propeller" style="bottom: -18px; left: -18px;"></div>
                    <div class="propeller" style="bottom: -18px; right: -18px;"></div>
                </div>
            </div>
            <div class="interactive-controls">
                <div class="joystick-container">
                    <div class="joystick" id="joystick"></div>
                </div>
                <input type="range" class="throttle-slider" id="throttleSlider" 
                       min="0" max="100" value="50" orient="vertical">
                <div style="margin-left: 10px; font-size: 12px; text-align: center;">
                    <div>THROTTLE</div>
                    <div style="margin-top: 5px; font-weight: bold;"><span id="throttleDisplay">50</span>%</div>
                </div>
            </div>
        `;
        this.setupDroneControls();
        this.currentValue = 50;
        this.setpoint = 50;
        document.getElementById('setpointSlider').value = 50;
        document.getElementById('setpointValue').textContent = '50';
    }

    loadTemperatureExample(container) {
        container.innerHTML = `
            <div class="control-instruction">🌡️ Adjust the manual heater and watch PID maintain temperature!</div>
            <div class="temperature-system">
                <div class="status-display">
                    <div>Temperature: <span id="tempDisplay">20</span>°C</div>
                    <div>Target: <span id="tempTargetDisplay">25</span>°C</div>
                    <div>Manual Heater: <span id="manualHeaterDisplay">0</span>%</div>
                    <div>PID Heater: <span id="pidHeaterDisplay">0</span>%</div>
                    <div>Total Heat: <span id="totalHeatDisplay">0</span>%</div>
                </div>
                <div class="thermometer">
                    <div class="mercury" id="mercury"></div>
                </div>
                <div class="heater-control" id="heaterControl"></div>
            </div>
            <div class="interactive-controls">
                <input type="range" class="throttle-slider" id="heaterSlider" 
                       min="0" max="100" value="0" orient="vertical">
                <div style="margin-left: 15px; font-size: 12px; text-align: center;">
                    <div>MANUAL</div>
                    <div>HEATER</div>
                    <div style="margin-top: 5px; font-weight: bold;"><span id="heaterSliderDisplay">0</span>%</div>
                </div>
            </div>
        `;
        this.setupTemperatureControls();
        this.currentValue = 20;
        this.setpoint = 25;
        document.getElementById('setpointSlider').value = 25;
        document.getElementById('setpointValue').textContent = '25';
    }

    loadPendulumExample(container) {
        container.innerHTML = `
            <div class="control-instruction">⚖️ Use force buttons or arrow keys to disturb the pendulum!</div>
            <div class="pendulum-system">
                <div class="status-display">
                    <div>Angle: <span id="angleDisplay">0</span>°</div>
                    <div>Target: <span id="angleTargetDisplay">0</span>°</div>
                    <div>Manual Force: <span id="manualForceDisplay">0</span>N</div>
                    <div>PID Force: <span id="pidForceDisplay">0</span>N</div>
                    <div>Total Force: <span id="totalForceDisplay">0</span>N</div>
                </div>
                <div class="pendulum-pivot"></div>
                <div class="pendulum-rod" id="pendulumRod">
                    <div class="pendulum-bob"></div>
                </div>
                <div class="pendulum-base" id="pendulumBase"></div>
            </div>
            <div class="interactive-controls">
                <div class="pedal" id="leftForce">
                    <div class="pedal-icon">←</div>
                    <div class="pedal-label">LEFT</div>
                </div>
                <div class="pedal" id="rightForce">
                    <div class="pedal-icon">→</div>
                    <div class="pedal-label">RIGHT</div>
                </div>
            </div>
        `;
        this.setupPendulumControls();
        this.currentValue = 0;
        this.setpoint = 0;
        document.getElementById('setpointSlider').value = 0;
        document.getElementById('setpointValue').textContent = '0';
    }

    setupCarControls() {
        const gasPedal = document.getElementById('gasPedal');
        const brakePedal = document.getElementById('brakePedal');

        // Gas pedal events
        const gasEvents = {
            start: () => {
                this.inputStates.gas = true;
                gasPedal.classList.add('pressed');
                this.checkChallengeProgress('gas_used');
                this.addExperience(2);
            },
            end: () => {
                this.inputStates.gas = false;
                gasPedal.classList.remove('pressed');
            }
        };

        // Brake pedal events
        const brakeEvents = {
            start: () => {
                this.inputStates.brake = true;
                brakePedal.classList.add('pressed');
                this.checkChallengeProgress('brake_used');
                this.addExperience(2);
            },
            end: () => {
                this.inputStates.brake = false;
                brakePedal.classList.remove('pressed');
            }
        };

        // Mouse events
        gasPedal.addEventListener('mousedown', gasEvents.start);
        gasPedal.addEventListener('mouseup', gasEvents.end);
        gasPedal.addEventListener('mouseleave', gasEvents.end);
        
        brakePedal.addEventListener('mousedown', brakeEvents.start);
        brakePedal.addEventListener('mouseup', brakeEvents.end);
        brakePedal.addEventListener('mouseleave', brakeEvents.end);

        // Touch events
        gasPedal.addEventListener('touchstart', (e) => { e.preventDefault(); gasEvents.start(); });
        gasPedal.addEventListener('touchend', (e) => { e.preventDefault(); gasEvents.end(); });
        
        brakePedal.addEventListener('touchstart', (e) => { e.preventDefault(); brakeEvents.start(); });
        brakePedal.addEventListener('touchend', (e) => { e.preventDefault(); brakeEvents.end(); });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (this.currentExample !== 'car') return;
            if (e.key === 'ArrowUp' || e.key === ' ') {
                e.preventDefault();
                gasEvents.start();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                brakeEvents.start();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.currentExample !== 'car') return;
            if (e.key === 'ArrowUp' || e.key === ' ') {
                e.preventDefault();
                gasEvents.end();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                brakeEvents.end();
            }
        });
    }

    setupDroneControls() {
        const throttle = document.getElementById('throttleSlider');
        const joystick = document.getElementById('joystick');
        const joystickContainer = joystick.parentElement;

        throttle.addEventListener('input', (e) => {
            this.inputStates.throttle = parseFloat(e.target.value);
            document.getElementById('throttleDisplay').textContent = Math.round(this.inputStates.throttle);
            this.checkChallengeProgress('throttle_used');
            this.addExperience(1);
        });

        // Joystick controls
        let isDragging = false;
        const startDrag = (clientX, clientY) => {
            isDragging = true;
            this.checkChallengeProgress('joystick_used');
        };

        const endDrag = () => {
            isDragging = false;
            anime({
                targets: joystick,
                left: '50%',
                top: '50%',
                duration: 300,
                easing: 'easeOutBack'
            });
            this.inputStates.joystick = { x: 0, y: 0 };
        };

        const drag = (clientX, clientY) => {
            if (!isDragging) return;
            
            const rect = joystickContainer.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const maxRadius = rect.width / 2 - 25;
            
            let deltaX = clientX - centerX;
            let deltaY = clientY - centerY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > maxRadius) {
                deltaX = (deltaX / distance) * maxRadius;
                deltaY = (deltaY / distance) * maxRadius;
            }
            
            joystick.style.left = `calc(50% + ${deltaX}px)`;
            joystick.style.top = `calc(50% + ${deltaY}px)`;
            
            this.inputStates.joystick = {
                x: deltaX / maxRadius,
                y: deltaY / maxRadius
            };
        };

        // Mouse events
        joystick.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('mousemove', (e) => drag(e.clientX, e.clientY));

        // Touch events
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startDrag(touch.clientX, touch.clientY);
        });
        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            endDrag();
        });
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                drag(touch.clientX, touch.clientY);
            }
        });
    }

    setupTemperatureControls() {
        const heaterSlider = document.getElementById('heaterSlider');
        heaterSlider.addEventListener('input', (e) => {
            this.inputStates.heater = parseFloat(e.target.value);
            document.getElementById('heaterSliderDisplay').textContent = Math.round(this.inputStates.heater);
            this.checkChallengeProgress('heater_used');
            this.addExperience(1);
        });
    }

    setupPendulumControls() {
        const leftForce = document.getElementById('leftForce');
        const rightForce = document.getElementById('rightForce');

        // Force events
        const leftEvents = {
            start: () => {
                this.inputStates.force = -15;
                leftForce.classList.add('pressed');
                this.checkChallengeProgress('force_applied');
                this.addExperience(2);
            },
            end: () => {
                this.inputStates.force = 0;
                leftForce.classList.remove('pressed');
            }
        };

        const rightEvents = {
            start: () => {
                this.inputStates.force = 15;
                rightForce.classList.add('pressed');
                this.checkChallengeProgress('force_applied');
                this.addExperience(2);
            },
            end: () => {
                this.inputStates.force = 0;
                rightForce.classList.remove('pressed');
            }
        };

        // Mouse events
        leftForce.addEventListener('mousedown', leftEvents.start);
        leftForce.addEventListener('mouseup', leftEvents.end);
        leftForce.addEventListener('mouseleave', leftEvents.end);
        
        rightForce.addEventListener('mousedown', rightEvents.start);
        rightForce.addEventListener('mouseup', rightEvents.end);
        rightForce.addEventListener('mouseleave', rightEvents.end);

        // Touch events
        leftForce.addEventListener('touchstart', (e) => { e.preventDefault(); leftEvents.start(); });
        leftForce.addEventListener('touchend', (e) => { e.preventDefault(); leftEvents.end(); });
        
        rightForce.addEventListener('touchstart', (e) => { e.preventDefault(); rightEvents.start(); });
        rightForce.addEventListener('touchend', (e) => { e.preventDefault(); rightEvents.end(); });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.currentExample !== 'pendulum') return;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                leftEvents.start();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                rightEvents.start();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.currentExample !== 'pendulum') return;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                leftEvents.end();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                rightEvents.end();
            }
        });
    }

    setupChallenges() {
        // Initialize challenges panel
        this.updateChallengesDisplay();
    }

    addChallenge(challenge) {
        if (!this.activeChallenges.find(c => c.id === challenge.id)) {
            this.activeChallenges.push(challenge);
            this.updateChallengesDisplay();
            
            // Show new challenge notification
            this.showAchievement("New Challenge!", challenge.title);
        }
    }

    checkChallengeProgress(target, value = null) {
        this.activeChallenges.forEach(challenge => {
            if (challenge.target === target) {
                switch(target) {
                    case 'kp_adjusted':
                        challenge.progress = Math.min(100, challenge.progress + 20);
                        break;
                    case 'kp_target':
                        if (value && Math.abs(value - challenge.targetValue) < 0.1) {
                            challenge.progress = 100;
                        }
                        break;
                    case 'gas_used':
                    case 'brake_used':
                    case 'throttle_used':
                    case 'heater_used':
                    case 'force_applied':
                        challenge.progress = Math.min(100, challenge.progress + 10);
                        break;
                    case 'speed_stable':
                        // Check if speed is within 5% of target for extended time
                        const error = Math.abs(this.currentValue - this.setpoint) / this.setpoint * 100;
                        if (error < 5) {
                            challenge.progress = Math.min(100, challenge.progress + 2);
                        }
                        break;
                    case 'stability_90':
                        if (this.stabilityScore >= 90) {
                            challenge.progress = 100;
                        }
                        break;
                }
                
                if (challenge.progress >= 100 && !challenge.completed) {
                    this.completeChallenge(challenge);
                }
            }
        });
        
        this.updateChallengesDisplay();
    }

    completeChallenge(challenge) {
        challenge.completed = true;
        const bonusXP = Math.round(challenge.reward * this.difficultySettings.multiplier);
        this.addExperience(bonusXP);
        this.addScore(challenge.reward);
        
        this.showAchievement("Challenge Complete!", `${challenge.title} - ${bonusXP} XP earned!`);
        
        // Remove completed challenge after a delay
        setTimeout(() => {
            this.activeChallenges = this.activeChallenges.filter(c => c.id !== challenge.id);
            this.updateChallengesDisplay();
        }, 3000);
        
        // Add new challenges as player progresses
        this.addProgressiveChallenges();
    }

    addProgressiveChallenges() {
        const completedCount = this.achievements.length;
        
        if (completedCount >= 3 && !this.activeChallenges.find(c => c.id === 'multi_system')) {
            this.addChallenge({
                id: 'multi_system',
                title: 'System Explorer',
                description: 'Try all 4 control systems',
                target: 'systems_explored',
                reward: 400,
                progress: 0
            });
        }
        
        if (completedCount >= 5 && !this.activeChallenges.find(c => c.id === 'pid_master')) {
            this.addChallenge({
                id: 'pid_master',
                title: 'PID Master',
                description: 'Achieve Grade A performance',
                target: 'grade_a',
                reward: 500,
                progress: 0
            });
        }
    }

    updateChallengesDisplay() {
        const container = document.getElementById('challengeList');
        if (this.activeChallenges.length === 0) {
            container.innerHTML = '<div style="text-align: center; opacity: 0.7;">No active challenges</div>';
            return;
        }
        
        container.innerHTML = this.activeChallenges.map(challenge => `
            <div class="challenge-item ${challenge.completed ? 'completed' : ''}">
                <div class="challenge-title">${challenge.title}</div>
                <div class="challenge-description">${challenge.description}</div>
                <div class="challenge-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${challenge.progress}%"></div>
                    </div>
                    <div class="challenge-reward">+${challenge.reward} XP</div>
                </div>
            </div>
        `).join('');
    }

    setupHints() {
        const hintBubble = document.getElementById('hintBubble');
        const hintClose = document.getElementById('hintClose');
        
        hintClose.addEventListener('click', () => {
            hintBubble.parentElement.style.display = 'none';
        });
        
        // Auto-hide hint after 10 seconds
        setTimeout(() => {
            if (hintBubble.parentElement.style.display !== 'none') {
                hintBubble.parentElement.style.display = 'none';
            }
        }, 10000);
    }

    startHintTimer() {
        // Show new hints every 30 seconds
        this.hintTimer = setInterval(() => {
            this.showNextHint();
        }, 30000);
    }

    showNextHint() {
        const hintElement = document.getElementById('hintText');
        const hintBubble = document.getElementById('hintBubble');
        
        if (!hintElement || !hintBubble) return;
        
        // Don't show hints if bubble is already visible
        if (hintBubble.parentElement.style.display !== 'none') return;
        
        hintElement.textContent = this.hints[this.currentHintIndex];
        hintBubble.parentElement.style.display = 'block';
        
        // Animate hint appearance
        anime({
            targets: hintBubble,
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 500,
            easing: 'easeOutBack'
        });
        
        this.currentHintIndex = (this.currentHintIndex + 1) % this.hints.length;
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            anime({
                targets: hintBubble,
                opacity: [1, 0],
                duration: 300,
                complete: () => {
                    hintBubble.parentElement.style.display = 'none';
                }
            });
        }, 8000);
    }

    animate() {
        if (this.isPaused) {
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }

        const pidResult = this.pid.update(this.setpoint, this.currentValue);
        
        // Calculate manual input based on current example
        this.calculateManualInput();
        
        // Apply system dynamics based on current example
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

        // Update PID term displays
        document.getElementById('pTerm').textContent = pidResult.pTerm.toFixed(2);
        document.getElementById('iTerm').textContent = pidResult.iTerm.toFixed(2);
        document.getElementById('dTerm').textContent = pidResult.dTerm.toFixed(2);

        // Update performance metrics
        this.updatePerformanceMetrics(pidResult);
        
        // Update chart data
        this.updateChart(pidResult);

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    calculateManualInput() {
        switch (this.currentExample) {
            case 'car':
                this.manualInput = 0;
                if (this.inputStates.gas) this.manualInput += 60;
                if (this.inputStates.brake) this.manualInput -= 40;
                break;
            case 'drone':
                this.manualInput = (this.inputStates.throttle - 50) * 1.5;
                break;
            case 'temperature':
                this.manualInput = this.inputStates.heater * 0.8;
                break;
            case 'pendulum':
                this.manualInput = this.inputStates.force;
                break;
        }
    }

    updateCarSystem(pidResult) {
        // Add difficulty-based noise and disturbances
        const noise = (Math.random() - 0.5) * this.difficultySettings.noise;
        const disturbance = Math.sin(Date.now() * 0.001) * this.difficultySettings.disturbance;
        
        // Combine PID output with manual input
        const totalInput = pidResult.output + this.manualInput + disturbance;
        const acceleration = totalInput * 0.08;
        const drag = this.currentValue * 0.025;
        
        this.currentValue += (acceleration - drag + noise) * 0.1;
        this.currentValue = Math.max(0, Math.min(150, this.currentValue));

        // Update car visual
        const car = document.getElementById('car');
        if (car) {
            const speed = this.currentValue / 150;
            const wobble = Math.sin(Date.now() * 0.02) * speed * 8;
            car.style.transform = `scaleX(${1 + speed * 0.2}) translateX(${wobble}px)`;
            
            // Update displays
            const roundedSpeed = Math.round(this.currentValue);
            document.getElementById('speedDisplay').textContent = roundedSpeed;
            document.getElementById('speedDisplayBig').textContent = roundedSpeed;
            document.getElementById('targetSpeedDisplay').textContent = Math.round(this.setpoint);
            document.getElementById('gasInput').textContent = this.inputStates.gas ? '100' : '0';
            document.getElementById('brakeInput').textContent = this.inputStates.brake ? '100' : '0';
            document.getElementById('pidOutput').textContent = Math.round(Math.max(0, pidResult.output));
        }
    }

    updateDroneSystem(pidResult) {
        // Add difficulty-based noise and disturbances
        const noise = (Math.random() - 0.5) * this.difficultySettings.noise;
        const windDisturbance = Math.sin(Date.now() * 0.002) * this.difficultySettings.disturbance;
        
        // Combine PID output with manual input
        const totalThrust = pidResult.output + this.manualInput + windDisturbance;
        const thrust = totalThrust * 0.03;
        const gravity = -9.8 * 0.008;
        
        this.currentValue += (thrust + gravity + noise) * 0.1;
        this.currentValue = Math.max(0, Math.min(100, this.currentValue));

        // Update drone visual
        const drone = document.getElementById('drone');
        if (drone) {
            const altitude = (100 - this.currentValue) / 100;
            const hover = Math.sin(Date.now() * 0.008) * 3;
            const sway = Math.sin(Date.now() * 0.005) * 15;
            
            drone.style.top = `${altitude * 350 + 50 + hover}px`;
            drone.style.left = `${280 + sway}px`;
            
            // Tilt based on movement
            const tilt = sway * 0.3;
            drone.style.transform = `rotate(${tilt}deg)`;
            
            // Update displays
            document.getElementById('altitudeDisplay').textContent = Math.round(this.currentValue);
            document.getElementById('targetAltDisplay').textContent = Math.round(this.setpoint);
            document.getElementById('throttleInput').textContent = Math.round(this.inputStates.throttle);
            document.getElementById('pidThrust').textContent = Math.round(Math.max(0, pidResult.output));
            document.getElementById('totalPower').textContent = Math.round(Math.max(0, totalThrust + 50));
        }
    }

    updateTemperatureSystem(pidResult) {
        // Add difficulty-based noise and disturbances
        const noise = (Math.random() - 0.5) * this.difficultySettings.noise;
        const ambientVariation = Math.sin(Date.now() * 0.0005) * this.difficultySettings.disturbance;
        
        // Combine PID output with manual input
        const totalHeating = Math.max(0, pidResult.output + this.manualInput);
        const heating = totalHeating * 0.015;
        const cooling = (this.currentValue - (20 + ambientVariation)) * 0.012;
        
        this.currentValue += (heating - cooling + noise) * 0.1;
        this.currentValue = Math.max(0, Math.min(100, this.currentValue));

        // Update thermometer visual
        const mercury = document.getElementById('mercury');
        if (mercury) {
            const height = Math.min(100, Math.max(0, this.currentValue));
            mercury.style.height = `${height}%`;
            
            // Color based on temperature
            const hue = Math.max(0, Math.min(360, height * 3.6));
            mercury.style.background = `linear-gradient(to top, hsl(${240 - hue * 0.7}, 70%, 50%), hsl(${360 - hue * 0.5}, 80%, 60%))`;
            
            // Update displays
            document.getElementById('tempDisplay').textContent = Math.round(this.currentValue);
            document.getElementById('tempTargetDisplay').textContent = Math.round(this.setpoint);
            document.getElementById('manualHeaterDisplay').textContent = Math.round(this.inputStates.heater);
            document.getElementById('pidHeaterDisplay').textContent = Math.round(Math.max(0, pidResult.output));
            document.getElementById('totalHeatDisplay').textContent = Math.round(totalHeating);
        }
    }

    updatePendulumSystem(pidResult) {
        // Add difficulty-based noise and disturbances
        const noise = (Math.random() - 0.5) * this.difficultySettings.noise;
        const externalForce = Math.sin(Date.now() * 0.003) * this.difficultySettings.disturbance;
        
        // Combine PID output with manual input
        const totalForce = pidResult.output + this.manualInput + externalForce;
        const force = totalForce * 0.08;
        const gravity = Math.sin(this.currentValue * Math.PI / 180) * 3;
        const damping = this.currentValue * 0.08;
        
        this.currentValue += (force - gravity - damping + noise) * 0.1;
        this.currentValue = Math.max(-75, Math.min(75, this.currentValue));

        // Update pendulum visual
        const rod = document.getElementById('pendulumRod');
        const base = document.getElementById('pendulumBase');
        if (rod && base) {
            rod.style.transform = `rotate(${this.currentValue}deg)`;
            
            // Move base slightly based on force
            const baseOffset = totalForce * 0.5;
            base.style.transform = `translateX(calc(-50% + ${baseOffset}px))`;
            
            // Update displays
            document.getElementById('angleDisplay').textContent = Math.round(this.currentValue);
            document.getElementById('angleTargetDisplay').textContent = Math.round(this.setpoint);
            document.getElementById('manualForceDisplay').textContent = Math.round(this.inputStates.force);
            document.getElementById('pidForceDisplay').textContent = Math.round(pidResult.output);
            document.getElementById('totalForceDisplay').textContent = Math.round(totalForce);
        }
    }

    updatePerformanceMetrics(pidResult) {
        const error = Math.abs(pidResult.error);
        const setpointRange = Math.abs(this.setpoint) || 1;
        
        // Calculate performance scores
        const errorPercent = (error / setpointRange) * 100;
        
        // Stability (low error and low oscillation)
        const stabilityScore = Math.max(0, 100 - errorPercent * 2);
        
        // Speed (how quickly it reaches setpoint)
        const responseTime = (Date.now() - this.sessionStartTime) / 1000;
        const speedScore = Math.max(0, 100 - Math.min(responseTime * 2, 50));
        
        // Accuracy (how close to setpoint)
        const accuracyScore = Math.max(0, 100 - errorPercent);
        
        // Smooth the scores
        this.stabilityScore = this.stabilityScore * 0.9 + stabilityScore * 0.1;
        this.speedScore = this.speedScore * 0.9 + speedScore * 0.1;
        this.accuracyScore = this.accuracyScore * 0.9 + accuracyScore * 0.1;
        
        // Update UI
        this.updateMetricBar('stability', this.stabilityScore);
        this.updateMetricBar('speed', this.speedScore);
        this.updateMetricBar('accuracy', this.accuracyScore);
        
        // Calculate overall grade
        const overallScore = (this.stabilityScore + this.speedScore + this.accuracyScore) / 3;
        const grade = this.getGrade(overallScore);
        
        const gradeElement = document.getElementById('overallGrade');
        if (gradeElement) {
            gradeElement.textContent = grade;
            gradeElement.className = `score-grade ${grade}`;
        }
        
        // Check for grade achievements
        if (grade === 'A' && !this.achievements.includes('grade_a')) {
            this.checkChallengeProgress('grade_a');
            this.achievements.push('grade_a');
        }
        
        // Add small XP for good performance
        if (overallScore > 80) {
            this.addExperience(1);
        }
    }

    updateMetricBar(metric, score) {
        const fill = document.getElementById(`${metric}Fill`);
        const value = document.getElementById(`${metric}Value`);
        
        if (fill && value) {
            fill.style.width = `${score}%`;
            fill.className = `metric-fill ${metric}`;
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

    updateSystemInfo() {
        const infos = {
            car: {
                title: "🚗 Car Cruise Control",
                description: "Use gas and brake pedals to test your cruise control system!"
            },
            drone: {
                title: "🚁 Drone Altitude Control",
                description: "Control the drone's altitude with the throttle slider!"
            },
            temperature: {
                title: "🌡️ Temperature Control System",
                description: "Adjust the manual heater and watch PID maintain temperature!"
            },
            pendulum: {
                title: "⚖️ Inverted Pendulum",
                description: "Use force buttons or arrow keys to disturb the pendulum!"
            }
        };

        const info = infos[this.currentExample];
        document.getElementById('systemTitle').textContent = info.title;
        document.getElementById('systemDescription').textContent = info.description;
    }

    updateChart(pidResult) {
        const currentTime = Date.now();
        
        this.chartData.time.push(currentTime);
        this.chartData.setpoint.push(this.setpoint);
        this.chartData.actual.push(this.currentValue);
        this.chartData.output.push(pidResult.output);
        this.chartData.manual.push(this.manualInput);

        // Keep only recent data points
        if (this.chartData.time.length > this.maxDataPoints) {
            this.chartData.time.shift();
            this.chartData.setpoint.shift();
            this.chartData.actual.shift();
            this.chartData.output.shift();
            this.chartData.manual.shift();
        }

        // Update chart
        this.chart.data.labels = this.chartData.time.map((_, i) => i);
        this.chart.data.datasets[0].data = this.chartData.setpoint;
        this.chart.data.datasets[1].data = this.chartData.actual;
        this.chart.data.datasets[2].data = this.chartData.output;
        this.chart.data.datasets[3].data = this.chartData.manual;
        this.chart.update('none');
    }

    // Game state management
    addExperience(amount) {
        const bonusXP = Math.round(amount * this.difficultySettings.multiplier);
        this.experience += bonusXP;
        
        // Check for level up
        const newLevel = Math.floor(this.experience / 100) + 1;
        if (newLevel > this.playerLevel) {
            this.playerLevel = newLevel;
            this.showAchievement("Level Up!", `Welcome to Level ${this.playerLevel}!`);
            this.addScore(this.playerLevel * 50);
        }
        
        this.updateGameHUD();
    }

    addScore(points) {
        this.score += points;
        this.updateGameHUD();
        
        // Animate score increase
        anime({
            targets: '#scoreValue',
            scale: [1, 1.3, 1],
            duration: 500,
            easing: 'easeOutBack'
        });
    }

    updateGameHUD() {
        // Update level
        document.getElementById('playerLevel').textContent = this.playerLevel;
        
        // Update experience bar
        const xpInLevel = this.experience % 100;
        const xpFill = document.getElementById('xpFill');
        const xpText = document.getElementById('xpText');
        
        if (xpFill && xpText) {
            xpFill.style.width = `${xpInLevel}%`;
            xpText.textContent = `${xpInLevel}/100 XP`;
        }
        
        // Update score
        document.getElementById('scoreValue').textContent = this.score.toLocaleString();
    }

    updateMission(title, description, progress) {
        document.getElementById('missionTitle').textContent = title;
        document.getElementById('missionDescription').textContent = description;
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill && progressText) {
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
        }
    }

    showAchievement(title, description = '') {
        const popup = document.getElementById('achievementPopup');
        const titleEl = popup.querySelector('.achievement-title');
        const descEl = popup.querySelector('.achievement-desc');
        
        titleEl.textContent = title;
        descEl.textContent = description;
        
        popup.classList.add('show');
        
        // Hide after 4 seconds
        setTimeout(() => {
            popup.classList.remove('show');
        }, 4000);
        
        // Play sound effect (if available)
        this.playSound('achievement');
    }

    playSound(type) {
        // Placeholder for sound effects
        // Could be implemented with Web Audio API or audio elements
        console.log(`Playing ${type} sound`);
    }

    // Chart controls
    togglePause() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('pauseBtn');
        btn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
        
        if (this.isPaused) {
            this.showAchievement("Paused", "Simulation paused for analysis");
        }
    }

    resetSimulation() {
        this.pid.reset();
        this.chartData = { time: [], setpoint: [], actual: [], output: [], manual: [] };
        this.currentValue = this.currentExample === 'temperature' ? 20 : 
                           this.currentExample === 'pendulum' ? 0 : 
                           this.currentExample === 'drone' ? 50 : 30;
        this.resetPerformanceMetrics();
        this.showAchievement("Reset", "Simulation reset to initial state");
        this.addExperience(5);
    }

        saveConfiguration() {
        const config = {
            kp: parseFloat(document.getElementById('kpSlider').value),
            ki: parseFloat(document.getElementById('kiSlider').value),
            kd: parseFloat(document.getElementById('kdSlider').value),
            setpoint: parseFloat(document.getElementById('setpointSlider').value),
            difficulty: this.difficulty,
            system: this.currentExample,
            timestamp: new Date().toISOString(),
            performance: {
                stability: this.stabilityScore,
                speed: this.speedScore,
                accuracy: this.accuracyScore,
                grade: this.getGrade((this.stabilityScore + this.speedScore + this.accuracyScore) / 3)
            }
        };
        
        // Save to localStorage
        const savedConfigs = JSON.parse(localStorage.getItem('pidConfigs') || '[]');
        savedConfigs.push(config);
        localStorage.setItem('pidConfigs', JSON.stringify(savedConfigs));
        
        this.showAchievement("Configuration Saved!", `${this.currentExample} settings saved successfully`);
        this.addExperience(10);
        
        // Download as JSON file
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

    loadSavedConfigurations() {
        const savedConfigs = JSON.parse(localStorage.getItem('pidConfigs') || '[]');
        return savedConfigs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
        if (this.hintTimer) {
            clearInterval(this.hintTimer);
        }
    }

    // Advanced game features
    createSpecialEffects() {
        // Particle system for achievements
        const createParticles = (x, y, color = '#FFD700') => {
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: fixed;
                    width: 6px;
                    height: 6px;
                    background: ${color};
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9999;
                    left: ${x}px;
                    top: ${y}px;
                `;
                document.body.appendChild(particle);
                
                anime({
                    targets: particle,
                    translateX: () => anime.random(-100, 100),
                    translateY: () => anime.random(-100, 100),
                    scale: [1, 0],
                    opacity: [1, 0],
                    duration: 1000,
                    easing: 'easeOutQuad',
                    complete: () => particle.remove()
                });
            }
        };
        
        return createParticles;
    }

    initializeAdvancedFeatures() {
        this.createParticles = this.createSpecialEffects();
        
        // Easter eggs and hidden features
        this.setupEasterEggs();
        
        // Advanced analytics
        this.initializeAnalytics();
        
        // Social features
        this.initializeSharing();
    }

    setupEasterEggs() {
        // Konami code easter egg
        let konamiCode = [];
        const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
        
        document.addEventListener('keydown', (e) => {
            konamiCode.push(e.code);
            if (konamiCode.length > sequence.length) {
                konamiCode.shift();
            }
            
            if (konamiCode.length === sequence.length && 
                konamiCode.every((key, i) => key === sequence[i])) {
                this.activateKonamiMode();
                konamiCode = [];
            }
        });
        
        // Secret double-click on logo
        let clickCount = 0;
        const resetClickCount = () => { clickCount = 0; };
        
        document.addEventListener('click', (e) => {
            if (e.target.closest('.player-avatar')) {
                clickCount++;
                setTimeout(resetClickCount, 1000);
                
                if (clickCount === 5) {
                    this.activateSecretMode();
                    clickCount = 0;
                }
            }
        });
    }

    activateKonamiMode() {
        this.showAchievement("🎮 KONAMI CODE ACTIVATED!", "Unlimited XP mode enabled!");
        this.konamiMode = true;
        
        // Visual effects
        document.body.style.filter = 'hue-rotate(45deg) saturate(1.5)';
        
        // Particle explosion
        this.createParticles(window.innerWidth / 2, window.innerHeight / 2, '#ff00ff');
        
        setTimeout(() => {
            document.body.style.filter = '';
            this.konamiMode = false;
        }, 30000);
    }

    activateSecretMode() {
        this.showAchievement("🔓 SECRET MODE!", "Developer tools unlocked!");
        this.addDeveloperPanel();
    }

    addDeveloperPanel() {
        const devPanel = document.createElement('div');
        devPanel.innerHTML = `
            <div style="position: fixed; top: 100px; right: 20px; background: rgba(0,0,0,0.9); 
                        color: #00ff00; padding: 20px; border-radius: 10px; font-family: monospace; 
                        z-index: 1000; max-width: 300px; border: 2px solid #00ff00;">
                <h3 style="margin-bottom: 15px;">🛠️ Developer Panel</h3>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="float: right; background: #ff0000; border: none; color: white; 
                               padding: 5px 10px; border-radius: 5px; cursor: pointer;">×</button>
                <div style="margin-bottom: 10px;">
                    <label>Instant XP:</label>
                    <input type="number" id="devXP" value="100" style="width: 60px; margin-left: 10px;">
                    <button onclick="window.gameInstance.addExperience(parseInt(document.getElementById('devXP').value))"
                            style="margin-left: 5px; padding: 3px 8px; cursor: pointer;">Add</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <label>Teleport to Level:</label>
                    <input type="number" id="devLevel" value="5" style="width: 60px; margin-left: 10px;">
                    <button onclick="window.gameInstance.setLevel(parseInt(document.getElementById('devLevel').value))"
                            style="margin-left: 5px; padding: 3px 8px; cursor: pointer;">Set</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <button onclick="window.gameInstance.unlockAllAchievements()"
                            style="padding: 5px 10px; cursor: pointer; width: 100%;">Unlock All Achievements</button>
                </div>
                <div style="margin-bottom: 10px;">
                    <button onclick="window.gameInstance.perfectPID()"
                            style="padding: 5px 10px; cursor: pointer; width: 100%;">Perfect PID Settings</button>
                </div>
                <div style="font-size: 10px; opacity: 0.7; margin-top: 15px;">
                    Build: v2.0.1<br>
                    User: al-chris<br>
                    Date: 2025-06-03 21:34:59
                </div>
            </div>
        `;
        document.body.appendChild(devPanel);
        
        // Store reference for dev functions
        window.gameInstance = this;
    }

    setLevel(targetLevel) {
        this.playerLevel = targetLevel;
        this.experience = (targetLevel - 1) * 100;
        this.updateGameHUD();
        this.showAchievement("Level Override", `Teleported to Level ${targetLevel}!`);
    }

    unlockAllAchievements() {
        const allAchievements = [
            "First Steps", "Speed Demon", "Steady Hand", "System Master", 
            "Perfect Control", "Disturbance Handler", "Quick Learner", "PID Expert"
        ];
        
        allAchievements.forEach((achievement, index) => {
            setTimeout(() => {
                this.showAchievement("🏆 Achievement Unlocked!", achievement);
                this.addExperience(100);
            }, index * 500);
        });
    }

    perfectPID() {
        const perfectSettings = {
            car: { kp: 1.2, ki: 0.15, kd: 0.08 },
            drone: { kp: 2.0, ki: 0.25, kd: 0.12 },
            temperature: { kp: 0.8, ki: 0.1, kd: 0.05 },
            pendulum: { kp: 3.5, ki: 0.05, kd: 0.4 }
        };
        
        const settings = perfectSettings[this.currentExample];
        if (settings) {
            document.getElementById('kpSlider').value = settings.kp;
            document.getElementById('kiSlider').value = settings.ki;
            document.getElementById('kdSlider').value = settings.kd;
            
            // Trigger change events
            document.getElementById('kpSlider').dispatchEvent(new Event('input'));
            document.getElementById('kiSlider').dispatchEvent(new Event('input'));
            document.getElementById('kdSlider').dispatchEvent(new Event('input'));
            
            this.showAchievement("Perfect Settings Applied!", "Optimal PID parameters set!");
        }
    }

    initializeAnalytics() {
        this.analytics = {
            sessionStart: Date.now(),
            interactions: 0,
            systemSwitches: 0,
            totalTime: 0,
            bestGrade: 'F',
            parametersAdjusted: 0
        };
        
        // Track interactions
        document.addEventListener('click', () => {
            this.analytics.interactions++;
        });
        
        // Auto-save analytics every minute
        setInterval(() => {
            this.saveAnalytics();
        }, 60000);
    }

    saveAnalytics() {
        this.analytics.totalTime = Date.now() - this.analytics.sessionStart;
        const grade = this.getGrade((this.stabilityScore + this.speedScore + this.accuracyScore) / 3);
        
        if (grade > this.analytics.bestGrade) {
            this.analytics.bestGrade = grade;
        }
        
        localStorage.setItem('pidAnalytics', JSON.stringify(this.analytics));
    }

    initializeSharing() {
        // Add sharing buttons (placeholder for social features)
        this.createSharingInterface();
    }

    createSharingInterface() {
        const shareButton = document.createElement('button');
        shareButton.innerHTML = '📤 Share Results';
        shareButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: linear-gradient(145deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        
        shareButton.addEventListener('click', () => this.shareResults());
        shareButton.addEventListener('mouseenter', () => {
            shareButton.style.transform = 'translateY(-3px)';
            shareButton.style.boxShadow = '0 8px 16px rgba(0,0,0,0.4)';
        });
        shareButton.addEventListener('mouseleave', () => {
            shareButton.style.transform = 'translateY(0)';
            shareButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        });
        
        document.body.appendChild(shareButton);
    }

    shareResults() {
        const overallScore = (this.stabilityScore + this.speedScore + this.accuracyScore) / 3;
        const grade = this.getGrade(overallScore);
        
        const shareText = `🎓 Just mastered PID Control at PID Academy!
        
🏆 Level: ${this.playerLevel}
📊 Grade: ${grade} (${Math.round(overallScore)}%)
🎯 System: ${this.currentExample.toUpperCase()}
⚙️ Settings: Kp=${this.pid.kp}, Ki=${this.pid.ki}, Kd=${this.pid.kd}
💯 Score: ${this.score.toLocaleString()}

Think you can do better? Try PID Academy!
#PIDControl #Engineering #GameBasedLearning`;

        if (navigator.share) {
            navigator.share({
                title: 'PID Academy Results',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                this.showAchievement("Copied to Clipboard!", "Share your results on social media!");
            });
        }
        
        this.addExperience(25);
    }

    // Leaderboard system (placeholder for future server integration)
    initializeLeaderboard() {
        this.leaderboard = JSON.parse(localStorage.getItem('pidLeaderboard') || '[]');
    }

    submitScore() {
        const overallScore = (this.stabilityScore + this.speedScore + this.accuracyScore) / 3;
        const entry = {
            player: 'al-chris',
            level: this.playerLevel,
            score: this.score,
            grade: this.getGrade(overallScore),
            system: this.currentExample,
            difficulty: this.difficulty,
            timestamp: new Date().toISOString(),
            settings: {
                kp: this.pid.kp,
                ki: this.pid.ki,
                kd: this.pid.kd
            }
        };
        
        this.leaderboard.push(entry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 100); // Keep top 100
        
        localStorage.setItem('pidLeaderboard', JSON.stringify(this.leaderboard));
        
        const rank = this.leaderboard.findIndex(e => e.timestamp === entry.timestamp) + 1;
        this.showAchievement("Score Submitted!", `You ranked #${rank} on the leaderboard!`);
    }

    // Auto-save game state
    saveGameState() {
        const gameState = {
            playerLevel: this.playerLevel,
            experience: this.experience,
            score: this.score,
            achievements: this.achievements,
            difficulty: this.difficulty,
            currentExample: this.currentExample,
            completedChallenges: this.activeChallenges.filter(c => c.completed).map(c => c.id),
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
            this.achievements = state.achievements || [];
            this.difficulty = state.difficulty || 'easy';
            
            // Show welcome back message
            const daysSinceLastPlay = Math.floor((Date.now() - new Date(state.lastPlayed)) / (1000 * 60 * 60 * 24));
            if (daysSinceLastPlay > 0) {
                setTimeout(() => {
                    this.showAchievement("Welcome Back!", `You've been away for ${daysSinceLastPlay} day(s). Ready to continue learning?`);
                }, 2000);
            }
        }
    }

    // Tutorial system enhancements
    createInteractiveTutorial() {
        const tutorialSteps = [
            {
                target: '#kpSlider',
                title: 'Proportional Control',
                content: 'This controls how strongly the system responds to errors. Try moving it!',
                action: () => this.highlightElement('#kpSlider')
            },
            {
                target: '#kiSlider',
                title: 'Integral Control',
                content: 'This eliminates steady-state errors over time. Small values work best!',
                action: () => this.highlightElement('#kiSlider')
            },
            {
                target: '#kdSlider',
                title: 'Derivative Control',
                content: 'This reduces overshoot and oscillations. Handle with care!',
                action: () => this.highlightElement('#kdSlider')
            },
            {
                target: '.interactive-controls',
                title: 'Manual Controls',
                content: 'Use these to disturb the system and test your PID controller!',
                action: () => this.highlightElement('.interactive-controls')
            }
        ];
        
        this.currentTutorialStep = 0;
        this.tutorialSteps = tutorialSteps;
        
        if (this.gameMode === 'tutorial') {
            this.startInteractiveTutorial();
        }
    }

    startInteractiveTutorial() {
        if (this.currentTutorialStep < this.tutorialSteps.length) {
            const step = this.tutorialSteps[this.currentTutorialStep];
            this.showTutorialStep(step);
        }
    }

    showTutorialStep(step) {
        // Create tutorial overlay
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        overlay.innerHTML = `
            <div class="tutorial-backdrop"></div>
            <div class="tutorial-popup">
                <h3>${step.title}</h3>
                <p>${step.content}</p>
                <div class="tutorial-controls">
                    <button onclick="window.gameInstance.previousTutorialStep()">Previous</button>
                    <button onclick="window.gameInstance.nextTutorialStep()">Next</button>
                    <button onclick="window.gameInstance.skipTutorial()">Skip</button>
                </div>
            </div>
        `;
        
        // Add CSS for tutorial
        const style = document.createElement('style');
        style.textContent = `
            .tutorial-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                pointer-events: none;
            }
            .tutorial-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                pointer-events: all;
            }
            .tutorial-popup {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(145deg, #2c3e50, #34495e);
                color: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 400px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                pointer-events: all;
            }
            .tutorial-controls {
                display: flex;
                gap: 10px;
                margin-top: 20px;
                justify-content: space-between;
            }
            .tutorial-controls button {
                padding: 8px 16px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                background: #3498db;
                color: white;
                transition: background 0.3s;
            }
            .tutorial-controls button:hover {
                background: #2980b9;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(overlay);
        
        // Highlight target element
        if (step.action) {
            step.action();
        }
        
        // Store references for cleanup
        this.currentTutorialOverlay = overlay;
        this.currentTutorialStyle = style;
    }

    nextTutorialStep() {
        this.cleanupTutorial();
        this.currentTutorialStep++;
        
        if (this.currentTutorialStep < this.tutorialSteps.length) {
            setTimeout(() => this.startInteractiveTutorial(), 500);
        } else {
            this.completeTutorial();
        }
    }

    previousTutorialStep() {
        this.cleanupTutorial();
        this.currentTutorialStep = Math.max(0, this.currentTutorialStep - 1);
        setTimeout(() => this.startInteractiveTutorial(), 500);
    }

    skipTutorial() {
        this.cleanupTutorial();
        this.completeTutorial();
    }

    completeTutorial() {
        this.showAchievement("Tutorial Complete!", "You're ready to master PID control!");
        this.addExperience(200);
        this.gameMode = 'sandbox';
    }

    cleanupTutorial() {
        if (this.currentTutorialOverlay) {
            this.currentTutorialOverlay.remove();
        }
        if (this.currentTutorialStyle) {
            this.currentTutorialStyle.remove();
        }
        
        // Remove highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    }

    highlightElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('tutorial-highlight');
            
            // Add highlight CSS if not already added
            if (!document.querySelector('#tutorial-highlight-style')) {
                const style = document.createElement('style');
                style.id = 'tutorial-highlight-style';
                style.textContent = `
                    .tutorial-highlight {
                        position: relative;
                        z-index: 10001;
                        box-shadow: 0 0 0 4px #FFD700, 0 0 20px rgba(255, 215, 0, 0.5) !important;
                        border-radius: 8px;
                        animation: tutorialPulse 2s infinite;
                    }
                    @keyframes tutorialPulse {
                        0%, 100% { box-shadow: 0 0 0 4px #FFD700, 0 0 20px rgba(255, 215, 0, 0.5); }
                        50% { box-shadow: 0 0 0 8px #FFD700, 0 0 30px rgba(255, 215, 0, 0.8); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }

    // Initialize all features
    initializeAllFeatures() {
        this.initializeAdvancedFeatures();
        this.initializeLeaderboard();
        this.loadGameState();
        this.createInteractiveTutorial();
        
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveGameState();
        }, 30000);
        
        // Submit score when achieving high performance
        setInterval(() => {
            const overallScore = (this.stabilityScore + this.speedScore + this.accuracyScore) / 3;
            if (overallScore > 85 && !this.scoreSubmitted) {
                this.submitScore();
                this.scoreSubmitted = true;
                setTimeout(() => { this.scoreSubmitted = false; }, 60000); // Reset after 1 minute
            }
        }, 5000);
        
        console.log('🎮 PID Academy fully initialized!');
        console.log('👤 Welcome al-chris!');
        console.log('📅 Session started: 2025-06-03 21:34:59 UTC');
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    const game = new GamePIDDemo();
    game.initializeAllFeatures();
    
    // Add some entrance animations
    anime({
        targets: '.container',
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 1000,
        easing: 'easeOutQuad'
    });
    
    anime({
        targets: '.example-btn',
        scale: [0.8, 1],
        opacity: [0, 1],
        delay: anime.stagger(100, {start: 500}),
        duration: 600,
        easing: 'easeOutElastic(1, .8)'
    });
    
    anime({
        targets: '.floating-hints',
        translateX: [300, 0],
        opacity: [0, 1],
        delay: 2000,
        duration: 800,
        easing: 'easeOutBack'
    });
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.gameInstance) {
        window.gameInstance.saveGameState();
        window.gameInstance.saveAnalytics();
        window.gameInstance.stopAnimation();
    }
});

// Handle visibility changes (when user switches tabs)
document.addEventListener('visibilitychange', () => {
    if (window.gameInstance) {
        if (document.hidden) {
            window.gameInstance.isPaused = true;
        } else {
            window.gameInstance.isPaused = false;
            window.gameInstance.showAchievement("Welcome Back!", "Ready to continue learning?");
        }
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!window.gameInstance) return;
    
    // Global shortcuts (Ctrl/Cmd + key)
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                window.gameInstance.saveConfiguration();
                break;
            case 'r':
                e.preventDefault();
                window.gameInstance.resetSimulation();
                break;
            case 'p':
                e.preventDefault();
                window.gameInstance.togglePause();
                break;
        }
    }
    
    // Number keys to switch systems
    if (e.key >= '1' && e.key <= '4') {
        const systems = ['car', 'drone', 'temperature', 'pendulum'];
        const index = parseInt(e.key) - 1;
        if (systems[index]) {
            const btn = document.querySelector(`[data-example="${systems[index]}"]`);
            if (btn) btn.click();
        }
    }
});

// Add touch gestures for mobile
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchmove', (e) => {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;
    
    // Horizontal swipe to change systems
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        const systems = ['car', 'drone', 'temperature', 'pendulum'];
        const currentIndex = systems.indexOf(window.gameInstance?.currentExample || 'car');
        
        let newIndex;
        if (deltaX > 0) { // Swipe left
            newIndex = (currentIndex + 1) % systems.length;
        } else { // Swipe right
            newIndex = (currentIndex - 1 + systems.length) % systems.length;
        }
        
        const btn = document.querySelector(`[data-example="${systems[newIndex]}"]`);
        if (btn) btn.click();
        
        touchStartX = 0;
        touchStartY = 0;
    }
});

// Add resize handler for responsive layout
window.addEventListener('resize', () => {
    if (window.gameInstance && window.gameInstance.chart) {
        window.gameInstance.chart.resize();
    }
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log(`⚡ Page load time: ${Math.round(perfData.loadEventEnd - perfData.loadEventStart)}ms`);
            
            if (window.gameInstance) {
                window.gameInstance.analytics.loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            }
        }, 0);
    });
}

// Error handling
window.addEventListener('error', (e) => {
    console.error('🚨 Game Error:', e.error);
    
    // Try to show user-friendly error message
    if (window.gameInstance) {
        window.gameInstance.showAchievement("Oops!", "Something went wrong, but we're still learning!");
    }
});

// Console welcome message
console.log(`
🎓 Welcome to PID Academy!
==========================================
👤 Player: al-chris
🕒 Session: 2025-06-03 21:34:59 UTC
🎮 Version: 2.0.1
==========================================

Keyboard Shortcuts:
- Ctrl+S: Save configuration
- Ctrl+R: Reset simulation  
- Ctrl+P: Pause/Resume
- 1-4: Switch systems
- Arrow keys: Control pendulum
- Space/Up: Gas pedal (car)
- Down: Brake pedal (car)

Easter Eggs:
- Konami Code: ↑↑↓↓←→←→BA
- Click avatar 5 times for dev mode

Have fun learning PID control! 🚀
`);