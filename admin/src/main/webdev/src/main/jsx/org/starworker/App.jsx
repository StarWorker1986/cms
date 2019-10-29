requirejs.config({
    baseUrl: "../../js/org/starworker",
    paths: {
        "util/Env": "util/Env",
        "util/ObjectUtil": "util/ObjectUtil",
        "util/Stream": "util/Stream",
        "util/Delay": "util/Delay",
        "util/EventUtil": "util/EventUtil",

        "layout/components/LayoutRow": "layout/components/LayoutRow.min",
        "layout/components/Layout": "layout/components/Layout.min",
        "layout/Dashboard": "layout/Dashboard.min",

        "editor/dom/NodeType": "editor/dom/NodeType.min",
        "editor/caret/CaretPosition": "editor/caret/CaretPosition.min",
        "editor/caret/CaretCandidate": "editor/caret/CaretCandidate.min"
    }
});