QUnit.module("editor.caret.CaretFinderTest", function () {
    const setupHtml = (html) => {
        $("#view").html(html);
    };

    const getRoot = () => {
        return document.getElementById("view");
    };

    const follow = (ancestor, descendantPath) => {
        if (descendantPath.length === 0) {
            return ancestor;
        }
        else {
            let child = ancestor;
            for (let i = 0; i < descendantPath.length; i++) {
                child = child.childNodes[descendantPath[i]];
            }
            return child;
        }
    };

    const createFromPosition = (path, offset) => {
        let container = follow(getRoot(), path);
        return new CaretPosition(container, offset);
    };

    const fromPosition = (pos, forward) => {
        return CaretFinder.fromPosition(forward, getRoot(), pos);
    };

    const navigate = (pos, forward) => {
        return CaretFinder.navigate(forward, getRoot(), pos);
    };

    const positionIn = (forward, path) => {
        let element = follow(getRoot(), path);
        return CaretFinder.positionIn(forward, element);
    };

    const assertCaretPosition = (assert, posOption, path, expectedOffset) => {
        let pos = posOption.getOrDie(), expectedContainer = follow(getRoot(), path);
        assert.equal(pos.container, expectedContainer);
        assert.equal(pos.offset, expectedOffset);
    };

    const assertNone = (assert, posOption) => {
        assert.strictEqual(posOption.isNone(), true);
    };

    QUnit.test("fromPosition", function (assert) {
        setupHtml('<p>a</p>');
        let pos = createFromPosition([], 0), posOption = fromPosition(pos, true);
        assertCaretPosition(assert, posOption, [0, 0], 0);

        pos = createFromPosition([], 1);
        posOption = fromPosition(pos, false);
        assertCaretPosition(assert, posOption, [0, 0], 1);

        pos = createFromPosition([0, 0], 0);
        posOption = fromPosition(pos, true);
        assertCaretPosition(assert, posOption, [0, 0], 1)

        pos = createFromPosition([0, 0], 1);
        posOption = fromPosition(pos, false);
        assertCaretPosition(assert, posOption, [0, 0], 0);

        setupHtml('');
        pos = createFromPosition([], 0);
        posOption = fromPosition(false);
        assertNone(assert, posOption);
    });

    QUnit.test("navigate", function (assert) {
        setupHtml('<p>a<b>b</b></p>');
        let pos = createFromPosition([0, 0], 1), posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [0, 1, 0], 1);

        setupHtml('<p><b>a</b><b>b</b></p>');
        pos = createFromPosition([0, 0, 0], 1);
        posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [0, 1, 0], 1);

        setupHtml('<p>a<b><input></b></p>');
        pos = createFromPosition([0, 0], 1);
        posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [0, 1], 1);

        setupHtml('<p><input><b><input></b></p>');
        pos = createFromPosition([0], 1);
        posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [0, 1], 1);

        setupHtml('<p><b><input></b><b><input></b></p>');
        pos = createFromPosition([0, 0], 1);
        posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [0, 1], 1);

        setupHtml('<p><input><b>a</b></p>');
        pos = createFromPosition([0], 1);
        posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [0, 1, 0], 1);

        setupHtml('<p><input></p>');
        pos = createFromPosition([0], 0);
        posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [0], 1);

        setupHtml('<p><input><input></p>');
        pos = createFromPosition([0], 0);
        posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [0], 1);

        pos = createFromPosition([0], 1);
        posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [0], 2);

        setupHtml('<p><input><input><input></p>');
        pos = createFromPosition([0], 1);
        posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [0], 2);

        setupHtml('<p>a<br><span contenteditable="false">b</span></p>');
        pos = createFromPosition([0, 0], 1);
        posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [0], 2);

        setupHtml('<p>a<br>b</p>');
        pos = createFromPosition([0, 0], 1);
        posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [0, 2], 0);

        setupHtml('<p><input><br>b</p>');
        pos = createFromPosition([0], 1);
        posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [0, 2], 0);

        setupHtml('<p>a</p><p>b</p>');
        pos = createFromPosition([0, 0], 1);
        posOption = navigate(pos, true);
        assertCaretPosition(assert, posOption, [1, 0], 0);

        setupHtml('');
        pos = createFromPosition([], 0);
        posOption = navigate(pos, true);
        assertNone(assert, posOption);

        setupHtml('<p>a</p>');
        pos = createFromPosition([0, 0], 1);
        posOption = navigate(pos, true);
        assertNone(assert, posOption);

        setupHtml('<p><input></p>');
        pos = createFromPosition([0], 1);
        posOption = navigate(pos, true);
        assertNone(assert, posOption);

        setupHtml('<p><b>a</b>b</p>');
        pos = createFromPosition([0, 1], 0);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0, 0, 0], 0);

        setupHtml('<p><b>a</b><b>b</b></p>');
        pos = createFromPosition([0, 1, 0], 0);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0, 0, 0], 0);

        setupHtml('<p><b><input></b>b</p>');
        pos = createFromPosition([0, 1], 0);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0, 0], 0);

        setupHtml('<p><b><input></b><input></p>');
        pos = createFromPosition([0], 1);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0, 0], 0);

        setupHtml('<p><b><input></b><b><input></b></p>');
        pos = createFromPosition([0, 1], 0);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0, 0], 0);

        setupHtml('<p><b>a</b><input></p>');
        pos = createFromPosition([0], 1);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0, 0, 0], 0);

        setupHtml('<p><input></p>');
        pos = createFromPosition([0], 1);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0], 0);

        setupHtml('<p><input><input></p>');
        pos = createFromPosition([0], 2);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0], 1);

        pos = createFromPosition([0], 1);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0], 0);

        setupHtml('<p><input><input><input></p>');
        pos = createFromPosition([0], 2);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0], 1);

        setupHtml('<p>a<br>b</p>');
        pos = createFromPosition([0, 2], 0);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0, 0], 1);

        setupHtml('<p>a<br><input></p>');
        pos = createFromPosition([0], 2);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0], 1);

        setupHtml('<p>a</p><p>b</p>');
        pos = createFromPosition([1, 0], 0);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0, 0], 1);

        setupHtml('');
        pos = createFromPosition([], 0);
        posOption = navigate(pos, false);
        assertNone(assert, posOption);

        setupHtml('<p>a</p>');
        pos = createFromPosition([0, 0], 0);
        posOption = navigate(pos, false);
        assertNone(assert, posOption);

        setupHtml('<p><input></p>');
        pos = createFromPosition([0], 0);
        posOption = navigate(pos, false);
        assertNone(assert, posOption);

        setupHtml([
            '<p>1</p>',
            '<p data-mce-bogus="all"></p>',
            '<p>2</p>'
        ].join(''));
        pos = createFromPosition([], 2);
        posOption = navigate(pos, false);
        assertCaretPosition(assert, posOption, [0, 0], 1);
    });

    QUnit.test("positionIn", function (assert) {
        setupHtml('<p>a</p>');
        let posOption = positionIn(true, [0]);
        assertCaretPosition(assert, posOption, [0, 0], 0);

        posOption = positionIn(false, [0]);
        assertCaretPosition(assert, posOption, [0, 0], 1);

        setupHtml('<p><input></p>');
        posOption = positionIn(true, [0]);
        assertCaretPosition(assert, posOption, [0], 0);

        posOption = positionIn(false, [0]);
        assertCaretPosition(assert, posOption, [0], 1);

        setupHtml('<p><input><br></p>');
        posOption = positionIn(false, [0]);
        assertCaretPosition(assert, posOption, [0], 1);

        setupHtml('<p><b><input></b></p>');
        posOption = positionIn(true, [0]);
        assertCaretPosition(assert, posOption, [0, 0], 0);

        posOption = positionIn(false, [0]);
        assertCaretPosition(assert, posOption, [0, 0], 1);

        setupHtml('<p></p>');
        posOption = positionIn(true, [0]);
        assertNone(assert, posOption);

        posOption = positionIn(false, [0]);
        assertNone(assert, posOption);

        setupHtml('<p>a</p><p></p><p>b</p>');
        posOption = positionIn(false, [1]);
        assertNone(assert, posOption);

        posOption = positionIn(true, [1]);
        assertNone(assert, posOption);

        setupHtml('<p><!-- a-->b<!-- c --></p>');
        posOption = positionIn(false, []);
        assertCaretPosition(assert, posOption, [0, 1], 1);

        posOption = positionIn(true, []);
        assertCaretPosition(assert, posOption, [0, 1], 0);
    });
});