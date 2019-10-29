export default class LayoutRow extends React.Component {
    constructor(props) {
        super(props);
        this.spans = props.spans;
    }

    render() {
        return (
            <div class="layout-row">
                <div class="preview">
                    <div class="row">
                        <div class="col-md-6 col-md-offset-1 layout-column">
                            <input type="text" class="form-control" value={ this.__getValue() } disabled />
                        </div>
                        <div class="col-md-3 col-md-offset-1 layout-column">
                            <span class="label label-default col-md-12 drag"><i class="fa fa-arrows"></i>拖动</span>
                        </div>
                    </div>
                </div>
                <div class="view">
                    <div class="row">
                        <span class="label label-default drag"><i class="fa fa-arrows"></i>拖动</span>
                        <span class="label label-danger remove"><i class="fa fa-remove"></i>删除</span>
                        { this.__getDivs() }
                    </div>
                </div>
            </div>
        );
    }

    __getValue() {
        return this.spans.join(" ");
    }

    __getDivs() {
        let divs = [];
        this.spans.map((span) => {
            divs.push(<div class={ "col-md-" + span + " layout-column" }></div>);
        });
        return divs;
    }
}