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
        await this.rollEvent();
        this.sortAll();
        this.state.phase.transit('Roll');
    },

    async rollEvent() {
        if(this.state.phase.curr !== 'Event') return;
        let diceBowlElem = document.getElementById('dice-bowl');
        let tmpColor = window.getComputedStyle(diceBowlElem, null).backgroundColor;
        diceBowlElem.style.backgroundColor = '#2f0b14';

        // intv가 낮을 수록 주사위 굴리는 애니메이션 주기가 짧아짐
        // 사다리꼴 모양의 애니메이션 횟수 - 주기 그래프를 갖는다.
        // 시작 후, 최소 주기가 될 때까지 선형적으로 주기를 줄임 (phase -1)
        // 일정 횟수 이상 애니메이션이 돌아갈 때까지 정지한 후 (phase 0)
        // 다시 선형적으로 주기를 늘임 (phase 1)
        // 처음 주기보다 길어지면 종료

        let initIntv = 450;
        let peakIntv = 50;
        let accel = -50;
        let decel = 130;
        let peakCnt = 20;
        let phase = -1;

        let intv = initIntv;
        let currPeakCnt = 0;

        while(phase !== 1 || intv <= initIntv) {
            this.state.bowlDice.forEach((el, idx) => {
                if(el.value === 0) return;
                let nextDice = generateDice();
                while(nextDice === this.state.bowlDice[idx].value) {
                    nextDice = generateDice();
                }

                this.state.bowlDice[idx].value = nextDice;
            });

            if(phase === -1 && intv === peakIntv) {
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
        
        diceBowlElem.style.backgroundColor = tmpColor;
    },

    // 슬롯과 보울의 주사위를 전부 정렬
    sortAll() {
        this.state.bowlDice.sort(diceSorter);
        this.state.slotDice.sort(diceSorter);
    },

    // 저장슬롯 -> 보울로 주사위 이동
    slotToBowl(idx) {
        if(this.state.gameflow.curr !== 'Playing' || this.state.phase.curr !== 'Roll') return;
        if(this.state.slotDice[idx].value === 0) return;

        moveDice(this.state.slotDice, this.state.bowlDice, idx);
        this.state.numOfDice++;
    },

    // 보울 -> 저장슬롯으로 주사위 이동
    bowlToSlot(idx) {
        if(this.state.gameflow.curr !== 'Playing' || this.state.phase.curr !== 'Roll') return;
        if(this.state.bowlDice[idx].value === 0) return;

        moveDice(this.state.bowlDice, this.state.slotDice, idx);
        this.state.numOfDice--;
    },

    // 슬롯의 주사위를 모두 꺼냄
    popAll() {
        if(this.state.gameflow.curr !== 'Playing' || this.state.phase.curr !== 'Roll') return;
        this.state.slotDice.forEach((el, idx) => {
            if(el.value !== 0) moveDice(this.state.slotDice, this.state.bowlDice, idx);
        });

        this.state.bowlDice.sort(diceSorter);
        this.state.numOfDice = 5;
    },

    // 굴리기 종료 버튼을 눌렀을 때 점수를 표시하고 턴을 끝낼 준비를 함
    endTurn() {
        if(this.state.gameflow.curr !== 'Playing' || this.state.phase.curr !== 'Roll') return;
        
        let newScore = analyzeDiceScore(this.state.bowlDice);
        for(let i = 0; i < newScore.length; i++) {
            Vue.set(this.state.diceScore, i, newScore[i]);
        }

        this.state.phase.transit('End Turn');
    },

    // 고를 수 있는 조합을 선택
    chooseComb(idx) {
        let pidx = this.state.currPlayer - 1;
        if(this.state.phase.curr !== 'End Turn') return;
        if(this.state.playerScore[idx][pidx] !== -1) return;
        Vue.set(this.state.playerScore[idx], pidx, this.state.diceScore[idx]);
        this.state.phase.transit('Score');
        this.scoring();
    },

    // 점수 계산
    scoring() {
        if(this.state.phase.curr !== 'Score') return;
        let pidx = this.state.currPlayer - 1;
        let playerScore = this.state.playerScore.map(
            (_, idx) => {
                return this.state.playerScore[idx][pidx];
            }
        );

        let pairSum = playerScore.slice(0, 6)
            .filter((el) => el > 0)
            .reduce((total, el) => total + el, 0);

        let otherSum = playerScore.slice(6, 12)
            .filter((el) => el > 0)
            .reduce((total, el) => total + el, 0);

        let totalScore = pairSum + otherSum + ((pairSum >= 63) ? 35 : 0);
        Vue.set(this.state.playerScore[12], pidx, pairSum);
        Vue.set(this.state.playerScore[13], pidx, totalScore);
        this.afterScore();
    },

    // 점수 매기기 후
    afterScore() {
        if(this.state.phase.curr !== 'Score') return;

        if(this.state.currPlayer === this.state.totalPlayer) {
            this.state.currTurn++;
            this.state.currPlayer = 0;
        }
        this.state.currPlayer++;

        if(this.state.currTurn > 12) {
            this.state.gameflow.transit('End');
            this.endGame();
        }
        else {
            this.state.phase.transit('Roll');
            this.startTurn();
        }
    },

    // 게임 종료
    endGame() {
        if(this.state.gameflow.curr !== 'End') return;
        this.state.currPlayer = -1;
        this.state.gradeList = this.calcGrade();
    },

    // 순위 매기기
    calcGrade() {
        let totalScore = record = this.state.playerScore[13];

        record = record.filter((el, idx) => record.indexOf(el) === idx);
        record.sort((lhs, rhs) => rhs - lhs);

        let gradeList = Array(this.state.totalPlayer);
        let gradeCnt = 1;
        record.forEach(rec => {
            let duplCnt = 0;
            totalScore.forEach((el, idx) => {
                if(el === rec) {
                    gradeList[idx] = {
                        name: this.state.playerList[idx],
                        score: el,
                        grade: gradeCnt,
                    };
                    duplCnt++;
                }
            });
            gradeCnt += duplCnt;
        });
        gradeList.sort((lhs, rhs) => lhs.grade - rhs.grade);

        return gradeList;
    },

    // 재시작
    restart() {
        if(this.state.gameflow.curr !== 'End') return;
        this.state.gameflow.transit('Start');
        this.startGame(this.state.playerList);
    },
};