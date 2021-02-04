import {
  window,
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
  const line: number = active.line;
  const character: number = active.character;
  const document: TextDocument = activeTextEditor.document;
  const lineLen: number = document.lineAt(line).text.length;
  const spaces: Range | undefined =
    document.getWordRangeAtPosition(active, /\s+/);
  const allSpacesToLeft: boolean = (character === 0) ||
   ((spaces !== undefined) && (spaces.start.character === 0));

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
    return true;
  }

  if (line === 0) {
    if(spaces != undefined) {
      activeTextEditor.edit((editBuilder) => {
        editBuilder.delete(spaces);
      });
    }
    return true;
  }

  // WARNING: Strange heuristics ahead. We work with what we have...

  // If we're at line start, only deletetion is meaningful.
  // Don't format such subsequent deletition won't fil
  if (character !== 0) {
    await executeCommand("calva-fmt.formatCurrentForm");
  }

  // If too many spaces, formt removed some and aligned.
  // Normally we'd return in that case, but we can't tell.
  // We just assume that was not the case, can continue with the other branch.
  // If it was the case, the ops that follow will just fail.

  // Aligned or too few spaces, move at upper line end (if any).
  // TODO: when blank lines contain spaces, have to backspace twice; meh.
  let range: Range = spaces ? spaces : new Range(active, active);
  const whiteSpace = /^\s*$/;
  const space = / +$/;
  let lineUp: number = line - 1;
  let hadSpace = space.test(document.lineAt(lineUp).text);
  while (0 < lineUp && whiteSpace.test(document.lineAt(lineUp).text)) {
    lineUp--;
    hadSpace = hadSpace || space.test(document.lineAt(lineUp).text);
  }
  if (0 <= lineUp) {
    let textUpLen: number = document.lineAt(lineUp).text.length;
    const positionUp: Position = active.with(lineUp, textUpLen);
    range = range.with(positionUp);
    const spacesUp: Range | undefined =
      document.getWordRangeAtPosition(positionUp, /\s+/);
    // Add the spaces or the newline to the range.
    if (spacesUp !== undefined) { range = range.union(spacesUp); }
  }
  function edit() : Thenable<boolean> {
    return activeTextEditor.edit((editBuilder) => {
      if (lineUp === 0) {
        editBuilder.delete(range);
      } else {
        editBuilder.replace(range, " ");
      }
    });
  }
  let tries: number = 2;
  let done: boolean = false
  do {
    if(lineLen != document.lineAt(active.line).text.length) {
      break;
    }
    done = await edit();
    tries--;
  } while(tries > 0 && !done && hadSpace);
  executeCommand("calva-fmt.formatCurrentForm");
};

const parenPair = new Set(["()", "[]", "{}", '""']);

// Backspace replacement that deletes forms and spaces separately.
// Example:
//   - " (|)" + backspace now yields " " instead "";
//   - 2nd backspace needed to delete the space too.
async function backspacePositional() {
  const activeTextEditor: TextEditor = window.activeTextEditor!;
  const active: Position = activeTextEditor.selection.active;
  const document: TextDocument = activeTextEditor.document;

  if (active.character === 0) {
    executeCommand("calva-extras.killSpaceBackward");
    return;
  }

  const range0: Range = new Range(active.translate(0, -1), active.translate(0, 1));
  const range: Range = document.validateRange(range0);
  const neighbours: string = document.getText(range);

  if(parenPair.has(neighbours)) {
    activeTextEditor.edit((editBuilder) => {
      editBuilder.delete(range);
    });
  } else {
    executeCommand("calva-extras.killSpaceBackward");
  }
}

export function activate(context: ExtensionContext) {
  const sub = context.subscriptions;
  const reg = registerCommand;
  sub.push(reg('calva-extras.killToClipboard', killToClipboard));
  sub.push(reg('calva-extras.killSpaceBackward', killSpaceBackward));
  sub.push(reg('calva-extras.backspacePositional', backspacePositional));
}
