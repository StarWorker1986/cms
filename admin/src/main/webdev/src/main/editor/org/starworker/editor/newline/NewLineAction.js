import Option from "../util/Option";
import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";
import Settings from "../Settings";
import NewLineUtils from "./NewLineUtils";

export default class NewLineAction {
    static getAction(editor, evt) {
        let match = this.__match,
            canInsertIntoEditableRoot = this.__canInsertIntoEditableRoot,
            isBrMode = this.__isBrMode,
            inListBlock = this.__inListBlock,
            hasShiftKey = (editor, shiftKey) => shiftKey,
            shouldBlockNewLine = (editor, shiftKey) => this.__shouldBlockNewLine(editor),
            inSummaryBlock = () => this.__inBlock("summary", true),
            inPreBlock = (requiredState) => this.__inBlock("pre", requiredState),
            inBrContext = (editor, shiftKey) => this.__shouldInsertBr(editor),
            newLineAction = Tools.generate([
                { br: [] },
                { block: [] },
                { none: [] }
            ]);

        return Tools.evaluateUntil([
            match([shouldBlockNewLine], newLineAction.none()),
            match([inSummaryBlock()], newLineAction.br()),
            match([inPreBlock(true), shouldPutBrInPre(false), hasShiftKey], newLineAction.br()),
            match([inPreBlock(true), shouldPutBrInPre(false)], newLineAction.block()),
            match([inPreBlock(true), shouldPutBrInPre(true), hasShiftKey], newLineAction.block()),
            match([inPreBlock(true), shouldPutBrInPre(true)], newLineAction.br()),
            match([inListBlock(true), hasShiftKey], newLineAction.br()),
            match([inListBlock(true)], newLineAction.block()),
            match([isBrMode(true), hasShiftKey, canInsertIntoEditableRoot], newLineAction.block()),
            match([isBrMode(true)], newLineAction.br()),
            match([inBrContext], newLineAction.br()),
            match([isBrMode(false), hasShiftKey], newLineAction.br()),
            match([canInsertIntoEditableRoot], newLineAction.block())
        ], [editor, !!(evt && evt.shiftKey)]).getOr(newLineAction.none());
    }

    static __canInsertIntoEditableRoot(editor) {
        let forcedRootBlock = Settings.getForcedRootBlock(editor),
            rootEditable = NewLineUtils.getEditableRoot(editor.dom, editor.selection.getStart());
        return rootEditable && editor.schema.isValidChild(rootEditable.nodeName, forcedRootBlock ? forcedRootBlock : 'P');
    }

    static __inBlock(blockName, requiredState) {
        return (editor, shiftKey) => {
            let state = NewLineUtils.getParentBlockName(editor) === blockName.toUpperCase();
            return state === requiredState;
        };
    }

    static __inListBlock(requiredState) {
        return (editor, shiftKey) => NewLineUtils.isListItemParentBlock(editor) === requiredState;
    }

    static __isBrMode(requiredState) {
        return (editor, shiftKey) => {
            let brMode = Settings.getForcedRootBlock(editor) === '';
            return brMode === requiredState;
        };
    }

    static __match(predicates, action) {
        return (editor, shiftKey) => {
            let isMatch = Tools.foldl(predicates, (res, p) => res && p(editor, shiftKey), true);
            return isMatch ? Option.some(action) : Option.none();
        };
    }

    static __matchesSelector(editor, selector) {
        return NewLineUtils.getParentBlock(editor).filter((parentBlock) => {
            return selector.length > 0 && DOMUtils.is(DOMUtils.fromDom(parentBlock), selector);
        }).isSome();
    }

    static __shouldInsertBr(editor) {
        return this.__matchesSelector(editor, Settings.getBrNewLineSelector(editor));
    }

    static __shouldBlockNewLine(editor) {
        return this.__matchesSelector(editor, Settings.getNoNewLineSelector(editor));
    }
}