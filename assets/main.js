var orgs = [];
$(function() {
    // Initialise the Zendesk JavaScript API client
    // https://developer.zendesk.com/apps/docs/apps-v2
    var client = ZAFClient.init();
    client.get('ticket.type').then(function(data) {
      	if (data['ticket.type'] === 'problem') {
        	client.get('ticket.id').then(function(data) {
          		var ticket = data['ticket.id'];
          		getIncidents(ticket)
      		},
      		function(response) {
        		showError(response);
      		});
      	}
    });
});

function getIncidents(ticket){
  	var client = ZAFClient.init();
  	var fetchSelf = {
		url: '/api/v2/tickets/' + ticket + '/incidents.json',
		type: 'GET',
		dataType: 'json'
  	};
  	client.request(fetchSelf).then(function(data) {
    	data.tickets.forEach(function(ticket){
			var org = new Object();
			n = getOrgName(ticket.organization_id).then(function(name){return name}).then(name => {
				org.name = name;
				console.log(org.name)
				var i = ticket.custom_fields.findIndex( (el) => el.id === 80756047);
				org.mrr = ticket.custom_fields[i].value;
				orgs.push(org)
				return name
			});
		});
		return orgs
  	}).finally(function(){
		setTimeout(function(){
		showInfo(orgs)
	});
  	},function(response) {
    	showError(response);
  	});
}

function getOrgName(id){
  	var client = ZAFClient.init();
  	var fetchSelf = {
    	url: '/api/v2/organizations/' + id + '.json',
    	type: 'GET',
    	dataType: 'json'
  	};
  	var name = client.request(fetchSelf).then(function(data) {
    	return data.organization.name
	});
	return name;
}


function showInfo(data) {
	  var total = 0;
	  console.log(data)
  	data.forEach(function(m) {
    	total = parseInt(m.mrr)+total;
  	});
  	var templatedata = {
    	'data': data,
    	'totalmrr': total,
  	};
  	console.log(templatedata)
  	var source = $("#requester-template").html();
  	var template = Handlebars.compile(source);
  	var html = template(templatedata);
  	$("#content").html(html);
}

function showError() {
  	var error_data = {
    	'status': response.status,
    	'statusText': response.statusText
  	};
  	var source = $("#error-template").html();
  	var template = Handlebars.compile(source);
  	var html = template(error_data);
  	$("#content").html(html);
}