import Option from "../util/Option";
import Tools from "../util/Tools";
import CaretFinder from "../caret/CaretFinder";
import CaretUtils from "../caret/CaretUtils";
import InlineUtils from "./InlineUtils";
import FormatContainer from "../fmt/FormatContainer";

export default class BoundaryLocation {
    static findLocation(forward, isInlineTarget, rootNode, pos) {
        let from = InlineUtils.normalizePosition(forward, pos),
            fromLocation = this.readLocation(isInlineTarget, rootNode, from);
        return this.readLocation(isInlineTarget, rootNode, from)
                   .bind((location) => this.__findLocationSimple(forward, location))
                   .orThunk(() => this.__findLocationTraverse(forward, isInlineTarget, rootNode, fromLocation, pos));
    }

    static getElement(location) {
        return location.fold(
            (x) => x, // Before
            (x) => x, // Start
            (x) => x, // End
            (x) => x // After
        );
    }

    static inside(location) {
        let _location = this.__location;
        return location.fold(
            _location.start, // Before
            _location.start, // Start
            _location.end, // End
            _location.end // After
        );
    }

    static nextLocation() {
        return this.findLocation(true, isInlineTarget, rootNode, pos);
    }

    static outside(location) {
        let _location = this.__location;
        return location.fold(
            _location.before, // Before
            _location.before, // Start
            _location.after, // End
            _location.after // After
        );
    }

    static prevLocation(isInlineTarget, rootNode, pos) {
        return this.findLocation(false, isInlineTarget, rootNode, pos);
    }

    static readLocation(isInlineTarget, rootNode, pos) {
        let location = Tools.evaluateUntil([this.__before, this.__start, this.__end, this.__after],
                                           [isInlineTarget, rootNode, pos]);
        return location.filter(this.__isValidLocation);
    }

    static __after(isInlineTarget, rootNode, pos) {
        let mPos = InlineUtils.normalizeBackwards(pos), scope = this.__rescope(rootNode, mPos.container());
        return InlineUtils.findRootInline(isInlineTarget, scope, mPos).fold(() => {
            return CaretFinder.prevPosition(scope, mPos)
                              .bind((nPos) => InlineUtils.findRootInline(isInlineTarget, scope, nPos))
                              .map((inline) => this.__location.after(inline));
        }, Option.none);
    }

    static __before(isInlineTarget, rootNode, pos) {
        let mPos = InlineUtils.normalizeForwards(pos), scope = this.__rescope(rootNode, mPos.container());
        return InlineUtils.findRootInline(isInlineTarget, scope, mPos).fold(() => {
            return CaretFinder.nextPosition(scope, mPos)
                              .bind((nPos) => InlineUtils.findRootInline(isInlineTarget, scope, nPos))
                              .map((inline) => this.__location.before(inline));
        }, Option.none);
    }

    static __betweenInlines(forward, isInlineTarget, rootNode, from, to, location) {
        return Option.liftN([
            InlineUtils.findRootInline(isInlineTarget, rootNode, from),
            InlineUtils.findRootInline(isInlineTarget, rootNode, to)
        ],
        (fromInline, toInline) => {
            if (fromInline !== toInline && InlineUtils.hasSameParentBlock(rootNode, fromInline, toInline)) {
                return this.__location.after(forward ? fromInline : toInline);
            }
            else {
                return location;
            }
        }).getOr(location);
    }

    static __end(isInlineTarget, rootNode, pos) {
        let nPos = InlineUtils.normalizeForwards(pos);
        return this.__findInsideRootInline(isInlineTarget, rootNode, nPos).bind((inline) => {
            let nextPos = CaretFinder.nextPosition(inline, nPos);
            return nextPos.isNone() ? Option.some(this.__location.end(inline)) : Option.none();
        });
    }

    static __findInsideRootInline(isInlineTarget, rootNode, pos) {
        return InlineUtils.findRootInline(isInlineTarget, rootNode, pos)
                          .filter((elm) => FormatContainer.getParentCaretContainer(rootNode, elm) === null);
    }

    static __findLocationSimple(forward, location) {
        if (forward) {
            return location.fold(Tools.compose(Option.some, this.__location.start), // Before -> Start
                                 Option.none,
                                 Tools.compose(Option.some, this.__location.after), // End -> After
                                 Option.none);
        }
        else {
            return location.fold(Option.none, Tools.compose(Option.some, this.__location.before), // Before <- Start
                                 Option.none, Tools.compose(Option.some, this.__location.end) // End <- After
            );
        }
    }

    static __findLocationTraverse(forward, isInlineTarget, rootNode, fromLocation, pos) {
        let from = InlineUtils.normalizePosition(forward, pos),
            to = CaretFinder.fromPosition(forward, rootNode, from)
                            .map((mPos) => InlineUtils.normalizePosition(forward, mPos)),
            location = to.fold(() => fromLocation.map(outside), (to) => {
                return this.readLocation(isInlineTarget, rootNode, to)
                           .map((location) => this.__betweenInlines(forward, isInlineTarget, rootNode, from, to, location))
                           .filter((toLocation) => this.__skipNoMovement(fromLocation, toLocation));
            });
        return location.filter(this.__isValidLocation);
    }

    static __getName(location) {
        return location.fold(
            Option.constant("before"), // Before
            Option.constant("start"), // Start
            Option.constant("end"), // End
            Option.constant("after") // After
        );
    }

    static __isEq(location1, location2) {
        return this.__getName(location1) === this.__getName(location2) 
            && this.getElement(location1) === this.getElement(location2);
    }

    static __isValidLocation(location) {
        return InlineUtils.isRtl(this.getElement(location)) === false;
    }

    static __rescope(rootNode, node) {
        let parentBlock = CaretUtils.getParentBlock(node, rootNode);
        return parentBlock ? parentBlock : rootNode;
    }

    static __skipNoMovement(fromLocation, toLocation) {
        return fromLocation.fold(Option.constant(true), (fromLocation) => {
            return !this.__isEq(fromLocation, toLocation);
        });
    }

    static __start(isInlineTarget, rootNode, pos) {
        let nPos = InlineUtils.normalizeBackwards(pos);
        return this.__findInsideRootInline(isInlineTarget, rootNode, nPos).bind((inline) => {
            let prevPos = CaretFinder.prevPosition(inline, nPos);
            return prevPos.isNone() ? Option.some(this.__location.start(inline)) : Option.none();
        });
    }

    static get __location() {
        return Tools.generate([
            { before: ["element"] },
            { start: ["element"] },
            { end: ["element"] },
            { after: ["element"] }
        ])
    }
}