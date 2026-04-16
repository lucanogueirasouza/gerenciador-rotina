document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const screenSplash = document.getElementById('screen-splash');
    const screenSelection = document.getElementById('screen-selection');
    const screenRoutine = document.getElementById('screen-routine');
    
    const startDayBtn = document.getElementById('start-day-btn');
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const recalculateBtn = document.getElementById('recalculate-btn');
    
    const activitySelectors = document.getElementById('activity-selectors');
    const gymLevel = document.getElementById('gym-level');
    const customTaskName = document.getElementById('custom-task-name');
    const customTaskDuration = document.getElementById('custom-task-duration');
    const addCustomBtn = document.getElementById('add-custom-btn');
    const customTaskList = document.getElementById('custom-task-list');

    const routineChecklist = document.getElementById('routine-checklist');
    const routineStatus = document.getElementById('routine-status');
    const gymSection = document.getElementById('gym-training');
    const trainingContent = document.getElementById('training-content');

    const waterProgressText = document.getElementById('water-progress-text');
    const waterFill = document.getElementById('water-fill');
    const waterGoalInput = document.getElementById('water-goal-input');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const resetWaterBtn = document.getElementById('reset-water');

    const currentDateDisplay = document.getElementById('current-date');
    const splashDateDisplay = document.getElementById('splash-date');

    // State
    const todayStr = new Date().toLocaleDateString('pt-BR');
    let appState = {
        date: todayStr,
        currentScreen: 'splash',
        waterMl: 0,
        waterGoal: 2000,
        gymLevel: 'intermediate',
        selectedIds: [],
        checkedIds: [],
        customTasks: [],
        generatedRoutine: null
    };

    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const now = new Date();
    const dayIndex = now.getDay();
    if (currentDateDisplay) currentDateDisplay.textContent = `${daysOfWeek[dayIndex]}, ${todayStr}`;
    if (splashDateDisplay) splashDateDisplay.textContent = todayStr;

    const anchorTimes = { lunch: '12:30', dinner: '19:30' };

    const taskDefinitions = {
        weekday: [
            { id: 'wake', duration: 60, activity: 'Acordar / Café da manhã' },
            { id: 'school', activity: 'Escola', startTime: '07:00', endTime: '12:30', fixed: true },
            { id: 'lunch', duration: 40, activity: 'Almoço', anchor: 'lunch' },
            { id: 'gym', duration: 40, activity: 'Academia', gym: true },
            { id: 'shower', duration: 30, activity: 'Banho / Lanche' },
            { id: 'study', duration: 270, activity: 'Estudo em Casa (Foco Total)' },
            { id: 'dinner', duration: 60, activity: 'Jantar e Descanso', anchor: 'dinner' },
            { id: 'read', duration: 45, activity: 'Leitura' }
        ],
        saturday: [
            { id: 'wake', duration: 60, activity: 'Acordar / Café da manhã' },
            { id: 'course', activity: 'Curso Pré-Vestibular', startTime: '07:00', endTime: '18:00', fixed: true },
            { id: 'gym', duration: 30, activity: 'Academia (Express)', gym: true },
            { id: 'dinner', duration: 60, activity: 'Banho e Jantar', anchor: 'dinner' },
            { id: 'company', duration: 60, activity: 'Foco Empresa' },
            { id: 'read', duration: 60, activity: 'Leitura (Lazer)' }
        ],
        sunday: [
            { id: 'wake', duration: 60, activity: 'Acordar (Descanso)' },
            { id: 'gym', duration: 30, activity: 'Academia (Express)', gym: true },
            { id: 'company', duration: 180, activity: 'Foco Empresa' },
            { id: 'lunch', duration: 90, activity: 'Almoço e Descanso', anchor: 'lunch' },
            { id: 'study', duration: 180, activity: 'Estudo Individual' },
            { id: 'read', duration: 90, activity: 'Leitura' },
            { id: 'plan', duration: 90, activity: 'Planejamento da Semana' },
            { id: 'dinner', duration: 60, activity: 'Jantar e Tempo livre', anchor: 'dinner' }
        ]
    };

    // Navigation Logic
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(`screen-${screenId}`);
        if (target) target.classList.remove('hidden');
        
        const globalUI = document.getElementById('global-ui');
        if (globalUI) {
            if (screenId === 'splash') {
                globalUI.classList.add('hidden');
            } else {
                globalUI.classList.remove('hidden');
            }
        }

        appState.currentScreen = screenId;
        saveState();
    }

    // Persistence Logic
    function saveState() {
        localStorage.setItem('routine_app_v4_state', JSON.stringify(appState));
    }

    function loadState() {
        const saved = localStorage.getItem('routine_app_v4_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.date === todayStr) {
                // Merge to handle new properties like waterGoal
                appState = { ...appState, ...parsed };
                applyState();
            } else {
                saveState();
            }
        }
        updateWaterUI();
        renderCustomTasks();
    }

    function applyState() {
        if (gymLevel) gymLevel.value = appState.gymLevel;
        if (waterGoalInput) waterGoalInput.value = appState.waterGoal;
        showScreen(appState.currentScreen);
        if (appState.generatedRoutine) renderRoutineFromState();
    }

    // Water Logic
    function updateWaterUI() {
        if (waterProgressText) waterProgressText.textContent = `${appState.waterMl} / ${appState.waterGoal} ml`;
        if (waterFill) {
            const percentage = Math.min(100, (appState.waterMl / appState.waterGoal) * 100);
            waterFill.style.width = `${percentage}%`;
        }
    }

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = parseInt(btn.dataset.amount);
            appState.waterMl += amount;
            updateWaterUI();
            saveState();
        });
    });

    if (resetWaterBtn) {
        resetWaterBtn.addEventListener('click', () => {
            if (confirm('Zerar contador de água?')) {
                appState.waterMl = 0;
                updateWaterUI();
                saveState();
            }
        });
    }

    if (waterGoalInput) {
        waterGoalInput.addEventListener('change', (e) => {
            const newGoal = parseInt(e.target.value);
            if (newGoal > 0) {
                appState.waterGoal = newGoal;
                updateWaterUI();
                saveState();
            }
        });
    }

    // Custom Task Logic
    if (addCustomBtn) {
        addCustomBtn.addEventListener('click', () => {
            const name = customTaskName.value.trim();
            const duration = parseInt(customTaskDuration.value);
            if (name && duration) {
                appState.customTasks.push({ id: `custom_${Date.now()}`, activity: name, duration: duration });
                customTaskName.value = '';
                customTaskDuration.value = '';
                renderCustomTasks();
                saveState();
            }
        });
    }

    function renderCustomTasks() {
        if (!customTaskList) return;
        customTaskList.innerHTML = '';
        appState.customTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'custom-task-item';
            li.innerHTML = `<span>${task.activity} (${task.duration}m)</span><span class="remove-task" data-id="${task.id}">×</span>`;
            li.querySelector('.remove-task').addEventListener('click', () => {
                appState.customTasks = appState.customTasks.filter(t => t.id !== task.id);
                renderCustomTasks();
                saveState();
            });
            customTaskList.appendChild(li);
        });
    }

    // Routine Logic
    function timeToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    function minutesToTime(minutes) {
        let h = (Math.floor(minutes / 60)) % 24;
        let m = minutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    function renderSelectors() {
        if (!activitySelectors) return;
        const type = dayIndex === 6 ? 'saturday' : (dayIndex === 0 ? 'sunday' : 'weekday');
        const tasks = taskDefinitions[type];
        activitySelectors.innerHTML = '';
        tasks.forEach(task => {
            const label = document.createElement('label');
            label.className = 'selector-item';
            const isChecked = appState.selectedIds.length === 0 || appState.selectedIds.includes(task.id);
            label.innerHTML = `<input type="checkbox" value="${task.id}" ${isChecked ? 'checked' : ''}><span>${task.activity}</span>`;
            activitySelectors.appendChild(label);
        });
    }

    function calculateRoutine(overrideStartTime = null) {
        const type = dayIndex === 6 ? 'saturday' : (dayIndex === 0 ? 'sunday' : 'weekday');
        const baseTasks = taskDefinitions[type];
        const selectedIds = Array.from(activitySelectors.querySelectorAll('input:checked')).map(i => i.value);
        
        let currentTime = overrideStartTime !== null ? overrideStartTime : (new Date().getHours() * 60 + new Date().getMinutes());
        const startTimestamp = currentTime;

        const lunchAnchor = timeToMinutes(anchorTimes.lunch);
        const dinnerAnchor = timeToMinutes(anchorTimes.dinner);

        let calculatedItems = [];
        let isGymActive = false;

        const add = (id, duration, label, custom = false) => {
            calculatedItems.push({ id, start: currentTime, end: currentTime + duration, activity: label, custom });
            currentTime += duration;
        };

        if (selectedIds.includes('wake') && currentTime < timeToMinutes('08:00')) {
            add('wake', 60, 'Acordar / Café da manhã');
        }

        const schoolTask = baseTasks.find(t => (t.id === 'school' || t.id === 'course') && selectedIds.includes(t.id));
        if (schoolTask) {
            const sEnd = timeToMinutes(schoolTask.endTime);
            if (currentTime < sEnd) {
                const sStart = Math.max(currentTime, timeToMinutes(schoolTask.startTime));
                calculatedItems.push({ id: schoolTask.id, start: sStart, end: sEnd, activity: schoolTask.activity });
                currentTime = sEnd + 20;
            }
        }

        appState.customTasks.forEach(t => { if (currentTime < lunchAnchor) add(t.id, t.duration, t.activity, true); });

        if (selectedIds.includes('lunch')) {
            currentTime = Math.max(currentTime, lunchAnchor);
            add('lunch', 40, 'Almoço');
            currentTime += 10;
        }

        if (selectedIds.includes('gym')) {
            isGymActive = true;
            add('gym', 40, 'Academia');
            if (selectedIds.includes('shower')) add('shower', 30, 'Banho / Lanche');
        }

        if (selectedIds.includes('study')) {
            add('study', 270, 'Estudo em Casa (Foco Total)');
        }

        appState.customTasks.forEach(t => {
            if (!calculatedItems.find(i => i.id === t.id)) add(t.id, t.duration, t.activity, true);
        });

        if (selectedIds.includes('dinner')) {
            currentTime = Math.max(currentTime, dinnerAnchor);
            add('dinner', 60, 'Jantar e Descanso');
        }

        if (selectedIds.includes('read')) add('read', 45, 'Leitura');

        const sleepTime = startTimestamp + (15 * 60 + 30);
        calculatedItems.push({ id: 'sleep', start: sleepTime, end: sleepTime, activity: 'Dormir' });

        return { items: calculatedItems, gymActive: isGymActive };
    }

    function renderRoutineFromState() {
        if (!routineChecklist) return;
        routineChecklist.innerHTML = '';
        appState.generatedRoutine.items.forEach(item => {
            const card = document.createElement('div');
            const isChecked = appState.checkedIds.includes(item.id);
            card.className = `checklist-card ${isChecked ? 'completed' : ''} ${item.custom ? 'custom' : ''}`;
            const timeStr = item.start === item.end ? minutesToTime(item.start) : `${minutesToTime(item.start)} - ${minutesToTime(item.end)}`;
            card.innerHTML = `<input type="checkbox" ${isChecked ? 'checked' : ''}><div class="routine-time">${timeStr}</div><div class="routine-activity">${item.activity}</div>`;
            card.querySelector('input').addEventListener('change', (e) => {
                if (e.target.checked) { if (!appState.checkedIds.includes(item.id)) appState.checkedIds.push(item.id); }
                else appState.checkedIds = appState.checkedIds.filter(id => id !== item.id);
                card.classList.toggle('completed', e.target.checked);
                saveState();
            });
            routineChecklist.appendChild(card);
        });
        renderGym(dayIndex, appState.gymLevel, appState.generatedRoutine.gymActive);
    }

    function renderGym(day, level, active) {
        if (!active || !gymSection) return gymSection?.classList.add('hidden');
        gymSection.classList.remove('hidden');
        const s = level === 'basic' ? '2' : '4';
        let c = (day === 1 || day === 3 || day === 5) ? `<div class="training-item"><strong>Leg Press + Puxada Alta</strong><p>${s} séries.</p></div>` :
            (day === 2 || day === 4) ? `<div class="training-item"><strong>Supino + Agachamento Sumô</strong><p>${s} séries.</p></div>` :
            `<div class="training-item"><strong>Treino Express</strong><p>30 min.</p></div>`;
        trainingContent.innerHTML = c;
    }

    // Event Handlers
    if (startDayBtn) startDayBtn.addEventListener('click', () => showScreen('selection'));

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const result = calculateRoutine();
            appState.generatedRoutine = result;
            appState.selectedIds = Array.from(activitySelectors.querySelectorAll('input:checked')).map(i => i.value);
            appState.gymLevel = gymLevel.value;
            appState.checkedIds = [];
            showScreen('routine');
            renderRoutineFromState();
        });
    }

    if (recalculateBtn) {
        recalculateBtn.addEventListener('click', () => {
            const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
            const result = calculateRoutine(nowMins);
            appState.generatedRoutine.items = appState.generatedRoutine.items.map(old => {
                if (appState.checkedIds.includes(old.id)) return old;
                const updated = result.items.find(nw => nw.id === old.id);
                return updated || old;
            });
            saveState();
            renderRoutineFromState();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Redefinir o dia?')) {
                appState.generatedRoutine = null;
                appState.checkedIds = [];
                showScreen('splash');
            }
        });
    }

    renderSelectors();
    loadState();
});
