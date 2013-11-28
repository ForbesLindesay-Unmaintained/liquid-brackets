define(function (require, exports, module) {
  'use strict';

  var LanguageManager = brackets.getModule("language/LanguageManager");

  // Include `overlayMode` code mirror plugin
  if (!CodeMirror.overlayMode) {
    CodeMirror.overlayMode = function(base, overlay, combine) {
      return {
        startState: function() {
          return {
            base: CodeMirror.startState(base),
            overlay: CodeMirror.startState(overlay),
            basePos: 0, baseCur: null,
            overlayPos: 0, overlayCur: null
          };
        },
        copyState: function(state) {
          return {
            base: CodeMirror.copyState(base, state.base),
            overlay: CodeMirror.copyState(overlay, state.overlay),
            basePos: state.basePos, baseCur: null,
            overlayPos: state.overlayPos, overlayCur: null
          };
        },

        token: function(stream, state) {
          if (stream.start == state.basePos) {
            state.baseCur = base.token(stream, state.base);
            state.basePos = stream.pos;
          }
          if (stream.start == state.overlayPos) {
            stream.pos = stream.start;
            state.overlayCur = overlay.token(stream, state.overlay);
            state.overlayPos = stream.pos;
          }
          stream.pos = Math.min(state.basePos, state.overlayPos);
          if (stream.eol()) state.basePos = state.overlayPos = 0;

          if (state.overlayCur == null) return state.baseCur;
          if (state.baseCur != null && combine) return state.baseCur + " " + state.overlayCur;
          else return state.overlayCur;
        },

        indent: base.indent && function(state, textAfter) {
          return base.indent(state.base, textAfter);
        },
        electricChars: base.electricChars,

        innerMode: function(state) { return {state: state.base, mode: base}; },

        blankLine: function(state) {
          if (base.blankLine) base.blankLine(state.base);
          if (overlay.blankLine) overlay.blankLine(state.overlay);
        }
      };
    };
  }

  CodeMirror.defineMode("liquid", function(config, parserConfig) {
    var mustacheOverlay = {
      token: function(stream, state) {
        var ch;
        if (stream.match("{%")) {
          while ((ch = stream.next()) != null)
            if (ch == "%" && stream.next() == "}") break;
          stream.eat("%");
          return "def";
        }
        if (stream.match("{{")) {
          while ((ch = stream.next()) != null)
            if (ch == "}" && stream.next() == "}") break;
          stream.eat("}");
          return "def";
        }
        while (stream.next() != null && !stream.match("{%", false) && !stream.match("{{", false)) {}
        return null;
      }
    };
    return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || "text/html"), mustacheOverlay);
  });

  LanguageManager.defineLanguage("liquid", {
      "name": "liquid",
      "mode": "liquid",
      "fileExtensions": ["liquid"],
      "blockComment": ["<!--", "-->"]
  });
});