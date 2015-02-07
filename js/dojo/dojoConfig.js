var dojoConfig;
(function () {
	var baseUrl = location.pathname.replace(/\/[^/]+$/, "/../../../example16/js/dojo/");
	var package_path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
	dojoConfig = {
		async: 1,
		cacheBust: '201411111430',
		// Load dgrid and its dependencies from a local copy.
		// If we were loading everything locally, this would not
		// be necessary, since Dojo would automatically pick up
		// dgrid, xstyle, and put-selector as siblings of the dojo folder.
		packages: [
			{ name: 'dgrid', location: package_path + '/js/dojo/dgrid' },
			{ name: 'xstyle', location: package_path + '/js/dojo/xstyle' },
			{ name: 'put-selector', location: package_path + '/js/dojo/put-selector' }
		]
	};
}());