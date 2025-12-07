#!/bin/bash
# Open The Mirror Virtual Platform in VS Code

echo "🪞 Opening The Mirror Virtual Platform in VS Code..."
echo ""

# Check if code command exists
if ! command -v code &> /dev/null; then
    echo "❌ VS Code 'code' command not found."
    echo ""
    echo "Please install VS Code or add it to your PATH:"
    echo "  - Download from: https://code.visualstudio.com/"
    echo "  - Or install via package manager"
    echo ""
    echo "Then open manually:"
    echo "  File → Open Folder → /home/user/mirror-virtual-platform/"
    exit 1
fi

# Open the project
code /home/user/mirror-virtual-platform

echo "✅ Project opened in VS Code!"
echo ""
echo "📚 Next steps:"
echo "  1. Read VSCODE_SETUP.md for complete setup instructions"
echo "  2. Copy .env.example to .env and add your API keys"
echo "  3. Install dependencies (see VSCODE_SETUP.md)"
echo "  4. Set up Supabase database (run migrations)"
echo "  5. Run the full stack (3 terminals)"
echo ""
echo "Built with reflection. Powered by MirrorCore. 🪞"
