import ObjectUtil from "admin/common/utils/ObjectUtil";

var idGenerator = ObjectUtil.getIdGenerator("Dropdown");
export default class NavbarDropdown extends React.Component {
	constructor(props) {
		super(props);
		this.toggle = props.toggle;
		this.menu = props.menu;
	}

	render() {
		let toggleId = this.toggle.id || idGenerator.nextId(),
		    toggleIconCls = ObjectUtil.join(["cms-icon fa", this.toggle.iconCls], ' '),
			toggleTextCls = ObjectUtil.join(["badge", this.toggle.textCls], ' '),
			menuHeaderIconCls = ObjectUtil.join(["cms-icon fa", this.menu.header.iconCls], ' ');

		return ([
			<a href="javascript:void(0)" data-toggle="dropdown" id={ toggleId } className="dropdown-toggle">
				<i class={ toggleIconCls }></i>
				<span class={ toggleTextCls }>{ this.toggle.text }</span>
			</a>,
			<ul class="dropdown-menu dropdown-navbar dropdown-caret dropdown-menu-right dropdown-close" aria-labelledby={ toggleId }>
				<li class="dropdown-header">
					<i class={ menuHeaderIconCls }></i>
					{ this.menu.header.text }
				</li>
				<li class="dropdown-content">
					<ul class="dropdown-menu dropdown-navbar">
						{ this.menu.content }
					</ul>
				</li>
				<li class="dropdown-footer">
					<a href={ this.menu.footer.href }>
						<span>{ this.menu.footer.text }</span>
						<i class="cms-icon fa fa-arrow-right"></i>
					</a>
				</li>
			</ul>
		]);
	}
}