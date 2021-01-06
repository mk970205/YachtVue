var gameManager = {
    debug: true,
    state: {
        rollCount: 0,
        rollLimit: 3,
        numOfDice: 5,
        totalPlayer: 2,
        currPlayer: 1,
        gradeList: [],
        currTurn: 1,
        totalTurn: 12,
        diceScore: Array(12).fill(0),
        playerList: ['', ''],
        playerScore: Array.from({ length: 14 }, () => Array(2).fill(-1)),

        slotDice: [ { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, ],
        bowlDice: [ { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }, ],

        gameflow: new StateMachine(
            [ 'Start', 'Playing', 'Event', 'End' ], 
            [
                { start: 'Start', end: 'Playing' },
                { start: 'Playing', end: 'End' },
                { start: 'End', end: 'Start' },
            ], 
            'Start'
        ),
        
        phase: new StateMachine(
            [ 'Roll', 'End Turn', 'Score' ],
            [
                { start: 'Roll', end: 'Event' },
                { start: 'Event', end: 'Roll' },
                { start: 'Roll', end: 'End Turn' },
                { start: 'End Turn', end: 'Score' },
                { start: 'Score', end: 'Roll' },
            ],
            'Roll'
        ),
    },

    startGame(playerList) {
        if(this.state.gameflow.curr !== 'Start') return;

        this.initialize(playerList);
        this.state.gameflow.transit('Playing');
        this.startTurn();
    },

    // 게임 시작 및 재시작 시 변수들을 초기화
    initialize(playerList) {
        let totalPlayer = playerList.length;
        this.state.totalPlayer = totalPlayer;
        this.state.playerList = playerList.map((el, idx) =>
            (el !== '') ? el : `Player ${idx + 1}`
        );
        this.state.playerScore = Array.from({
            length: 14
        }, () => Array(totalPlayer).fill(-1));

        for(let idx = 0; idx < totalPlayer; idx++) {
            this.state.playerScore[12][idx] = 0;
            this.state.playerScore[13][idx] = 0;
        }

        this.state.currTurn = 1;
        this.state.currPlayer = 1;
        this.state.gradeList = [];
        this.state.phase.transit('Roll');
    },

    // 턴 시작
    startTurn() {
        if(this.state.phase.curr !== 'Roll') return;
        this.popAll();
        this.state.rollCount = 0;
        this.reroll();
    },

    // 리롤  
    async reroll() {
        if(this.state.gameflow.curr !== 'Playing' || this.state.phase.curr !== 'Roll') return;
        if(this.state.rollCount >= this.state.rollLimit) return;

        this.state.rollCount++;
        await this.getRollEventResult();

        if(this.state.rollCount >= 3) {
            this.popAll();
            this.endTurn();
        }
    },

    async getRollEventResult() {
        this.state.phase.transit('Event');
        this.sortAll();
        await this.getRollEventResult();
        this.sortAll();
        this.state.phase.transit('Roll');
    },

    async rollEvent() {
        if(this.state.phase.curr !== 'Event') return;
    

        // speed가 낮을 수록 주사위 굴리는 애니메이션 주기가 짧아짐
        // 사다리꼴 모양의 시간 - 속도 그래프를 갖는다.
        // 시작 후, 최대 속도가 될 때까지 선형적으로 속도를 높임 (phase -1)
        // 최대속도에서 일정 시간 정지한 후 (phase 0)
        // 선형적으로 속도를 낮춤 (phase 1)
        // 처음 속도보다 낮아지면 종료

        let initSpeed = 450;
        let peakSpeed = 50;
        let accel = -50;
        let decel = 130;
        let peakCnt = 20;
        let phase = -1;

        let intv = initSpeed;
        let currPeakCnt = 0;

        while(phase !== 1 || intv <= initSpeed) {
            this.state.bowlDice.forEach((el, idx) => {
                if(el.value === 0) return;
                let nextDice = generateDice();
                while(nextDice === this.state.bowlDice[idx].value) {
                    nextDice = generateDice();
                }

                this.state.bowlDice[idx].value = nextDice;
            });

            if(phase === -1 && intv === peakSpeed) {
                phase = 0;
            }

            if(phase === 0) {
                if(currPeakCnt < peakCnt) {
                    currPeakCnt++;
                }
                else {
                    phase = 1;
                }
            }

            intv += (phase === -1) ? accel : (phase === 1) ? decel : 0;
            await sleep(intv);
        }
    },

    // 슬롯과 보울의 주사위를 전부 정렬
    sortAll() {
        this.state.bowlDice.sort(diceSorter);
        this.state.slotDice.sort(diceSorter);
    }
}