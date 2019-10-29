QUnit.module("editor/dom/NodeTypeTest", () => {
    QUnit.test("isText/isElement/isComment", (assert) => {
        assert.strictEqual(NodeType.isText(document.createTextNode('x')), true);
        assert.strictEqual(NodeType.isText(null), false);
        assert.strictEqual(NodeType.isText(document.createElement('div')), false);
        assert.strictEqual(NodeType.isText(document.createComment('x')), false);
        assert.strictEqual(NodeType.isElement(document.createElement('div')), true);
        assert.strictEqual(NodeType.isElement(null), false);
        assert.strictEqual(NodeType.isElement(document.createTextNode('x')), false);
        assert.strictEqual(NodeType.isElement(document.createComment('x')), false);
        assert.strictEqual(NodeType.isComment(document.createComment('x')), true);
        assert.strictEqual(NodeType.isComment(null), false);
        assert.strictEqual(NodeType.isComment(document.createTextNode('x')), false);
        assert.strictEqual(NodeType.isComment(document.createElement('div')), false);
    });
    
    QUnit.test("isBr", (assert) => {
        assert.strictEqual(NodeType.isBr(null), false);
        assert.strictEqual(NodeType.isBr(document.createTextNode('x')), false);
        assert.strictEqual(NodeType.isBr(document.createElement('br')), true);
        assert.strictEqual(NodeType.isBr(document.createComment('x')), false);
    });
    
    QUnit.test("matchNodeNames", (assert) => {
        let matchNodeNames = NodeType.matchNodeNames("a div #text");
        assert.strictEqual(matchNodeNames(null), false);
        assert.strictEqual(matchNodeNames(document.createTextNode('x')), true);
        assert.strictEqual(matchNodeNames(document.createElement('a')), true);
        assert.strictEqual(matchNodeNames(document.createElement('div')), true);
        assert.strictEqual(matchNodeNames(document.createElement('b')), false);
    });
    
    QUnit.test("matchStyleValues", (assert) => {
        let matchStyleValues = NodeType.matchStyleValues("margin-left", "10px 20px 30px");
        assert.strictEqual(matchStyleValues(null), false);
    
        let node = $('<div id="div1" style="margin-left:10px"></div>')[0];
        $(node).appendTo(document.body);
        assert.strictEqual(matchStyleValues(node), true);
    
        node = $('<div style="margin-left:20px"></div>')[0];
        $(node).appendTo(document.body);
        assert.strictEqual(matchStyleValues(node), true);
    
        node = $('<div style="margin-left:30px"></div>')[0];
        $(node).appendTo(document.body);
        assert.strictEqual(matchStyleValues(node), true);
    
        node = $('<div style="margin-left:40px"></div>')[0];
        $(node).appendTo(document.body);
        assert.strictEqual(matchStyleValues(node), false);
    });
    
    QUnit.test("hasPropValue", (assert) => {
        let hasTabIndex3 = NodeType.hasPropValue("tabIndex", 3);
        assert.strictEqual(hasTabIndex3(null), false);
        assert.strictEqual(hasTabIndex3($('<div tabIndex="3"></div>')[0]), true);
        assert.strictEqual(hasTabIndex3(document.createElement('div')), false);
        assert.strictEqual(hasTabIndex3(document.createElement('b')), false);
    });
    
    QUnit.test("isBogus", (assert) => {
        assert.strictEqual(NodeType.isBogus($('<div data-editor-bogus="1"></div>')[0]), true);
        assert.strictEqual(NodeType.isBogus($('<div data-editor-bogus="all"></div>')[0]), true);
        assert.strictEqual(NodeType.isBogus($('<div></div>')[0]), false);
        assert.strictEqual(NodeType.isBogus(document.createTextNode('test')), false);
        assert.strictEqual(NodeType.isBogus(null), false);
    });
    
    QUnit.test("isBogusAll", (assert) => {
        assert.strictEqual(NodeType.isBogusAll($('<div data-editor-bogus="1"></div>')[0]), false);
        assert.strictEqual(NodeType.isBogusAll($('<div data-editor-bogus="all"></div>')[0]), true);
        assert.strictEqual(NodeType.isBogusAll($('<div></div>')[0]), false);
        assert.strictEqual(NodeType.isBogusAll(document.createTextNode('test')), false);
        assert.strictEqual(NodeType.isBogusAll(null), false);
    });
    
    QUnit.test("hasAttribute", (assert) => {
        assert.strictEqual(NodeType.hasAttribute('x')($('<div x="1"></div>')[0]), true);
        assert.strictEqual(NodeType.hasAttribute('y')($('<div x="1"></div>')[0]), false);
    });
    
    QUnit.test("isTable", (assert) => {
        assert.strictEqual(NodeType.isTable($('<table><tr><td></td></tr></table>')[0]), true);
        assert.strictEqual(NodeType.isTable($('<div></div>')[0]), false);
        assert.strictEqual(NodeType.isTable(document.createTextNode('test')), false);
        assert.strictEqual(NodeType.isTable(null), false);
    });
});