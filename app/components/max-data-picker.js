import Component from '@ember/component';
import { computed } from '@ember/object';


export default Component.extend({
    show: false,
    attributeBindings: ["tabIndex"],
    tabIndex: 1,
    months: [1,2,3,4,5,6,7,8,9,10,11,12],
    curMonth: 1,
    curYear: 2020,
    curDate: "MAT",
    yearMonth: computed("curYear", "curMonth", function() {
        return `${this.curYear}-${this.curMonth}`
    }),
    dates: ["MAT", "YTD", "RQ", "MTH"],
    focusOut() {
        // this.set("show", false)
    },
    click() {
        this.set("show", true)
    },
    actions: {
        close() {
            this.set("show", false)
        },
        confirm() {
            // 这个应该要留出位置来吧
            this.set("show", true)
        },
        selectMonth(month) {
            this.set("curMonth", month)
        },
        changeYear(type) {
            if (type === "after") {
                this.set("curYear", this.get("curYear") + 1)
            } else if (type === "before") {
                this.set("curYear", this.get("curYear") - 1)
            }
        },
        selectDate(date) {
            this.set("curDate", date)
        }
    }
});
