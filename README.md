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

* `calva-extras.killToClipboard` the one true sexp command `Alt+d`:
  * Operates on sexps after cursor.
  * Deletes (but overwrites clipbord).
  * Cuts.
  * Copies (extra undo needed!).
* `calva-extras.killSpaceBackward` aka "the new `backspace`":
  * Kills mutiple spaces and stops directy in the end position.
  * No more delete "space by space" timewaste.
* `calva-extras.backspacePositional` aka "the new new `backspace`":
  * Deletes forms and spaces separately.
  * " (|)" + backspace now yields " " instead "" directly.
  * 2nd backspace needed to delete the space too

Recommended bindings: see `contributes.keybindings` in `package.json`.  
If there are conflicting keybindings, set them manually in user config.

### License

Copyright © 2019 clyfe
Distributed under the MIT license.
