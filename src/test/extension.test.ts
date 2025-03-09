import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Initialize Members Command Test', async () => {
        // 創建測試檔案
        const testContent = `
using System;
using System.Collections.Generic;

namespace Test
{
    public class TestClass
    {
        public string Name { get; set; }
        public int Age { get; set; }
        public List<string> Items { get; set; }
    }

    class Program
    {
        static void Main(string[] args)
        {
            var test = new TestClass {
        }
    }
}`;

        // 創建一個暫時的檔案
        const document = await vscode.workspace.openTextDocument({
            language: 'csharp',
            content: testContent
        });

        // 開啟檔案
        const editor = await vscode.window.showTextDocument(document);

        // 移動游標到目標位置
        const position = new vscode.Position(17, 30); // new TestClass { 的位置
        editor.selection = new vscode.Selection(position, position);

        // 執行命令
        await vscode.commands.executeCommand('csharp-member-initializer.initializeMembers');

        // 等待一下讓變更生效
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 驗證結果
        const text = document.getText();
        assert.ok(text.includes('Name ='));
        assert.ok(text.includes('Age ='));
        assert.ok(text.includes('Items ='));
    });

    test('Match Rule Test', () => {
        const testCases = [
            { input: 'new TestClass(){', shouldMatch: true },
            { input: 'new TestClass() {', shouldMatch: true },
            { input: 'new TestClass () {', shouldMatch: true },
            { input: 'new TestClass (){', shouldMatch: true },
            { input: 'new TestClass{', shouldMatch: false },
            { input: 'new TestClass {', shouldMatch: false },
            { input: 'newTestClass(){', shouldMatch: false },
            { input: 'new Test.Class(){', shouldMatch: false },
        ];

        const regex = /new\s+(\w+)\s*\(\s*\)\s*{/;
        
        testCases.forEach(testCase => {
            const match = testCase.input.match(regex);
            assert.strictEqual(
                !!match, 
                testCase.shouldMatch,
                `Failed for input: "${testCase.input}"`
            );
        });
    });

    test('Symbol Provider Test', async () => {
        // 測試 WorkspaceSymbolProvider
        const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
            'vscode.executeWorkspaceSymbolProvider',
            'TestClass'
        );

        assert.ok(symbols, 'Should get symbols');
        assert.ok(symbols.length > 0, 'Should find at least one symbol');

        const classSymbol = symbols.find(s => 
            s.kind === vscode.SymbolKind.Class && 
            s.name === 'TestClass'
        );

        assert.ok(classSymbol, 'Should find TestClass symbol');

        // 測試 DocumentSymbolProvider
        if (classSymbol) {
            const memberSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                classSymbol.location.uri
            );

            assert.ok(memberSymbols, 'Should get member symbols');
            assert.ok(memberSymbols.length > 0, 'Should find class members');

            const classDocSymbol = memberSymbols.find(s => 
                s.kind === vscode.SymbolKind.Class && 
                s.name === 'TestClass'
            );

            assert.ok(classDocSymbol, 'Should find TestClass document symbol');
            assert.ok(
                classDocSymbol.children.some(s => s.kind === vscode.SymbolKind.Property),
                'Should find properties'
            );
        }
    });
}); 