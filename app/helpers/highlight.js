import Helper from '@ember/component/helper';

export default class Highlight extends Helper {
    compute(args) {
        let [key,line] = args;
        var regexExp = new RegExp(key,"g");
        var replaceWith = key.fontcolor("blue");
        var fi = line.replace(regexExp,replaceWith);
        return fi;
    }
}