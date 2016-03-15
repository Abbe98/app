var id = rootId = 0;
var auth = {};
var uri = new URI(); // URI.js

/* ================ Biocaching =================== */

// http://db.biocaching.com/
// http://api.biocaching.com/taxa
// http://api.biocaching.com/taxa?parent_id=1

// http://api.biocaching.com/taxa/<id> --> name, parent id
//   http://api.biocaching.com/taxa/<parentid> --> parent name
// http://api.biocaching.com/taxa/?size=99&parent_id=<id> --> children{name,id}

var taxaUrlBiocaching = "http://api.biocaching.com/taxa/";

function getDataBiocaching() {
	if (id == rootId) {
		buildInfoBiocaching({hits:[{_source:{scientific_name:"biota"}}]});
	} else {
		var xhrInfo = new XMLHttpRequest();
		xhrInfo.open("GET", taxaUrlBiocaching + id, true);
		xhrInfo.overrideMimeType("application/json");
		xhrInfo.setRequestHeader("Content-type", "application/json");
		xhrInfo.setRequestHeader("Accept", "application/json");
		xhrInfo.setRequestHeader("X-User-Email", auth.email);
		xhrInfo.setRequestHeader("X-User-Token", auth.token);
		xhrInfo.onreadystatechange = function() {
			if (xhrInfo.readyState == 4) {
				buildInfoBiocaching(JSON.parse(xhrInfo.responseText));
			}
		}
		xhrInfo.send();
	}

	var xhrList = new XMLHttpRequest();
	var url = taxaUrlBiocaching + "?size=99";
	if (id != rootId) url += "&parent_id=" + id;
	xhrList.open("GET", url, true);
	xhrList.overrideMimeType("application/json");
	xhrList.setRequestHeader("Content-type", "application/json");
	xhrList.setRequestHeader("Accept", "application/json");
	xhrList.setRequestHeader("X-User-Email", auth.email);
	xhrList.setRequestHeader("X-User-Token", auth.token);
	xhrList.onreadystatechange = function() {
		if (xhrList.readyState == 4) {
			buildListBiocaching(JSON.parse(xhrList.responseText));
		}
	}
	xhrList.send();
}

function buildInfoBiocaching(taxonData) {
	console.log(taxonData);
	var name = taxonData.hits[0]._source.scientific_name;
	name = name.charAt(0).toUpperCase() + name.slice(1);
	buildPage({name: name})

	var xhrParent = new XMLHttpRequest();
	xhrParent.open("GET", taxaUrlBiocaching + taxonData.hits[0]._source.parent_id, true);
	xhrParent.overrideMimeType("application/json");
	xhrParent.setRequestHeader("Content-type", "application/json");
	xhrParent.setRequestHeader("Accept", "application/json");
	xhrParent.setRequestHeader("X-User-Email", auth.email);
	xhrParent.setRequestHeader("X-User-Token", auth.token);
	xhrParent.onreadystatechange = function() {
		if (xhrParent.readyState == 4) {
			buildParentBiocaching(JSON.parse(xhrParent.responseText));
		}
	}
	xhrParent.send();
}

function buildParentBiocaching(data) {
	console.log(data);
	var parent;

	if ((data.hits.length == 0) && (id != rootId)) {
		data.hits = [{_source: {scientific_name: "biota"}, _id: rootId}];
	}
	if (data.hits.length > 0) {
		var name = data.hits[0]._source.scientific_name;
		name = name.charAt(0).toUpperCase() + name.slice(1);
		parent = {name: name, id: data.hits[0]._id};
	}
	buildPage({parents: [parent]});
}

function buildListBiocaching(data) {
	//console.log(data);
	var children = [];
	data.hits.forEach(function(child){
		var name = child._source.scientific_name;
		name = name.charAt(0).toUpperCase() + name.slice(1);
		children.push({name: name, id: child._id});
	});
	buildPage({children: children})
}


/* ================ Encyclopedia of Life =================== */

// http://eol.org/api
// http://eol.org/api/hierarchy_entries/1.0/51521763.json?callback=test

// http://eol.org/api/hierarchy_entries/1.0/<id>.json?callback=<func> --> name

function loadDataEol() {
	if (id == rootId) {
		buildList({
			scientificName: "Biota",
			taxonConceptID: rootId,
			ancestors: [],
			children: [
				{ taxonID: 51521761, taxonConceptID:    1, scientificName: "Animalia" },
				{ taxonID: 52744048, taxonConceptID: 5559, scientificName: "Fungi" },
				{ taxonID: 52800975, taxonConceptID:  281, scientificName: "Plantae" },
				{ taxonID: 53103686, taxonConceptID:  288, scientificName: "Bacteria" },
				{ taxonID: 53112249, taxonConceptID: 3352, scientificName: "Chromista" },
				{ taxonID: 53114002, taxonConceptID: 5006, scientificName: "Viruses" },
				{ taxonID: 53116999, taxonConceptID: 4651, scientificName: "Protozoa" },
				{ taxonID: 53131235, taxonConceptID: 7920, scientificName: "Archaea" }
			]
		});
		return;
	}

	var script = document.createElement("script");
	script.src = "http://eol.org/api/hierarchy_entries/1.0/" + id + ".json?callback=buildList";
	document.body.appendChild(script);
	document.body.removeChild(script);
}

