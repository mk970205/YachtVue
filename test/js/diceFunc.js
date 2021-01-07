var DICE_COMB = [
    'Aces', 'Deuces', 'Threes', 'Fours', 'Fives', 'Sixes',
    'Choice', '4 of Kind', 'Full House', 'S Straight', 'L Straight', 'Yacht!',
];

function analyzeDiceScore(diceList) {
    let numOfDice = Array(6).fill(0);
    diceList.sort(diceSorter);

    let prevValue = -1;
    let seqLength = maxSeqLength = 0;
    diceList.forEach(el => {
        numOfDice[el.value - 1]++;
        if(el.value == prevValue + 1) {
            seqLength++;
            if(maxSeqLength < seqLength) maxSeqLength = seqLength;
        }
        else if(el.value != prevValue) {
            seqLength = 0;
        }
        prevValue = el.value;
    });

    let pair = Array(6).fill(0).map((_, idx) => (idx + 1) * numOfDice[idx]);
    let choice = diceList.reduce((total, el) => total + el.value, 0);

    let kind4 = (numOfDice.some(el => el >= 4)) ?                                           choice : 0;
    let sStrt = (maxSeqLength >= 3) ?                                                           15 : 0;
    let lStrt = (maxSeqLength >= 4) ?                                                           30 : 0;
    let yacht = (numOfDice.includes(5)) ?                                                       50 : 0;
    let fullH = (numOfDice.includes(3) && numOfDice.includes(2)) || numOfDice.includes(5) ? choice : 0;

    return pair.concat([choice, kind4, fullH, sStrt, lStrt, yacht]);
}

function generateDice() {
    return Math.floor(Math.random() * 6) + 1;
}

function moveDice(src, dst, sidx) {
    for (let didx = 0; didx < dst.length; didx++) {
        if(dst[didx].value == 0) {
            var tmp = src[sidx].value;
            src[sidx].value = dst[didx].value;
            dst[didx].value = tmp;
            return true;
        }
    }
    
    return false;
}

var diceSorter = (lhs, rhs) => {
    return (lhs.value == 0) ? 1 : 
        (rhs.value == 0) ? -1 :
        (lhs.value < rhs.value) ? -1 : 
        (lhs.value > rhs.value) ? 1 : 0;
};