// global variables
var script_folder = document.currentScript.src.split('/').slice(0, -1).join('/'); // must be before $ ...
$(document).ready(function() {
	// start of diagram in modal part
	function downloadMessage(msg) {
		var isInFullScreen =
			(document.fullscreenElement && document.fullscreenElement !== null) ||
			(document.webkitFullscreenElement &&
				document.webkitFullscreenElement !== null);
		if (isInFullScreen) {
			var el = document.createElement("div");
			el.setAttribute("id", "download-message");
			el.innerHTML = msg;
			setTimeout(function() {
				el.parentNode.removeChild(el);
			}, 5000);
			document.querySelector(".modal-content").prepend(el);
		}
	}
	function openFullScreen() {
		var isInFullScreen =
			(document.fullscreenElement && document.fullscreenElement !== null) ||
			(document.webkitFullscreenElement &&
				document.webkitFullscreenElement !== null);
		if (!isInFullScreen) {
			toggleFullScreen();
		}
	}
	function closeFullScreen() {
		var isInFullScreen =
			(document.fullscreenElement && document.fullscreenElement !== null) ||
			(document.webkitFullscreenElement &&
				document.webkitFullscreenElement !== null);
		if (isInFullScreen) {
			toggleFullScreen();
		}
	}
	//	  var objectTag;
	var svgDocument;
	setTimeout(() => {
		var objectTag = document.querySelector("div#svgDiagram object");
		svgDocument = objectTag.contentDocument;
		//	  objectTag.addEventListener('load', function(){
		//    svgDocument = objectTag.contentDocument;
		//	  });
		var rootUri = svgDocument.baseURI.split('/').slice(0, -2).join('/');
		var svgNode = svgDocument.querySelector("svg");
		var svgForModal = svgNode.cloneNode(true);
		var svgAnodes = svgForModal.querySelectorAll("svg a");
		// set uris because the baseURI is different in the clone
		for (const anode of svgAnodes) {
			if (anode.href.baseVal.startsWith('../')) {
				anode.href.baseVal = anode.href.baseVal.replace('..', rootUri);
			}
		}
		var svgForDownload = svgNode.cloneNode(true);
		// tooltip for the modal svg
		svgForModal.querySelector("svg>title").innerHTML = "Pan and zoom the diagram";
		var panzoomArea = document.getElementById("panzoom-area");
		// put a copy of the object svg in the panzoom area
		// Reason: panzoom and object tag result in either pan and no active links or vice versa
		panzoomArea.append(svgForModal);
		var modal = document.getElementById("myModal");
		var closeModal = document.getElementById("closeModal");
		var openModal = document.getElementById("openModal");
		var resetDiagram = document.getElementById("resetDiagram");
		var downloadDiagramPng = document.getElementById("downloadDiagramPng");
		var downloadDiagramSvg = document.getElementById("downloadDiagramSvg");
		/* works for whole diagram but can irritate especially when clicking link 
			  document.querySelector("div#svgDiagram object").contentDocument.querySelector("svg").onclick = function() {
				document.getElementById("myModal").style.display = "block";
			  };
		*/
		/* svg title event works
			  var titleNode = svgDocument.querySelector("svg g>text");
			  titleNode.onclick = function() {
				modal.style.display = "block";
			  };
			  titleNode.style.cursor = "pointer";
		*/
		openModal.onclick = function() {
			openFullScreen();
			modal.style.display = "block";
		};
		closeModal.onclick = function() {
			closeFullScreen();
			modal.style.display = "none";
		};
		// reset panzoom
		resetDiagram.onclick = function() {
			panzoom.reset();
		};
		// download svg as png
		downloadDiagramPng.onclick = function() {
			// code for this and download from https://stackoverflow.com/questions/28226677/save-inline-svg-as-jpeg-png-svg#55013028
			var data = new XMLSerializer().serializeToString(svgForDownload);
			var canvas = document.createElement("canvas");
			var svgTextItems = document.querySelectorAll("svg text");
			var topic = svgTextItems[svgTextItems.length - 1].innerHTML;
			var filename = topic + ".png";
			canvg(canvas, data, {
				renderCallback: function() {
					canvas.toBlob(function(blob) {
						download(filename, blob);
					}, "image/png"); // results in transparent background
					//      }, 'image/jpeg');  // results in black (transparent?) background
				},
			});
			downloadMessage('PNG file downloaded for <br/>' + topic);
		};
		// download svg as svg
		downloadDiagramSvg.onclick = function() {
			const svgAnodes = svgForDownload.querySelectorAll("svg a");
			if (modelDocumentationUrl) {
				for (const anode of svgAnodes) {
					if (anode.href.baseVal.startsWith('../')) {
						anode.href.baseVal = anode.href.baseVal.replace('../', modelDocumentationUrl);
					}
				}
			}
			// code from from https://stackoverflow.com/questions/28226677/save-inline-svg-as-jpeg-png-svg#69067443
			var data = new XMLSerializer().serializeToString(svgForDownload);
			var svgTextItems = document.querySelectorAll("svg text");
			var topic = svgTextItems[svgTextItems.length - 1].innerHTML;
			var filename = topic + ".svg";
			var svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
			download(filename, svgBlob); // results in save filename
			downloadMessage('SVG file downloaded for <br/>' + topic);
		}
		function download(filename, blob) {
			if (window.navigator.msSaveOrOpenBlob) {
				window.navigator.msSaveBlob(blob, filename);
			} else {
				const elem = window.document.createElement("a");
				elem.href = window.URL.createObjectURL(blob);
				elem.download = filename;
				document.body.appendChild(elem);
				elem.click();
				document.body.removeChild(elem);
			}
		}
		// When the user clicks anywhere outside of the modal, close it
		window.onclick = function(event) {
			if (event.target == modal) {
				modal.style.display = "none";
			}
		};
		// in case of escape, close the modal
		window.addEventListener("keydown", function(event) {
			if (event.key === "Escape") {
				modal.style.display = "none";
			}
		});
		var anchorNodelist = document.querySelectorAll("svg a[target='_top']");
		var anchorArray = Array.from(anchorNodelist);
		var panzoom = Panzoom(document.getElementById("panzoom-area"), {
			canvas: true, // important for pan in whole modal area
			exclude: anchorArray,
			maxScale: 15,
		});
		document
			.getElementById("panzoom-wrapper")
			.addEventListener("wheel", panzoom.zoomWithWheel);
	}, "200");
	// end of diagram in modal part	
	//
	// adjust encoding urls
	$('div.encoding > p > a.external').each(function() {
		changeUrl(this);
	});
	$('section#high-level-documentation > p > a.external').each(function() {
		changeUrl(this);
	});
	function changeUrl(obj) {
		var oldUrl = $(obj).attr("href");
		if (!oldUrl.startsWith('http')) {
			// var newUrl = DOCUMENTATION_OPTIONS["URL_ROOT"] + ".." + oldUrl; URL_ROOT not available anymore 
			var newUrl = script_folder + "/../.." + oldUrl;
		}
		$(obj).attr("href", newUrl);
	}
	// end of adjust encoding urls
	var svgUrl = $('div#diagram object').attr('data');
	//	var svgUrl = $('p.plantuml object').attr('data');
	//	$( 'div#diagram p.plantuml' ).prepend( '<a class="diagram-link" href="' + svgUrl + '" target="_blank">Open diagram in additional window</a>' );
	//	$( 'p.plantuml' ).prepend( '<a class="diagram-link" href="' + svgUrl + '" target="_blank">Open diagram in separate window</a>' );

	// set logo link to external page
	/*
		$("p.logo > a").each(function(){
			$(this).attr('href', modelUrl);
			$(this).attr('target', '_blank');
		});
	*/

	// add tool tips to internal references
	// definition is in additional definition.js created by modelQuery.mtl
	$("a.reference.internal:not(.current)").each(function() {
		//$(":not(li) > a.reference.internal").each(function(){ // but not to TOC
		// strip package name
		term = $(this).text().replace(/[^:]+::/, '');
		tooltip = definition[term];
		if (tooltip === undefined) {
			$(this).attr('title', '');
			//			console.log( term );
		} else {
			$(this).attr('title', tooltip);
/*			$(this).attr('title', ' \n' + tooltip);
			$(this).attr('data-bs-placement', 'right'); // for bootstrap tooltip, right as default
*/		}
	});

	// jquery tooltip can be styled. see: https://jqueryui.com/tooltip/
	// error if selector is document: can't convert undefined to object ??
	// bootstrap tooltip take over, can't be avoided if bootstrap is used??.
	// but jquery tooltip nicer. going back to browser tooltip.
	// more consistent because svg tooltips are anyway styled by the browser.
	/*	$( function() {
			$( 'a' ).tooltip();
		} );
	*/
	$('table.datatable-basic').DataTable({
		"info": false,
		"paging": false,
		"searching": false,
		select: true
	});

	$('OLDtable.datatable-attributes').DataTable({
		"lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
		"paging": true,
		"dom": "Plifprtlifp",
		select: true,
		conditionalPaging: true,
		"order": [[0, 'asc'], [1, 'asc'], [3, 'asc']],
		columnDefs: [
			{
				targets: '_all',
				render: function(data, type, row, meta) {
					return data.replace(/<p[^>]*>(.+)<\/p>/s, "$1"); // doesn't remove links
				}
			},
			{
				searchPanes: {
					threshold: 0.8
				},
				targets: [1, 3]
			},
			{
				targets: [4],
				className: 'dt-body-center'
			},
			{
				searchPanes: {
					show: false,
				},
				targets: [0, 2, 4]
			}
		],
		searchPanes: {
			controls: false,
			layout: 'columns-4'
		},
// hide page controls if there is only one page
// see: https://datatables.net/forums/discussion/49572/how-can-i-disable-paging-dynamically
/*		initComplete: function() {
			alert(this.api().page.info().pages)
	    	if (this.api().page.info().pages === 1) {
	        	$('.dataTables_info').hide();
	        	$('.dataTables_filter').hide();
	        	$('.dataTables_length').hide();
	        	$('.dataTables_paginate').hide();
			}
	    }
*/    });

	$('OLDtable.datatable-enumeration-literals').DataTable({
		"lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
		"paging": true,
		"dom": "Plifprtlifp",
		select: true,
		conditionalPaging: true,
		"order": [[0, 'asc'], [1, 'asc']],
		columnDefs: [
			{
				targets: '_all',
				render: function(data, type, row, meta) {
					return data.replace(/<p[^>]*>(.+)<\/p>/s, "$1"); // doesn't remove links
				}
			},
			{
				searchPanes: {
					threshold: 0.8
				},
			},
		],
		searchPanes: {
			controls: false,
			layout: 'columns-4'
		},
// hide page controls if there is only one page
// see: https://datatables.net/forums/discussion/49572/how-can-i-disable-paging-dynamically
/*		initComplete: function() {
			alert(this.api().page.info().pages)
	    	if (this.api().page.info().pages === 1) {
	        	$('.dataTables_info').hide();
	        	$('.dataTables_filter').hide();
	        	$('.dataTables_length').hide();
	        	$('.dataTables_paginate').hide();
			}
	    }
*/    });

	$('OLDtable.datatable-usage').DataTable({
		"lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
		"paging": true,
		"dom": "Plifprtlifp",
		select: true,
		conditionalPaging: true,
		"order": [[0, 'asc'], [1, 'asc'], [2, 'asc'], [3, 'asc']],
		columnDefs: [
			{
				targets: '_all',
				render: function(data, type, row, meta) {
					return data.replace(/<p[^>]*>(.+)<\/p>/s, "$1"); // doesn't remove links
				}
			},
			{
				searchPanes: {
					threshold: 0.8
				},
			},
		],
		searchPanes: {
			controls: false,
			layout: 'columns-4'
		}
	});
	// hide page controls if there is only one page
	// see: https://datatables.net/forums/discussion/49572/how-can-i-disable-paging-dynamically
	/*		initComplete: function() {
				alert(this.api().page.info().pages)
				if (this.api().page.info().pages === 1) {
					$('.dataTables_info').hide();
					$('.dataTables_filter').hide();
					$('.dataTables_length').hide();
					$('.dataTables_paginate').hide();
				}
			}
	*/
	// datatables defaults
	$('.main-table').find('colgroup').remove(); // otherwise wrong width by dt
	Object.assign(DataTable.defaults, {
		autoWidth: false,
		layout: {
			responsive: true,
			top: 'searchPanes',
			topStart: 'pageLength',
			topEnd: 'search',
			bottomStart: 'info',
			bottomEnd: 'paging'
		},
		lengthMenu: [[5, 10, -1], [5, 10, "All"]],
		pageLength: 5,
		responsive: true,
		searchPanes: {
			controls: false,
			i18n: {
				loadMessage: '' // suppress: Loading Search Panes...
			},
			initCollapsed: true,
			threshold: 0.4, // default 0.6,
			layout: 'columns-6'
		},
		select: true
	});
	$('#datatable-attributes').DataTable({
		columnDefs: [
			{ targets: [4], className: 'dt-head-center dt-body-center' },
			{ targets: [1, 3], searchPanes: { show: true } },
			{ targets: [0, 2, 4, 5], searchPanes: { show: false } }
		],
		order: [[0, 'asc'], [1, 'asc'], [3, 'asc']],
	});
	// remove markup in table cells REMOVE ?
	/*	$('#datatable-associations').find('th a').contents().unwrap();
		$('#datatable-associations').find('th > p').contents().unwrap();
		
		$('#datatable-associations').find('div.dtsp-searchPanes a').contents().unwrap();
	*/
	//	$('#datatable-associations').find('colgroup').remove(); // otherwise wrong width by dt
	$('#datatable-associations').DataTable({
		columnDefs: [
			{ targets: [0, 3, 6, 7], className: 'dt-head-center dt-body-center' },
/*			{ targets: [0, 3, 6, 7], className: 'dt-head-center dt-body-center main-table-header' },
*/			{ targets: [0, 4, 7, 8], searchPanes: { show: true } },
			{ targets: [1, 2, 3, 5, 6], searchPanes: { show: false } }
		],
		order: [[5, 'asc'], [4, 'asc']]
	});
	$('table#datatable-usage').DataTable({
		order: [[0, 'asc'], [1, 'asc'], [2, 'asc'], [3, 'asc']],
		columnDefs: [
			{ targets: [0, 1, 3], searchPanes: { show: true } },
			{ targets: [2], searchPanes: { show: false } }
		],
	});
	$('table#datatable-enumeration-literals').DataTable({
		order: [[0, 'asc']]
	});
	$('table#classes-list').DataTable({
		columnDefs: [
			{ targets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], className: 'dt-head-center' },
			{ targets: [2, 3, 4, 5, 6, 7, 8, 9], className: 'dt-body-center' },
			{ targets: [1, 2, 3, 4, 5, 6, 7, 8, 9], searchPanes: { show: true } },
			{ targets: [0], searchPanes: { show: false } }
		],
		order: [[0, 'asc']]
	});
	$('table#datatable-allassociations').DataTable({
		columnDefs: [
			{ targets: [0, 3, 5, 7, 9], className: 'dt-body-center' },
			{ targets: [0, 1, 2, 6, 10, 11], searchPanes: { show: true } },
			{ targets: [3, 4, 5, 7, 8, 9], searchPanes: { show: false } },
		],
		iDisplayLength: 50,
		order: [[1, 'asc'], [2, 'asc'], [10, 'asc'], [11, 'asc']]
	});
	$('table#datatypes-list').DataTable({
		columnDefs: [
			{ targets: [4], className: 'dt-body-center' },
			{ targets: [3, 5, 6, 7, 8, 9], className: 'dt-body-right' },
			{ targets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], searchPanes: { show: true } }
		],
		order: [[0, 'asc']]
	});
	$('table#packages-list').DataTable({
		order: [[0, 'asc'], [1, 'asc']],
		columnDefs: [
			{ targets: [2], className: 'dt-body-right' },
			{ targets: [1, 2], searchPanes: { show: true } },
			{ targets: [0], searchPanes: { show: true } }
		],
	});
	$('Xtable#datatable-associations').DataTable({
		"lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
		"paging": true,
		"dom": '<"legend-searchpanes">Plifprtlifp',
		//		"dom": "Plifprtlifp",
		select: true,
		conditionalPaging: true,
		"order": [[5, 'asc'], [4, 'asc']],
		columnDefs: [
			{
				targets: '_all',
				render: function(data, type, row, meta) {
					return data.replace(/<p[^>]*>(.+)<\/p>/s, "$1"); // doesn't remove links
				}
			},
			{
				targets: [0, 4, 7, 8],
				searchPanes: {
					threshold: 0.8
				}
			},
			{
				targets: [0, 3, 6, 7],
				className: 'dt-body-center'
			},
			{
				targets: [1, 2, 3, 5, 6],
				searchPanes: {
					show: false,
				}
			}
		],
		searchPanes: {
			controls: false,
			layout: 'columns-4'
		}
	});

	$('OLDtable.classes-list').DataTable({
		"lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
		"paging": true,
		"dom": '<"legend-searchpanes">Plifprtlifp',
		select: true,
		conditionalPaging: true,
		"order": [[0, 'asc']],
		columnDefs: [
			{
				targets: '_all',
				render: function(data, type, row, meta) {
					return data.replace(/<p[^>]*>(.+)<\/p>/s, "$1"); // doesn't remove links
				}
			},
			{
				targets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
				searchPanes: {
					threshold: 0.8
				},
				//				render: $.fn.dataTable.render.ellipsis( 17, true ) # extra lib
			},
			{
				targets: [2, 5, 6, 7, 8, 9, 10],
				className: 'dt-body-right'
			},
			{
				targets: [3, 4],
				className: 'dt-body-center'
			},
			{
				targets: [0],
				searchPanes: {
					show: false,
				}
			}
		],
		searchPanes: {
			controls: false,
			layout: 'columns-5'
		}
	});

	$('OLDtable.datatypes-list').DataTable({
		"lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "All"]],
		"paging": true,
		"dom": '<"legend-searchpanes">Plifprtlifp',
		select: true,
		conditionalPaging: true,
		"order": [[0, 'asc']],
		columnDefs: [
			{
				targets: '_all',
				render: function(data, type, row, meta) {
					return data.replace(/<p[^>]*>(.+)<\/p>/s, "$1"); // doesn't remove links
				}
			},
			{
				targets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
				searchPanes: {
					threshold: 0.8
				},
				//				render: $.fn.dataTable.render.ellipsis( 17, true ) # extra lib
			},
			{
				targets: [3, 5, 6, 7, 8, 9],
				className: 'dt-body-right'
			},
			{
				targets: [4],
				className: 'dt-body-center'
			},
			{
				targets: [0],
				searchPanes: {
					show: false,
				}
			}
		],
		searchPanes: {
			controls: false,
			layout: 'columns-5'
		}
	});

	$("div.legend-searchpanes").html('Values in the interactive panel indicate frequencies in all unfiltered rows. Filters can be combined.');

	$('OLDtable.packages-list').DataTable({
		iDisplayLength: 20,
		"lengthMenu": [[10, 20, 50, -1], [10, 20, 50, "All"]],
		"paging": true,
		"dom": "Plifprtlifp",
		select: true,
		conditionalPaging: true,
		"order": [[0, 'asc']],
		columnDefs: [
			{
				targets: '_all',
				render: function(data, type, row, meta) {
					return data.replace(/<p[^>]*>(.+)<\/p>/s, "$1"); // doesn't remove links
				}
			},
			{
				targets: [1, 2],
				searchPanes: {
					threshold: 0.8
				}
			},
			{
				targets: [2],
				className: 'dt-body-right'
			},
			{
				targets: [0],
				searchPanes: {
					show: false,
				}
			}
		],
		searchPanes: {
			controls: false,
			layout: 'columns-2'
		}
	});

	$('OLDtable.dt-allassociations').DataTable({
		"paging": true,
		"dom": '<"legend-allassociations">Plifprtlifp',
		"order": [[1, 'asc'], [2, 'asc'], [10, 'asc'], [11, 'asc']],
		select: true,
		iDisplayLength: 50,
		lengthMenu: [
			[10, 25, 50, -1],
			[10, 25, 50, "All"]
		],
		//        dom: 'lfBPrtip',
		columnDefs: [{
			"targets": 11, // won't be overwritten by second render below
			// The 'data' parameter refers to the data for the cell (defined by the
			// 'data' option, which defaults to the column being worked with).
			"render": function(data, type, row, meta) {
				return '<button type="button" class="link" ' +
					'onclick="selectPackage( $(this).text() )" ' +
					'title="Show package coupling">' +
					data.replace(/<p[^>]*>(.+)<\/p>/s, "$1") + // doesn't remove links
					//                        data.replace(/(<([^>]+)>)/gi, '') +
					'</button>';
			}
		},
		{
			targets: '_all',
			render: function(data, type, row, meta) {
				return data.replace(/<p[^>]*>(.+)<\/p>/s, "$1"); // doesn't remove links
				//                    return data.replace(/(<([^>]+)>)/gi, '');
			}
		},
		{
			targets: [0, 3, 5, 5, 7, 9],
			className: 'dt-body-center'
		},
		{
			targets: [3, 4, 5, 7, 8, 9],
			//                targets: [3, 4, 5, 6, 8, 9, 10, 11],
			searchPanes: {
				show: false
			},
		},
		],
		searchPanes: {
			controls: false,
			cascadePanes: true,
			orderable: false,
			layout: 'columns-6',
			scrollX: false,
			dtOpts: {
				"columnDefs": [{
					"targets": 0,
					"render": function(data, type, row, meta) {
						return '<div class="dtsp-nameCont"><span class="dtsp-name">' +
							data.replace(/<p[^>]*>(.+)<\/p>/s, "$1") + // doesn't remove links
							//                            data.replace(/(<([^>]+)>)/gi, '') +
							'</span><span class="dtsp-pill">' +
							row.total +
							'</span></div>';
					}
				}]
			}
		},
		buttons: [
			'csv', 'excel', 'print'
		]
	});

	$("div.legend-allassociations").html("Green underlined links in column 'Package 2' go to the list of associated packages of the clicked package.");

	$('div.dtsp-searchPane div.dtsp-topRow div.dtsp-searchCont input.dtsp-search').each(function(i) {
		var placeholderWithoutHtml = $(this).attr('placeholder').replace(/<p[^>]*>(.+)<\/p>/, "$1");
		//        var placeholderWithoutHtml = $(this).attr('placeholder').replace(/(<([^>]+)>)/gi, '');
		$(this).attr('placeholder', placeholderWithoutHtml);
	});

	// pan and zoom
	// see https://timmywil.com/panzoom/
	/* issue: events are not active in svg area
	const element = document.querySelector('div#id2');
	const panzoom = Panzoom(element, {
		  // options here
	});
	const parent = element.parentElement;
	parent.addEventListener('dblclick', panzoom.reset);
	parent.addEventListener('wheel', function (event) {
	  if (!event.shiftKey) return
	  panzoom.zoomWithWheel(event);
	})
	*/
	// css for all leaf entries
	$('li:not( :has( a[href*="index.html"].reference.internal ) ):not( :has( ul ) )').css('list-style', 'none').addClass('dot');
	// applies the current item hierarchy in the sidebar toc
	//	$('li:has( a[href="#"].reference.internal )').css('color', 'red'); already available as current class

});

