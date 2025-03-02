"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
async function activate(context) {
    let disposable = vscode.commands.registerCommand('csharp-member-initializer.initializeMembers', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        const position = editor.selection.active;
        // 確保光標在 "new XXX" 附近
        const lineText = document.lineAt(position.line).text;
        const match = lineText.match(/new\s+(\w+)/);
        if (!match) {
            vscode.window.showInformationMessage('Please place the cursor on a "new XXX" statement.');
            return;
        }
        const className = match[1]; // 獲取類別名稱 XXX
        try {
            console.log(document.uri);
            // 1️⃣ 執行 `executeDefinitionProvider` 查找 `XXX` 的定義位置
            const documentUri = vscode.Uri.file('D:\\Project\\Test\\test.cs');
            const definitions = await vscode.commands.executeCommand('vscode.executeDefinitionProvider', documentUri, position);
            if (!definitions || definitions.length === 0) {
                vscode.window.showErrorMessage(`Definition of ${className} not found.`);
                return;
            }
            // 2️⃣ 取得 `XXX.cs` 的檔案 URI
            const classDefinition = definitions[0]; // 取第一個定義
            const classUri = classDefinition.uri;
            vscode.window.showInformationMessage(`Class ${className} found at ${classUri.fsPath}`);
            // 3️⃣ 讀取 `XXX.cs` 文件內容並解析成員
            const members = await getClassMembers(classUri);
            if (members.length === 0) {
                vscode.window.showInformationMessage(`No members found in ${className}.`);
                return;
            }
            // 4️⃣ 產生初始化程式碼
            const initCode = generateInitializerCode(members);
            editor.edit(editBuilder => {
                if (!lineText.trim().endsWith('{')) {
                    editBuilder.insert(new vscode.Position(position.line, lineText.length), ' {');
                }
                editBuilder.insert(new vscode.Position(position.line + 1, 0), initCode);
            });
        }
        catch (error) {
            vscode.window.showErrorMessage('Error analyzing code: ' + error);
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// **函式：讀取類別檔案並解析屬性**
async function getClassMembers(classUri) {
    try {
        const document = await vscode.workspace.openTextDocument(classUri);
        const text = document.getText();
        // 使用正則表達式匹配屬性和欄位
        const matches = [...text.matchAll(/\b(public|private|protected|internal)?\s+(\w+)\s+(\w+)\s*[{;=]/g)];
        return matches.map(match => match[3]); // `match[3]` 是變數名稱
    }
    catch (error) {
        vscode.window.showErrorMessage('Error reading class members: ' + error);
        return [];
    }
}
// **函式：生成初始化程式碼**
function generateInitializerCode(members) {
    const memberInits = members.map(m => `            ${m} = `).join(',\n');
    return `\n${memberInits}\n        }`;
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map