function buildList(data) {
	var getDetailsFor = [];


	// retreive details for current species
	if (id == rootId)  {
		buildDetailsEol([{"0": {
			taxonConcepts: [{nameAccordingTo: "Species 2000 & ITIS Catalogue of Life: April 2013", identifier: rootId}],
			dataObjects: [{eolMediaURL: "https://upload.wikimedia.org/wikipedia/commons/d/da/Ruwenpflanzen.jpg"}], 
			vernacularNames: []
		}}]);
	} else {
		// inject biota root into ancestors tree
		data.ancestors.unshift({taxonID: rootId, scientificName: "Biota"});
	}
	getDetailsFor.push(data.taxonConceptID);

	var ancestors = [], children = [];
	data.ancestors.forEach(function(elm) {
		ancestors.push({name: elm.scientificName, id: elm.taxonID});
	});
	data.children.forEach(function(elm){
		children.push({name: elm.scientificName, id: elm.taxonID});
		getDetailsFor.push(elm.taxonConceptID);
	});
	buildPage({name: data.scientificName, ancestors: ancestors, children: children});

	var script = document.createElement("script");
	script.src = "http://eol.org/api/pages/1.0.json?batch=true&id=" + getDetailsFor.join() + "&images=1&videos=0&text=0&details=true&taxonomy=true&common_names=true&cache_ttl=300&callback=buildDetails";
	document.body.appendChild(script);
	document.body.removeChild(script);
}

function buildDetails(data) {
	console.log(data);

	data.forEach(function(elm){
		// each array element is an object with only one property (named by taxonConceptID); get the contents of this propery
		var taxo = elm[Object.keys(elm)[0]];
		console.log("taxo: ", taxo);

		// find COL id
		var ColID = null;
		for (var c in taxo.taxonConcepts) {
			if (taxo.taxonConcepts[c].nameAccordingTo == "Species 2000 & ITIS Catalogue of Life: April 2013") {
				ColID = taxo.taxonConcepts[c].identifier;
				break;
			}
		};

		// find thumbnail
		var thumbnailUrl = null, mediaUrl = null;
		// check if there is data objects
		if (taxo.dataObjects.length > 0) {
			// find first data object that has a thumbnail
			for (var o in taxo.dataObjects) {
				if ("eolMediaURL" in taxo.dataObjects[o]) {
					// load thumbnail
					thumbnailURL = taxo.dataObjects[o].eolThumbnailURL;
					mediaUrl = taxo.dataObjects[o].eolMediaURL;
					break;
				}
			}
		}

		if (ColID == id) {
			// load main species details
			if (mediaUrl != null) {
				document.querySelector(".bg").src = mediaUrl;
				document.querySelector(".fg").src = mediaUrl;
			}
			var names_en = [];
			for (i = 0; i < taxo.vernacularNames.length; i++) {
				if (taxo.vernacularNames[i].language == "en") {
					names_en.push(taxo.vernacularNames[i].vernacularName);
				}
			}
			document.getElementById("name-en").textContent = names_en.join(", ");
		} else {
			// load child species details

			if (thumbnailURL != null) {
				var elm = document.querySelector("li#tax-" + ColID);
				elm.querySelector("img").src = thumbnailURL;
			}

			var found = false;
			for (i = 0; i < taxo.vernacularNames.length && !found; i++) {
				if (taxo.vernacularNames[i].language == "en") {
					elm.querySelector("h2").textContent += " (" + taxo.vernacularNames[i].vernacularName + ")"
					found = true;
				}
			}
		}
	})
}

/* ================ view routines =================== */

function buildPage(data) {
	console.log(data);
	
	if ("name" in data) {
		if (id != rootId) {
			document.querySelector("title").textContent = data.name + " - Biocaching";
			document.querySelector("h1").textContent = data.name;
		}
		document.querySelector("#name").textContent = data.name;
	}

	var parentItemTemplate, parentItem = null;
	if ("ancestors" in data) {
		if (data.ancestors.length > 0) {
			parentItemTemplate = document.querySelector("#ancestors div");
			data.ancestors.forEach(function(parent){
				var item = parentItemTemplate.cloneNode(true);
				item.querySelector("a").textContent = parent.name;
				item.querySelector("a").href = uri.setSearch({id: parent.id});
				if (parentItem == null) {
					parentItemTemplate.parentNode.appendChild(item);
				} else {
					parentItem.appendChild(item);
				}
				parentItem = item;
			});
			parentItemTemplate.parentNode.removeChild(parentItemTemplate);
		} else {
			var ancestors = document.querySelector("#ancestors");
			ancestors.parentNode.removeChild(ancestors);
		}
	}

	var childItemTemplate;
	if ("children" in data) {
		childItemTemplate = document.querySelector("#subitems li");
		data.children.forEach(function(child){
			var item = childItemTemplate.cloneNode(true);
			item.querySelector("h2").textContent = child.name;
			item.querySelector("a").href = uri.setSearch({id: child.id});
			item.id = "tax-" + child.id;
			childItemTemplate.parentNode.appendChild(item);
		});
		if (data.children.length == 0) {
			var children = document.querySelector("#subitems");
			children.parentNode.removeChild(children);
		} else {
			childItemTemplate.parentNode.removeChild(childItemTemplate);
		}
	}

}

/* ================ initialization =================== */

(function() {

	var query = uri.query(true); // URI.js
	if (query.id !== undefined) id = query.id;

	auth.email = localStorage.getItem("email");
	auth.token = localStorage.getItem("authentication_token");
	document.querySelector("html").className += " biocaching";

	//loadData();
	getDataBiocaching();
})();
