var $ = require("lib/jquery.min.js");
var CodeMirror = require("lib/codemirror");
require("lib/codemirror/clike");

// Mode of execution
var mode = "Java";
var code = "";
var editor;
var typingTimer;                //timer identifier
var doneTypingInterval = 1500; // wait time millis
var arrTables;
var slider = document.getElementById("myRange");

// Error managment
var err = console.error;

// ANTLR4 var init and visit
const antlr4 = require('antlr4/index');
var Lexer, Parser, Visitor;

$(document).ready(function () {
    setMode(mode);
    $("#myRange").on("input", function () {
        for (let gutter of $(".gutter-highlight"))
            gutter.className = "";
        let gutter = $(".CodeMirror-code")[0].children[arrTables[slider.value][0]];
        gutter.className += " gutter-highlight";
        Drawer.variables(arrTables[slider.value][1]);
    });
    // Code to put timer
    editor.on("keyup", function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(function () {
            for (let gutter of $(".gutter-error")) {
                gutter.className = "CodeMirror-linenumber CodeMirror-gutter-elt";
                gutter.removeChild(gutter.lastChild);
            }
            code = editor.getValue();
            console.clear();
            setTimeout(() => {
                arrTables = visit(code)
                slider.min = 0;
                slider.value = 0;
                slider.max = arrTables.length - 1;
                for (let gutter of $(".gutter-highlight"))
                    gutter.className = "";
                let gutter = $(".CodeMirror-code")[0].children[arrTables[slider.value][0]];
                gutter.className += " gutter-highlight";
                Drawer.variables(arrTables[0][1]);
            }, 1);
        }, doneTypingInterval);
    });
    code = editor.getValue();
});

console.error = function (e) {
    err(e);
    var numLinea = parseInt(e.split(" ")[1][0]);
    var gutter = $(".CodeMirror-code")[0].children[numLinea - 1].firstChild.firstChild;
    if (gutter.childNodes.length == 1) {
        var tooltip = document.createElement("span");
        tooltip.className = "gutter-error-tooltip";
        tooltip.appendChild(document.createTextNode("At:" + e.substring(7)));
        gutter.appendChild(tooltip);
        gutter.className += " gutter-error";
    } else {
        gutter.lastChild.textContent += "\nAt:" + e.substring(7);
    }
};

function setMode(m) {
    editor = CodeMirror(document.getElementById("input"), {
        lineNumbers: true,
        matchBrackets: true,
        styleActiveLine: true,
        indentUnit: 4,
        mode: "text/x-" + mode.toLowerCase(),
        value: "public class Main{\n\tpublic static void main(String[] args){\n\t\t\n\t}\t\n}",
        smartIdent: true
    });
    Lexer = require(("generated-parser/" + m + "Lexer"));
    Parser = require(("generated-parser/" + m + "Parser"));
    Visitor = require(("js/Visitors/" + m + "Visitor")).Visitor;
}

function visit(code) {
    var input = code;
    var chars = new antlr4.InputStream(input);
    var lexer = new Lexer[mode + "Lexer"](chars);
    var tokens = new antlr4.CommonTokenStream(lexer);
    var parser = new Parser[mode + "Parser"](tokens);
    var visitor = new Visitor();

    parser.buildParseTrees = true;
    let tree = parser.compilationUnit();
    try {
        return visitor.visitCompilationUnit(tree);
    } catch (e) {
        err(e);
    }
}

// From: https://jsfiddle.net/pahund/5qtt2Len/1/
function clone(obj) {
    let copy;

    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Map) {
        return new Map(clone(Array.from(obj)));
    }

    if (obj instanceof Array) {
        copy = [];
        for (let i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    if (obj instanceof Object) {
        copy = {};
        for (const attr in obj) {
            // if (obj.hasOwnProperty(attr)) {
            copy[attr] = clone(obj[attr]);
            // }
        }
        return copy;
    }
    throw new Error('Unable to copy object! Its type isn\'t supported');
}