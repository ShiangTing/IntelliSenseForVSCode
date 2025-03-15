# C# Member Initializer for Visual Studio Code

A Visual Studio Code extension that automatically initializes C# class members, providing functionality similar to JetBrains Rider's member initialization feature.

## Features

- Automatically initializes all members (properties and fields) of a C# class
- Matches Visual Studio's default formatting style
- Integrates with VS Code's context menu
- Supports both object initialization and property initialization syntax

## How to Use

1. Place your cursor on a line containing `new ClassName()`
2. Either:
   - Right-click and select "Initialize Members" from the context menu
   - Use the command palette (Ctrl+Shift+P) and search for "Initialize Members"
3. The extension will automatically add all class members with proper initialization syntax

Example:
```csharp
// Before
var person = new Person() {
}

// After
var person = new Person() {
    Name = ,
    Age = ,
    Address = ,
}
```

## Requirements

- Visual Studio Code 1.85.0 or higher
- C# extension for Visual Studio Code (ms-dotnettools.csharp)

## Installation

1. Install from VS Code Marketplace
2. Or download and install the VSIX package manually

## Known Issues

- Currently only supports basic member initialization
- Does not handle nested class initialization
- Does not modify existing member initializations

## Release Notes

### 0.0.1
- Initial release
- Basic member initialization support
- Context menu integration
- VS Code command palette support

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests on our [GitHub repository](https://github.com/ShiangTing/RiderIntelliSenseForVSCode).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.