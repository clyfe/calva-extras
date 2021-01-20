import {
  window,
  extensions,
  commands,
  ExtensionContext,
  TextEditor,
  TextDocument,
  Position,
  Range
} from 'vscode';

const {
  executeCommand,
  registerCommand
} = commands;

// The one true sexp command:
// * Operates on sexp(s) after cursor.
// * Deletes (but overwrites clipbord).
// * Cuts.
// * Copies (extra Ctrl-Z needed!).
async function killToClipboard() {
  const activeTextEditor: TextEditor = window.activeTextEditor!;

  await executeCommand("paredit.selectCloseList");
  if (activeTextEditor.selection.isEmpty) {
    await executeCommand("paredit.selectForwardSexp");
  }
  if (!activeTextEditor.selection.isEmpty) {
    await executeCommand("editor.action.clipboardCutAction");
  }
}

// Saves backspace keystrokes by moving the form directly in the end/formatted
// place when deleting long-whitespace. Long-whitespace is more than one space
// at the immediate left of the cursor.
//
// A backspace keystroke can do 2 things on long-whitespace:
// 1. Format current line.
// 2. Move current line at the end of the previous one, and format that one.
//
// 1 - happens when:
// * all we have to the left are spaces untill line start, and
// * the formatted line is shorter than the original line.
// 2 - happens when: to the left are not just spaces.
async function killSpaceBackward() {
  const activeTextEditor: TextEditor = window.activeTextEditor!;
  const active: Position = activeTextEditor.selection.active;
  const document: TextDocument = activeTextEditor.document;
  const spaces: Range | undefined =
    document.getWordRangeAtPosition(active, /\s+/);
  const allSpacesToLeft: boolean = (spaces !== undefined) &&
    (spaces.start.character === 0);

  // When text is selected we backspace normally.
  if (!activeTextEditor.selection.isEmpty) {
    return executeCommand("paredit.deleteBackward");
  }

  // We are in between sexps on this line.
  if (!allSpacesToLeft) {
    const multipleSpaces: boolean = (spaces !== undefined) &&
      (1 < (spaces.end.character - spaces.start.character));
    // Shrink multiple spaces or backspace normally.
    if (multipleSpaces) {
      activeTextEditor.edit((editBuilder) => {
        editBuilder.replace(spaces!, " ");
      });
    } else {
      executeCommand("paredit.deleteBackward");
    }
    return;
  }

  const lineLen: number = document.lineAt(active.line).text.length;
  await executeCommand("calva-fmt.formatCurrentForm");
  const formattedLineLen: number = document.lineAt(active.line).text.length;
  const formattedShorter: boolean = formattedLineLen < lineLen;

  // Too many spaces, remove some and align.
  if (formattedShorter) { return; }

  // Aligned or too few spaces, move at upper line end (if any).
  let range: Range = spaces!;
  const line: number = active.line;
  if (0 < line) {
    let textLen: number = document.lineAt(line - 1).text.length;
    const positionUp: Position = active.with(line - 1, textLen - 1);
    const spacesUp: Range | undefined =
      document.getWordRangeAtPosition(positionUp, /\s+/);
    // Add the spaces or the newline to the range.
    if (spacesUp !== undefined) { range = range.union(spacesUp); }
    else { range = range.with(active.with(line - 1, textLen)); }
  }
  await activeTextEditor.edit((editBuilder) => {
    editBuilder.replace(range, " ");
  });
  executeCommand("calva-fmt.formatCurrentForm");
};

export function activate(context: ExtensionContext) {
  const sub = context.subscriptions;
  const reg = registerCommand;
  sub.push(reg('calva-extras.killToClipboard', killToClipboard));
  sub.push(reg('calva-extras.killSpaceBackward', killSpaceBackward));
}
