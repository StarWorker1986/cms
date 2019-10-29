var viewElm, nodes, reverseNodes;

const compareNodeLists = (expectedNodes, actutalNodes) => {
    if (expectedNodes.length !== actutalNodes.length) {
        return false;
    }
    for (let i = 0; i < expectedNodes.length; i++) {
        if (expectedNodes[i] !== actutalNodes[i]) {
            return false;
        }
    }
    return true;
}

QUnit.module("editor.dom.TreeWalker", {
    beforeEach: function () {
        function all(node, reverse) {
            let list = [node];
            if (node.hasChildNodes()) {
                for (let i = 0; i < node.childNodes.length; i++) {
                    list = list.concat(all(node.childNodes[i]));
                }
            }
            return list;
        }

        $("#view").html('1<ul><li>2<ul><li>3</li><li>4</li></ul></li><li>5<ul><li>6</li><li>7</li></ul></li></ul>8');
        viewElm = document.getElementById("view");
        nodes = all(viewElm).slice(1);
    },

    afterEach: function () {
        viewElm = nodes = reverseNodes = null;
    }
});

QUnit.test("next", function (assert) {
    let walker = new TreeWalker(nodes[0], viewElm),
        actualNodes = [walker.current()];

    while ((walker.next())) {
        actualNodes.push(walker.current());
    }

    assert.equal(compareNodeLists(nodes, actualNodes), true, "Should be the same");
});

QUnit.test("prev2", function (assert) {
    let walker = new TreeWalker(nodes[nodes.length - 1], viewElm),
        actualNodes = [walker.current()];

    while ((walker.prev2())) {
        actualNodes.push(walker.current());
    }

    actualNodes = actualNodes.reverse();
    assert.equal(compareNodeLists(nodes, actualNodes), true, "Should be the same");
});

QUnit.test("prev2(shallow:true)", function (assert) {
    let walker = new TreeWalker(nodes[nodes.length - 1], viewElm),
        actualNodes = [walker.current()];

    while ((walker.prev2(true))) {
        actualNodes.push(walker.current());
    }

    actualNodes = actualNodes.reverse();
    assert.equal(compareNodeLists(viewElm.childNodes, actualNodes), true, "Should be the same");
});