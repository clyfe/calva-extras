## Calva Extras

Makes paredit easy.

### Install

```bash
sudo npm install -g vsce
vsce package
code --install-extension calva-extras-0.0.1.vsix
```

### Usage

* `killToClipboard` the one true sexp command:
  * Operates on sexps after cursor.
  * Deletes (but overwrites clipbord).
  * Cuts.
  * Copies (extra undo needed!).
* `killSpaceBackward` aka "the new backspace":
  * kills mutiple spaces and takes stops directy in the end position
  * no more delete spaces by space timewaste

### License

Copyright © 2019 clyfe
Distributed under the MIT license.