// TODO is this not just a package or is it specific to cdi?
function selectPackage(cdiPackage) {
	$('table.dt-allassociations').DataTable().searchPanes.clearSelections();
	selectRow(0, 'yes'); // package coupling
	selectRow(1, cdiPackage);
}

function selectRow(paneNumber, searchString) {
	// Select the desired pane from the dom
	var table = $($('div.dtsp-searchPane div.dataTables_scrollBody table')[paneNumber]).DataTable();
	var rows = table.rows().toArray(); // Get the row data for that pane
	// Iterate over the rows until search string is found, then select that row
	for (var i = 0; i < rows[0].length; i++) {
		var row = table.row(rows[0][i]);
		if (row.data().filter === searchString) {
			row.select();
		}
	}
}

/*
Overwrite of functions in sidebar.js.
Use of sessionStorage instead of document.cookie.
The latter is not allowed for the file protocol in some browsers (i.e. Chrome, Opera)
*/

function collapse_sidebar() {
	sidebarwrapper.hide();
	sidebar.css('width', ssb_width_collapsed);
	bodywrapper.css('margin-left', bw_margin_collapsed);
	sidebarbutton.css({
		'margin-left': '0',
		'height': bodywrapper.height()
	});
	sidebarbutton.find('span').text('»');
	sidebarbutton.attr('title', _('Expand sidebar'));
	//  sessionStorage.setItem("sidebar", "collapsed");
	window.name = "collapsed";
}

