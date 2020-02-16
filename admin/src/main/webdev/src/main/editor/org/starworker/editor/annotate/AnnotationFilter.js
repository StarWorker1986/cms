import Option from "../util/Option";
import Tools from "../util/Tools";
import Markings from "./Markings";

export default class AnnotationFilter {
    static setup(editor, registry) {
        editor.on("init", () => {
            editor.serializer.addNodeFilter("span", (spans) => {
                Tools.each(spans, (span) => {
                    this.__identifyParserNode(span, registry).each((settings) => {
                        if (settings.persistent === false) {
                            span.unwrap();
                        }
                    });
                });
            });
        });
    }

    static __identifyParserNode(span, registry) {
        let optAnnotation = Option.from(span.attributes.map[Markings.dataAnnotation()]);
        return optAnnotation.bind(registry.lookup);
    }
}