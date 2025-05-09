import { bus } from './EventBus.js';

let _score = 0;
let _foodLevel = 1;
let _isBossActive = false;
let _activeBossInstance = null;

export const GameState = {
    getScore() {
        return _score;
    },
    setScore(newScore) {
        const scoreNum = Number(newScore);
        if (!isNaN(scoreNum)) {
            _score = scoreNum;
            bus.emit('scoreChanged', _score);
            console.log(`[GameState] Score set to: ${_score}`);
        } else {
            console.warn(`[GameState] Attempted to set invalid score: ${newScore}`);
        }
    },
    addScore(amount) {
        const amountNum = Number(amount);
        if (!isNaN(amountNum)) {
            _score += amountNum;
            bus.emit('scoreChanged', _score);
        } else {
            console.warn(`[GameState] Attempted to add invalid amount to score: ${amount}`);
        }
    },

    getFoodLevel() {
        // if (_foodLevel == 1) {
        //     return 'LEVEL1';
        // }
        // else {
        //     return 'LEVEL2';
        // }
        return _foodLevel;
    },
    setFoodLevel(newLevel) {
        const levelNum = Number(newLevel);
        if (!isNaN(levelNum) && levelNum > 0) {
            _foodLevel = levelNum;
            bus.emit('foodLevelChanged', _foodLevel);
            console.log(`[GameState] Food Level set to: ${_foodLevel}`);
        } else {
            console.warn(`[GameState] Attempted to set invalid food level: ${newLevel}`);
        }
    },
    
    isBossActive() {
        return _isBossActive && _activeBossInstance && _activeBossInstance.alive;
    },
    getActiveBoss() {
        if (_isBossActive && _activeBossInstance && _activeBossInstance.alive) {
            return _activeBossInstance;
        }
        if (_isBossActive || _activeBossInstance) {
             console.log("[GameState] Active boss instance is null or not alive. Clearing state.");
             _isBossActive = false;
             _activeBossInstance = null;
        }
        return null;
    },
    setBossActive(bossInstance) {
        if (bossInstance && bossInstance.alive) {
            _isBossActive = true;
            _activeBossInstance = bossInstance;
            bus.emit('bossStateChanged', { active: true, boss: _activeBossInstance });
            console.log('[GameState] Boss state SET to ACTIVE. Instance:', _activeBossInstance);
        } else {
             console.warn('[GameState] Attempted to set active boss with invalid instance:', bossInstance);
        }
    },
    setBossInactive() {
        if (_isBossActive || _activeBossInstance) {
            const previouslyActiveBoss = _activeBossInstance;
            _isBossActive = false;
            _activeBossInstance = null;
            bus.emit('bossStateChanged', { active: false, boss: previouslyActiveBoss });
            console.log('[GameState] Boss state SET to INACTIVE.');
        }
    },

    serialize() {
        return {
            score: _score,
            foodLevel: _foodLevel,
            isBossActive: this.isBossActive(),
        };
    },
    applyState(newState) {
        console.log("[GameState] Applying new state:", newState);
        this.setScore(newState.score ?? 0);
        this.setFoodLevel(newState.foodLevel ?? 1);
        if (!(newState.isBossActive ?? false)) {
             this.setBossInactive();
        }

        console.log("[GameState] State applied.");
    }
};

console.log("[GameState] Module Initialized.");