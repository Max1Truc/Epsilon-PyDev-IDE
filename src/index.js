import Numworks from "numworks.js";

import CodeMirror from "codemirror"
import 'codemirror/mode/python/python.js';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/neat.css';
import 'codemirror/theme/midnight.css';
import codemirror from "codemirror";

const calculator = new Numworks();

var storage = null;
var currentEditingFile = null;

const codeMirrors = document.getElementById("codemirrors");
const fileList = document.getElementById("fileList");

const editor = document.getElementById("editor");
var myCodeMirror = CodeMirror(codeMirrors, {
    value: "from math import *\n\n",
    mode: "python",
    theme: "midnight",
    lineNumbers: true
});

navigator.usb.addEventListener("disconnect", function (e) {
    calculator.onUnexpectedDisconnect(e, function () {
        calculator.autoConnect(connectedHandler);
        connectButton.style.display = "block";
        editor.style.display = "none";
        myCodeMirror.getWrapperElement().style.display = "none";
    });
});

calculator.autoConnect(connectedHandler);

const connectButton = document.getElementById("connectButton");
connectButton.addEventListener("click", (e) => {
    calculator.detect(connectedHandler, function (error) {
        console.error(error);
    })
});

function connectedHandler() {
    calculator.stopAutoConnect();
    connectButton.style.display = "none";
    editor.style.display = "flex";
    myCodeMirror.getWrapperElement().style.display = "block";
    myCodeMirror.getWrapperElement().style.visibility = "hidden";

    calculator.backupStorage().then(async (backup) => {
        storage = backup;
        fileList.innerHTML = "";

        for (let file of storage.records) {
            if (file["type"] == "py") {
                let fileButton = document.createElement("button");
                fileButton.innerText = file["name"] + ".py";
                fileButton.className = "fileButtons";
                fileButton.addEventListener("click", () => {
                    myCodeMirror.getWrapperElement().style.visibility = "visible";
                    currentEditingFile = null;
                    for (var current_file of storage.records) {
                        if (current_file["name"] == file["name"]) {
                            myCodeMirror.setValue(current_file["code"]);
                            myCodeMirror.refresh();
                            currentEditingFile = file["name"];
                            break;
                        }
                    }
                });
                fileList.appendChild(fileButton);
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    connectButton.style.display = "block";
    editor.style.display = "none";
    myCodeMirror.getWrapperElement().style.display = "none";
})

myCodeMirror.on("change", async () => {
    if (currentEditingFile !== null && storage !== null) {
        storage.records = storage.records.filter((record) => record["type"] != "py" || record["name"] != currentEditingFile);
        storage.records.push({"name": currentEditingFile, "type": "py", "autoImport": false, "code": myCodeMirror.getValue()});
        var storageSave = JSON.stringify(storage.records);
        await calculator.installStorage(storage, function () {});
        storage.records = JSON.parse(storageSave);
    }
});