function expand_sidebar() {
	bodywrapper.css('margin-left', bw_margin_expanded);
	sidebar.css('width', ssb_width_expanded);
	sidebarwrapper.show();
	sidebarbutton.css({
		'margin-left': ssb_width_expanded - 12,
		'height': bodywrapper.height()
	});
	sidebarbutton.find('span').text('«');
	sidebarbutton.attr('title', _('Collapse sidebar'));
	//  sessionStorage.setItem("sidebar", "expanded");
	window.name = "expanded";
}

function set_position_from_cookie() {
	if (!sessionStorage.sidebar)
		return;
	//  value = sessionStorage.getItem("sidebar");
	value = window.name;
	if ((value == 'collapsed') && (!sidebar_is_collapsed()))
		collapse_sidebar();
	else if ((value == 'expanded') && (sidebar_is_collapsed()))
		expand_sidebar();
}

/**
 * @summary     ConditionalPaging
 * @description Hide paging controls when the amount of pages is <= 1
 * @version     1.0.0
 * @file        dataTables.conditionalPaging.js
 * @author      Matthew Hasbach (https://github.com/mjhasbach)
 * @contact     hasbach.git@gmail.com
 * @copyright   Copyright 2015 Matthew Hasbach
 *
 * License      MIT - http://datatables.net/license/mit
 *
 * This feature plugin for DataTables hides paging controls when the amount
 * of pages is <= 1. The controls can either appear / disappear or fade in / out
 *
 * @example
 *    $('#myTable').DataTable({
 *        conditionalPaging: true
 *    });
 *
 * @example
 *    $('#myTable').DataTable({
 *        conditionalPaging: {
 *            style: 'fade',
 *            speed: 500 // optional
 *        }
 *    });
 */

