const vscode = require("vscode");
const axios = require("axios");
const plang_settings = require('./plang_settings');


function _getFileSetting(){
  const ext = vscode.window.activeTextEditor.document.fileName.split('.').pop();
  return plang_settings[ext];
}


async function createDescription() {
  const editor = vscode.window.activeTextEditor;
  const text = editor.document.getText(editor.selection);

  const authToken = await vscode.window.showInputBox({
    placeHolder: "Input Authorization Token",
    password: true,
  });
  if (!authToken) {
    
    return false;
  }
  const setting = _getFileSetting();


  
  vscode.window.showInformationMessage("Start code logic analize");
  const response = await axios.post(
    "https://api.openai.com/v1/engines/davinci-codex/completions",
    {
      prompt: setting.comment.singleline + setting.language + "\n"  + text + "\n" + setting.comment.multiline.start +  "Here's what the above code is doing:",
      temperature: 0,
      max_tokens: text.length * 4,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stop: [setting.comment.multiline.end],
    },
    {
      headers: {
        authorization: "Bearer " + authToken,
      },
    }
  );
  const explainText = response.data.choices[0].text;
  vscode.window.showInformationMessage("Making Better Code");
  const codeResponse = await axios.post(
    "https://api.openai.com/v1/engines/davinci-codex/completions",
    {
      prompt: setting.comment.multiline.start + '\n' + setting.language + ' language\n' + explainText + '\n' +  setting.comment.multiline.end,
      temperature: 0,
      max_tokens: text.length * 4,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      //stop: [setting.comment.multiline.end],
    },
    {
      headers: {
        authorization: "Bearer " + authToken,
      },
    }
  );

 
  const betterCode = setting.comment.multiline.start + '\n' + explainText + '\n\n' + codeResponse.data.choices[0].text + "\n" + setting.comment.multiline.end;
  return betterCode;
}

function activate(context) {


  // Register ExplainCode.
  let disposable2 = vscode.commands.registerCommand(
    "bettercode.createBetter",
    function () {
      
      createDescription().then(result => {
        const editor = vscode.window.activeTextEditor;
        if(result === false){
          return;

        }
        
        const replacement = result + '\n' + editor.document.getText(editor.selection);
    
      


       
        editor.edit(editBuilder => {
          editBuilder.replace(editor.selection, replacement);
        });
      })
    }
  );
}
exports.activate = activate;

function deactivate() { }
exports.deactivate = deactivate;

module.exports = {
  activate,
  deactivate,
};
