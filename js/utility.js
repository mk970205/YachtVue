class StateMachine {
    constructor(stateSet, transition, initState, finalState) {
        this.stateSet = stateSet;
        this.curr = initState;
        this.final = finalState;
        this.transition = {};
        transition.forEach(el => {
            this.transition[el.start] = this.transition[el.start] || [];
            this.transition[el.start].push(el.end);
        });
    }

    transit(dst) {
        if(this.transition[this.curr].includes(dst)) {
            this.curr = dst;
        }
    }

    isFinished() {
        return this.final == this.curr;
    }
}

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

window.ondragstart = function() { return false; };