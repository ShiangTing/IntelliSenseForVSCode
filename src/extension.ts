import { Console } from 'console';
import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
    // 註冊命令
    let disposable = vscode.commands.registerCommand('csharp-member-initializer.initializeMembers', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        const position = editor.selection.active;   

        const lineText = document.lineAt(position.line).text;
        // 修改 match 規則，使其匹配 new XXX(), new XXX(), new XXX ()等格式
        const match = lineText.match(/new\s+(\w+)\s*\(\s*\)/);
        if (!match) {
            vscode.window.showInformationMessage('Please place the cursor on a "new XXX() {" statement.');
            return;
        }

        const className = match[1];

        try {
            // 使用 WorkspaceSymbolProvider 來查找類別
            const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeWorkspaceSymbolProvider',
                className
            );

            // 找到匹配的類別符號
            const classSymbol = symbols?.find(s => 
                s.kind === vscode.SymbolKind.Class && 
                s.name === className
            );

            if (!classSymbol) {
                vscode.window.showErrorMessage(`Class ${className} not found.`);
                return;
            }

            // 使用 DocumentSymbolProvider 來獲取類別成員
            const classDocument = await vscode.workspace.openTextDocument(classSymbol.location.uri);
            const memberSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                classSymbol.location.uri
            );

            // 找到類別的符號
            const classDocSymbol = memberSymbols?.find(s => 
                s.kind === vscode.SymbolKind.Class && 
                s.name === className
            );

            if (!classDocSymbol) {
                vscode.window.showErrorMessage(`Unable to analyze class ${className}.`);
                return;
            }

            // 收集所有屬性和欄位
            const members = classDocSymbol.children
                .filter(s => s.kind === vscode.SymbolKind.Property || s.kind === vscode.SymbolKind.Field)
                .map(s => s.name);

            if (members.length === 0) {
                vscode.window.showInformationMessage(`No members found in ${className}.`);
                return;
            }

            const initCode = generateInitializerCode(members);

            // 找到下一行的縮排
            const nextLine = document.lineAt(position.line + 1);
            const indentation = nextLine.text.match(/^\s*/)?.[0] || '';

            editor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(position.line + 1, 0), initCode);
            });

        } catch (error) {
            vscode.window.showErrorMessage('Error analyzing code: ' + error);
        }
    });

    // 註冊 context menu 的條件
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider('csharp', new InitializeMembersActionProvider(), {
            providedCodeActionKinds: [vscode.CodeActionKind.RefactorInline]
        })
    );

    context.subscriptions.push(disposable);
}

// 修改 CodeActionProvider 類別中的 match 規則
class InitializeMembersActionProvider implements vscode.CodeActionProvider {
    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range
    ): vscode.CodeAction[] {
        const lineText = document.lineAt(range.start.line).text;
        const match = lineText.match(/new\s+(\w+)\s*\(\s*\)/);

        if (!match) {
            return [];
        }

        const action = new vscode.CodeAction(
            'Initialize Members',
            vscode.CodeActionKind.RefactorInline
        );
        action.command = {
            command: 'csharp-member-initializer.initializeMembers',
            title: 'Initialize Members',
            tooltip: 'Initialize all members of the class'
        };

        return [action];
    }
}

export function generateInitializerCode(members: string[]): string {
    return `{ ${members.map(m => `${m} = `).join(',\n')} };`;
}

export function deactivate() {} 
