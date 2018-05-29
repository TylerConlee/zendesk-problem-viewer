$(function() {
    // Initialise the Zendesk JavaScript API client
    // https://developer.zendesk.com/apps/docs/apps-v2
    var client = ZAFClient.init();
    client.invoke('resize', { width: '100%', height: '200px' });
});

function showInfo() {
    var requester_data = {
      'mrr': '32100',
      'organization': ['org', 'org2'],
    };
  
    var source = $("#requester-template").html();
    var template = Handlebars.compile(source);
    var html = template(requester_data);
    $("#content").html(html);
}
function showError() {
    var error_data = {
      'status': 404,
      'statusText': 'Not found'
    };
    var source = $("#error-template").html();
    var template = Handlebars.compile(source);
    var html = template(error_data);
    $("#content").html(html);
}  