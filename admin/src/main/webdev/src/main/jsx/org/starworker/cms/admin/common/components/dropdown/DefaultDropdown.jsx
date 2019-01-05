import ObjectUtil from "admin/common/utils/ObjectUtil";

var idGenerator = ObjectUtil.getIdGenerator("Dropdown");
export default class Dropdown extends React.Component {
	constructor(props) {
		super(props);
		this.toggle = props.toggle;
		this.menu = props.menu;
	}

	render() {
		let toggleId = this.toggle.id || idGenerator.nextId(),
		    toggleClass = ObjectUtil.join(["dropdown-toggle", this.toggle.className], ' '),
			menuClass = ObjectUtil.join(["dropdown-menu", this.menu.className], ' ');

		return (
			<div class="dropdown">
				<a href="javascript:void(0)" data-toggle="dropdown" id={ toggleId } className={ toggleClass }>
					{ this.toggle.content }
				</a>
				<div class={ menuClass } aria-labelledby={ toggleId }>
					{ this.menu.content }
				</div>
			</div>
		);
	}
}
