import Helper from '@ember/component/helper';

export default class Increment extends Helper {
    compute(args) {
        var ind = parseInt(args);
        return ind+1;
    }
}