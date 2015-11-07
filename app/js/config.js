'use strict';

var perfDashboardConfig = angular.module('perfDashboardConfig', []);


// google charts configuration
perfDashboardConfig.constant('CHARTS_OPTIONS', {
    area: {
		height: 400,
        vAxis: {
            minValue: 0,
        },
		legend: {
			position: 'top',
		},
        animation: {
            duration: 1000,
            easing: 'out',
        },
        chartArea: {
            top: 30,
            height: 330,
            width: '85%',
        },
        explorer: { 
            //axis: 'horizontal',
            actions: ['dragToZoom', 'rightClickToReset'],
            maxZoomIn: 0.1,
        },
        focusTarget: 'category',
	},
    sparkline: {
        backgroundColor: 'none',
        vAxis: {
            minValue: 0,
            baselineColor: 'none',
            gridlines: {
                count: 0,
            },
        },
        hAxis: {
            baselineColor: 'none',
            gridlines: {
                count: 0,
            },
        },
        chartArea: {
            height: '100%',
            width: '100%',
        },
        axisTitlesPosition: 'none',
        legend: {
            position: 'none',
        },
        animation: {
            duration: 1000,
            easing: 'out',
        },
        focusTarget: 'category'
    },
	geo: {
		region: '150',
		colorAxis: {minValue: 0,  colors: ['e8f5ff', '044c84']},
		magnifyingGlass: {
			enable: true,
			zoomFactor: 7.5, 
		},
	},
	column: {
		height: 400,
		legend: {
			position: 'top',
		},
        animation: {
            duration: 1000,
            easing: 'out',
        },
        chartArea: {
            top: 30,
            height: 330,
            width: '85%',
        },
        focusTarget: 'category',
	},
	pie: {
	  	height: 400,
		legend: {
			position: 'right',
		},
        animation: {
            duration: 1000,
            easing: 'out',
        },
        chartArea: {
            top: 20,
            height: 350,
            width: '100%',
        },
        //pieHole: 0.4,
        is3D: true,
	},
    sparkpie: {
        backgroundColor: 'none',
        chartArea: {
            height: '100%',
            width: '100%',
        },
        legend: {
            position: 'none',
        },
        animation: {
            duration: 1000,
            easing: 'out',
        },
        is3D: true
    },
	gauge: {
		width: 300,
		height: 300,
		max: 400,
		redFrom: 0,
		redTo: 30,
        yellowFrom:30,
        yellowTo: 90,
        minorTicks: 5,
	},
    combo: {
        height: 400,
        vAxis: {
            minValue: 0,
        },
        legend: {
            position: 'top',
        },
        animation: {
            duration: 1000,
            easing: 'out',
        },
        chartArea: {
            top: 30,
            height: 330,
            width: '85%',
        },
        explorer: { 
            actions: ['dragToZoom', 'rightClickToReset'],
            maxZoomIn: 0.1,
        },
        focusTarget: 'category',
        colors: ['#c8ebff', '#ffb0b9', '#ff9900', '#109618', '#0099c6', '#990099', '#3366cc', '#dc3912', '#c4bfbf', '#878282']
    },
    sparkcombo: {
        backgroundColor: 'none',
        vAxis: {
            minValue: 0,
            baselineColor: 'none',
            gridlines: {
                count: 0,
            },
        },
        hAxis: {
            baselineColor: 'none',
            gridlines: {
                count: 0,
            },
        },
        chartArea: {
            height: '100%',
            width: '100%',
        },
        axisTitlesPosition: 'none',
        legend: {
            position: 'none',
        },
        animation: {
            duration: 1000,
            easing: 'out',
        },
        focusTarget: 'category',
        colors: ['#c8ebff', '#ffb0b9', '#ff9900', '#109618', '#0099c6', '#990099', '#3366cc', '#dc3912', '#c4bfbf', '#878282']
    }
});

// tables configuration
perfDashboardConfig.constant('DATA_TABLE_DEFAULT_OPTIONS', {
    paging: true,
    lengthMenu: [10, 25, 50, 100],
    language: {
        search: "Rechercher : ",
        zeroRecords: "Aucun résultat",
        emptyTable : "Aucun résultat",
        lengthMenu: "&Eacute;lement par page : _MENU_",
        info: "_START_ &agrave; _END_ sur _TOTAL_ &eacute;l&eacute;ments",
        infoEmpty: "0 &eacute;l&eacute;ment",
        infoFiltered: "(_MAX_ &eacute;l&eacute;ments au total)",
        paginate: {
            first: "Premier",
            previous: "Pr&eacute;c&eacute;dent",
            next: "Suivant",
            last: "Dernier"
        },
        aria: {
            sortAscending: ": Activer pour trier la colonne par ordre croissant",
            sortDescending: ": Activer pour trier la colonne par ordre décroissant"
        }
    }
});

// count up-down configuration
perfDashboardConfig.constant('COUNT_OPTIONS', {
    useEasing: true,
    useGrouping: true,
    separator: ' ',
    decimal: '.'
});