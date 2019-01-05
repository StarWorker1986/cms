import NavbarDropdown from "admin/common/components/dropdown/NavbarDropdown";

function getCategoryList() {
	let categoryList = [];

	categoryList.push([
		<li>
			<a href="#">
				<div class="clearfix">
					<span class="pull-left badge badge-success">旅游</span>
					<span class="pull-right badge badge-info">+12</span>
				</div>
			</a>
		</li>,
		<li>
			<a href="#">
				<div class="clearfix">
					<span class="pull-left badge badge-success">摄影</span>
					<span class="pull-right badge badge-info">+24</span>
				</div>
			</a>
		</li>,
		<li>
			<a href="#">
				<div class="clearfix">
					<span class="pull-left badge badge-success">音乐</span>
					<span class="pull-right badge badge-info">+24</span>
				</div>
			</a>
		</li>,
		<li>
			<a href="#">
				<div class="clearfix">
					<span class="pull-left badge badge-success">视频</span>
					<span class="pull-right badge badge-info">+24</span>
				</div>
			</a>
		</li>
	]);

	return categoryList;
}

function getContentList() {
	let contentList = [];

	contentList.push([
		<li>
			<a href="#">
				<div class="clearfix">
					<div class="content-header">
						<span class="content-title">云南旅游归来</span>
						<span class="content-tag badge badge-info">旅游</span>
					</div>
					<div class="content-footer">
						<i class="cms-icon fa fa-clock-o"></i>
						<span>1 小时以前</span>
					</div>
				</div>
			</a>
		</li>,
		<li>
			<a href="#">
				<div class="clearfix">
					<div class="content-header">
						<span class="content-title">我不是药神</span>
						<span class="content-tag badge badge-info">电影</span>
					</div>
					<div class="content-footer">
						<i class="cms-icon fa fa-clock-o"></i>
						<span>5 分钟以前</span>
					</div>
				</div>
			</a>
		</li>
	]);

	return contentList;
}

export default class TopNavBar extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {        
		return (
			<div id="navbar" class="navbar navbar-default">
                <div class="navbar-container" id="navbar-container">
				    <button type="button" class="navbar-toggle menu-toggler pull-left" id="menu-toggler">
					    <span class="sr-only">Toggle sidebar</span>
					    <span class="icon-bar"></span>
					    <span class="icon-bar"></span>
					    <span class="icon-bar"></span>
				    </button>

				    <div class="navbar-header pull-left">
					    <a href="#" class="navbar-brand">
						    <small>
							    <i class="cms-icon fa fa-snowflake-o"></i>
							    <span>StarCMS</span>
						    </small>
					    </a>
				    </div>
                </div>
                <div class="navbar-buttons navbar-header pull-right" role="navigation">
					<ul class="nav cms-nav">
						<li class="grey">
							<NavbarDropdown toggle={ { iconCls: "fa-th-list", textCls: "badge-success", text: "4" } } 
											menu = { { header: { iconCls: "fa-th-list", text: "共有 4 种分类" }, content: getCategoryList(), footer: { href: "#", text: "查看更多分类" } }}
							/>
						</li>
						<li class="green">
							<NavbarDropdown toggle={ { iconCls: "fa-th", textCls: "badge-success", text: "6" } } 
											menu = { { header: { iconCls: "fa-th", text: "共有 6 篇文章" }, content: getContentList(), footer: { href: "#", text: "查看更多文章" } }}
							/>
						</li>
					</ul>
                </div>
            </div>
		);
	}
}

ReactDOM.render(<TopNavBar />, document.getElementById("Main"));