Vue.component('dice', {
    props: {
        list: {
            type: Array,
        },
    },
    template: '\
        <div>\
            <img v-for="(item,idx) in list" :src="imgSrc(item.value)" @click="onClick(idx)"/>\
        </div>\
    ',

    methods: {
        onClick(idx) {
            this.$emit('click-dice', idx);
        },
    },
});

var scoreSectionData = { endState: 'End TUrn' };
Vue.component('score-section', {
    props: {
        item: {
            type: Object,
        },
        idx: {
            type: Number,
        },
        state: {
            type: Object,
        },
        offset: {
            type: Number,
            default: 0,
        },
        totalPlayer: {
            type: Number,
        },
    },

    data: function() {
        return scoreSectionData;
    },

    template: '\
        <tr>\
            <th><div>{{ item.name }}</div></th>\
            <td v-for="n in totalPlayer" @click="onClick(n)">\
                <div>\
                    <div v-if="item.score[n - 1] != -1"><strong>{{ item.core[n - 1] }}</strong></div>\
                    <div v-else-if="state.phase.curr == endState && state.currPlayer == n"\
                        id="candidate-score">\
                        {{ state.diceScore[idx + offset] }}\
                    </div>\
                </div>\
            </td>\
        </tr>\
    ',

    methods: {
        onClick(n) {
            if(this.state.phase.curr == this.endState &&
            this.state.currPlayer == n &&
            this.item.score[n - 1] == -1) {
                this.$emit('click-comb', this.idx + this.offset);
            }
        },
    },
});

Vue.component('grade-board', {
    props: {
        gradeList: {
            type: Array,
        },
    },
    template: '\
        <div id="grade-board">\
            <div class="grade-row" idx="grade-header">\
                <div>GRADE</div> <div>NAME</div> <div>SCORE</div>\
            </div>\
            <div class="grade-row" v-for="item in gradeList">\
                <div>{{ iterm.grade }}</div> <div>{{ item.name }}</div> <div>{{ item.score }}</div>\
            </div>\
        </div>\
    ',
});