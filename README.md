## Calva Extras

Makes paredit easy.

### Install

```bash
sudo npm install -g vsce
npm build
vsce package
code --install-extension calva-extras-0.0.1.vsix
```

### Usage

* `calva-extras.killToClipboard` the one true sexp command:
  * Operates on sexps after cursor.
  * Deletes (but overwrites clipbord).
  * Cuts.
  * Copies (extra undo needed!).
* `calva-extras.killSpaceBackward` command aka "the new backspace":
  * kills mutiple spaces and stops directy in the end position
  * no more delete "space by space" timewaste

Recommended bindings:

```json
  {
    "key": "alt+d",
    "command": "calva-extras.killToClipboard",
    "when": "calva:keybindingsEnabled && editorTextFocus && editorLangId == 'clojure' && paredit:keyMap =~ /original|strict/"
  },
  {
    "key": "backspace",
    "command": "calva-extras.killSpaceBackward",
    "when": "calva:keybindingsEnabled && editorTextFocus && editorLangId == 'clojure' && paredit:keyMap =~ /original|strict/"
  }
```

### License

Copyright © 2019 clyfe
Distributed under the MIT license.
