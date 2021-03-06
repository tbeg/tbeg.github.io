



L.TileLayer.PouchDBCached = L.TileLayer.extend({

	options: {
		requestTiles: true,  // If false, will only use tiles already existing on the cache
		cacheTiles: true,    // If false, will not cache new tiles.
		maxAge: 24*3600*1000 // Maximum cache age, in MILLIseconds (default 24 hours)
	},

	initialize: function(url, options){
		this.db = new PouchDB('offline-tiles');
		this.canvas = document.createElement('canvas');

		if (!(this.canvas.getContext && this.canvas.getContext('2d'))) {
			// HTML5 canvas is needed to pack the tiles as base64 data. If
			//   the browser doesn't support canvas, the code will forcefully
			//   skip caching the tiles.
			this.canvas = null;
		}

		L.TileLayer.prototype.initialize.call(this,url,options);
	},

	// Overwrites L.TileLayer.prototype_loadTile
	_loadTile: function(tile, tilePoint) {
		tile._layer  = this;
		tile.onerror = this._tileOnError;

		this._adjustTilePoint(tilePoint);

		var tileUrl = this.getTileUrl(tilePoint);
		this.fire('tileloadstart', {
			tile: tile,
			url: tileUrl
		});

		this.db.get(tileUrl, {revs_info: true}, this._onCacheLookup(tile,tileUrl));
	},

	// Returns a callback (closure over tile/key/originalSrc) to be run when the DB
	//   backend is finished with a fetch operation.
	_onCacheLookup: function(tile,tileUrl) {
		return function(err,data) {
			if (data) {
				if (Date.now() > data.timestamp + this.options.maxAge && this.options.requestTiles) {
					// Tile is too old
					if (this.options.cacheTiles) {
						tile.onload = this._saveTile(tileUrl, data._revs_info[0].rev);
					}
					tile.crossOrigin = 'Anonymous';
					tile.src = tileUrl;
					tile.onerror = function(ev) {
						// If the tile is too old but couldn't be fetched from the network,
						//   serve the one still in cache.
						this.src = data.dataUrl;
					}
				} else {
					tile.onload  = this._tileOnLoad;
					tile.src = data.dataUrl;    // data.dataUrl is already a base64-encoded PNG image.
				}
			} else {
				if (!this.options.requestTiles) {
					// Offline, not cached
					tile.onload  = this._tileOnLoad;
					tile.src = L.Util.emptyImageUrl;
				} else {
					// Online, not cached, request the tile normally
					if (this.options.cacheTiles) {
						tile.onload = this._saveTile(tileUrl);
					}
					tile.crossOrigin = 'Anonymous';
					tile.src = tileUrl;
				}
			}
		}.bind(this);
	},

	// Returns an event handler (closure over DB key), which runs
	//   when the tile (which is an <img>) is ready.
	// The handler will delete the document from pouchDB if an existing revision is passed.
	//   This will keep just the latest valid copy of the image in the cache.
	_saveTile: function(tileUrl, existingRevision) {
		return function(ev) {
			if (this.canvas === null) return;
			var img = ev.target;
			L.TileLayer.prototype._tileOnLoad.call(img,ev);
			this.canvas.width  = img.naturalWidth  || img.width;
			this.canvas.height = img.naturalHeight || img.height;

			var context = this.canvas.getContext('2d');
			context.drawImage(img, 0, 0);

			var dataUrl = this.canvas.toDataURL('image/png');
			var doc = {dataUrl: dataUrl, timestamp: Date.now()};

			if (existingRevision) {
				this.db.remove(tileUrl, existingRevision);
			}
			this.db.put(doc, tileUrl, doc.timestamp);
		}.bind(this);
	}
});




L.tileLayer.pouchDBCached = function (url, options) {
	return new L.TileLayer.PouchDBCached(url, options);
};



// This is a hackish way of making WMS tile layers to be cached. Maybe a better
//   architecture would be to modify the core L.TileLayer class and then
//   enabling caching at instantiation time.

L.TileLayer.WMS.PouchDBCached = L.TileLayer.WMS.extend({
	options:        L.TileLayer.PouchDBCached.prototype.options,
	initialize:     function(url,opts) {
		L.TileLayer.WMS.prototype.initialize.call(this,url,opts);
		L.TileLayer.PouchDBCached.prototype.initialize.call(this,url,opts);
	},
	_loadTile:      L.TileLayer.PouchDBCached.prototype._loadTile,
	_onCacheLookup: L.TileLayer.PouchDBCached.prototype._onCacheLookup,
	_saveTile:      L.TileLayer.PouchDBCached.prototype._saveTile
});

L.tileLayer.wms.pouchDBCached = function (url, options) {
	return new L.TileLayer.WMS.PouchDBCached(url, options);
};



