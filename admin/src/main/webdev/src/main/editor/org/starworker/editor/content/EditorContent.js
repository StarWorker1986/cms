import GetContent from "./GetContent";
import SetContent from "./SetContent";

export default class EditorContent {
    static setContent(editor, content, args) {
        return SetContent.setContent(editor, content, args);
    }

    static getContent(editor, args) {
        return GetContent.getContent(editor, args);
    }
}