// from https://github.com/DataTables/Plugins/blob/master/features/conditionalPaging/dataTables.conditionalPaging.js
// works! but only for paging control not for info and search
(function(window, document, $) {
	$(document).on('init.dt', function(e, dtSettings) {
		if (e.namespace !== 'dt') {
			return;
		}

		var options = dtSettings.oInit.conditionalPaging || $.fn.dataTable.defaults.conditionalPaging;

		if ($.isPlainObject(options) || options === true) {
			var config = $.isPlainObject(options) ? options : {},
				api = new $.fn.dataTable.Api(dtSettings),
				speed = 'slow',
				conditionalPaging = function(e) {
					var $paging = $(api.table().container())
						.find('div.dataTables_filter, div.dataTables_paginate'),
						// JW                   var $paging = $(api.table().container()).find('div.dataTables_paginate'),
						pages = api.page.info().pages;

					if (e instanceof $.Event) {
						if (pages <= 1) {
							if (config.style === 'fade') {
								$paging.stop().fadeTo(speed, 0);
							}
							else {
								$paging.css('display', 'none');
								// JW                               $paging.css('visibility', 'hidden');
							}
						}
						else {
							if (config.style === 'fade') {
								$paging.stop().fadeTo(speed, 1);
							}
							else {
								$paging.css('display', '');
								// JW                                $paging.css('visibility', '');
							}
						}
					}
					else if (pages <= 1) {
						if (config.style === 'fade') {
							$paging.css('opacity', 0);
						}
						else {
							$paging.css('display', 'none');
							// JW                            $paging.css('visibility', 'hidden');
						}
					}
				};

			if (config.speed !== undefined) {
				speed = config.speed;
			}

			conditionalPaging();

			api.on('draw.dt', conditionalPaging);
		}
	});
})(window, document, jQuery);
// which is better?
// });
