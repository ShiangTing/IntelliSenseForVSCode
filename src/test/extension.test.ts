import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

// 導入要測試的函數
import { generateInitializerCode } from '../extension';

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
            var test = new TestClass() {
            }
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
        const position = new vscode.Position(17, 35); // new TestClass() { 的位置
        editor.selection = new vscode.Selection(position, position);

        // 執行命令
        await vscode.commands.executeCommand('csharp-member-initializer.initializeMembers');

        // 等待一下讓變更生效
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 驗證結果
        const text = document.getText();
        assert.ok(text.includes('Name = ,'));
        assert.ok(text.includes('Age = ,'));
        assert.ok(text.includes('Items = ,'));
        
        // 驗證格式
        const lines = text.split('\n');
        const memberLines = lines.filter(line => line.includes(' = '));
        assert.ok(memberLines.every(line => line.trim().endsWith(' = ,')), 'Each member should end with = ,');
        assert.ok(memberLines.every(line => line.startsWith('    ')), 'Each member line should have correct indentation');
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

    test('Code Generation Format Test', () => {
        const members = ['Name', 'Age', 'Items'];
        const code = generateInitializerCode(members);
        
        // 驗證生成的程式碼格式
        const lines = code.split('\n');
        assert.strictEqual(lines.length, members.length + 2, 'Should include opening and closing braces');
        assert.ok(code.includes('{'), 'Should contain opening brace');
        assert.ok(code.includes('}'), 'Should contain closing brace');
        
        // 验证每个成员的格式
        const memberLines = lines.filter(line => line.includes(' = '));
        assert.strictEqual(memberLines.length, members.length, 'Should have correct number of member lines');
        
        memberLines.forEach((line, index) => {
            const trimmedLine = line.trim();
            assert.ok(trimmedLine.startsWith(members[index]), `Should contain member ${members[index]}`);
            assert.ok(trimmedLine.endsWith(' = ,'), 'Each line should end with = ,');
            assert.ok(line.startsWith('    '), 'Each member line should have correct indentation');
        });
    });

    test('Symbol Provider Test', async () => {
        // 创建测试文件
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
}`;

        // 创建临时文件并保存到工作区
        const tempFile = await vscode.workspace.openTextDocument({
            language: 'csharp',
            content: testContent
        });
        await tempFile.save();

        // 打开文件
        await vscode.window.showTextDocument(tempFile);

        // 等待 Symbol Provider 处理
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 测试 DocumentSymbolProvider
        const memberSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            tempFile.uri
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

        // 测试 WorkspaceSymbolProvider
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
    });
}); 