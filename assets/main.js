var orgs = [];
$(function() {
    var client = ZAFClient.init();
    client.invoke('resize', { width: '100%', height: '200px' });
    client.get('ticket.type').then(function(data) {
        if (data['ticket.type'] === 'problem') {
            client.invoke('show');
            client.get('ticket.id').then(function(data) {
                var ticket = data['ticket.id'];
                updateJiraKeyInTitle(ticket);
                getIncidents(ticket);
            },
            function(response) {
                showError(response);
            });
        } else {
            var source = $("#non-problem-template").html();
            var template = Handlebars.compile(source);
            var html = template();
            $("#content").html(html);
            client.invoke('hide');
        }   
    });
});

function getIncidents(ticket) {
    var client = ZAFClient.init();
    var fetchSelf = {
        url: '/api/v2/tickets/' + ticket + '/incidents.json',
        type: 'GET',
        dataType: 'json'
    };
    client.request(fetchSelf).then(function(data) {
        data.tickets.forEach(function(ticket) {
            var org = {};
            if (Number.isInteger(ticket.organization_id)) {
                getOrgName(ticket.organization_id).then(function(orgData) {
                    org.name = orgData.name;
                    org.mrr = orgData.mrr;
                    org.id = ticket.organization_id;
                    org.ticketID = ticket.id;
                    orgs.push(org);
                });
            }
        });

        // Count the number of incidents
        var incidentCount = data.tickets.length;

        // Update the ticket field with the incident count
        updateIncidentCount(ticket, incidentCount);

    }).finally(function() {
        setTimeout(function() {
            checkOrgFinished(ticket); // Pass the ticket ID here
        }, 1000);
    }, function(response) {
        showError(response);
    });
}


function getOrgName(id) {
    var client = ZAFClient.init();
    var fetchSelf = {
        url: '/api/v2/organizations/' + id + '.json',
        type: 'GET',
        dataType: 'json'
    };
    return client.request(fetchSelf).then(function(data) {
        var orgName = data.organization.name;
        var orgMRR = data.organization.organization_fields['sf_renewal_arr']; // Retrieve the custom organization field for MRR
        return {
            name: orgName,
            mrr: orgMRR
        };
    });
}

function updateIncidentCount(ticket, count) {
    var client = ZAFClient.init();
    var updateTicket = {
        url: '/api/v2/tickets/' + ticket + '.json',
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            "ticket": {
                "custom_fields": [
                    {
                        "id": 30497647819277,  // Replace with your actual custom field ID
                        "value": count
                    }
                ]
            }
        })
    };

    client.request(updateTicket).then(function(response) {
        console.log('Incident count updated successfully.');
    }, function(response) {
        showError(response);
    });
}


function updateJiraKeyInTitle(ticketId) {
    var client = ZAFClient.init();
    
    // Retrieve the ticket title and Jira ID custom field
    client.get(['ticket.subject', `ticket.customField:custom_field_${19466341226765}`]).then(function(data) {
        var ticketTitle = data['ticket.subject'];
        var jiraId = data[`ticket.customField:custom_field_${19466341226765}`];

        // If there's no Jira ID, do nothing
        if (!jiraId) return;

        // Check if the title already starts with a Jira issue key
        var jiraKeyPattern = /^[A-Z]+-\d+/; // Regex for Jira key format
        var matches = ticketTitle.match(jiraKeyPattern);

        if (matches) {
            // If the Jira key in the title differs from the custom field, update the title
            if (matches[0] !== jiraId) {
                var newTitle = `${jiraId} - ${ticketTitle.replace(jiraKeyPattern, '').trim()}`;
                updateTicketTitle(ticketId, newTitle);
            }
        } else {
            // If no Jira key is present, prepend it to the title
            var newTitle = `${jiraId} - ${ticketTitle}`;
            updateTicketTitle(ticketId, newTitle);
        }
    }, function(response) {
        showError(response);
    });
}

function updateTicketTitle(ticketId, newTitle) {
    var client = ZAFClient.init();
    
    var updateData = {
        "ticket": {
            "subject": newTitle
        }
    };

    var updateRequest = {
        url: `/api/v2/tickets/${ticketId}.json`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(updateData)
    };

    client.request(updateRequest).then(function(response) {
        console.log('Ticket title updated successfully.');
    }, function(response) {
        showError(response);
    });
}


function showInfo(data) {
    var total = 0;
    data.forEach(function(m) {
        t = parseInt(m.mrr);
        if ((m.mrr != null) && (t > 0)) {
            total = parseInt(m.mrr) + total;
        }
    });

    var templatedata = {
        'data': data,
        'totalmrr': total,
        'totalcustomer': data.length,
    };
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

function checkOrgFinished(ticket) {
    if (orgs.length > 0 && orgs[0].name != "") {
        showInfo(orgs);

        // Gather organization names and sum up ARR values
        var orgNames = orgs.map(org => org.name).join(', ');
        var totalARR = orgs.reduce((sum, org) => sum + (parseInt(org.mrr) || 0), 0);

        // Update the problem ticket with organization names and ARR values
        updateProblemTicket(ticket, orgNames, totalARR);
    }
}

function updateProblemTicket(ticket, orgNames, totalARR) {
    var client = ZAFClient.init();

    // Retrieve the current content of the organization names field
    client.get(`ticket.customField:custom_field_${31859992610573}`).then(function(data) {
        var currentOrgNames = data[`ticket.customField:custom_field_${31859992610573}`] || "";

        // Process current organization names: split, trim, and filter out blanks
        var existingOrgs = currentOrgNames
            .split(',')
            .map(name => name.trim())
            .filter(name => name !== "");

        // Process new organization names: split, trim, and filter out blanks
        var newOrgs = orgNames
            .split(',')
            .map(name => name.trim())
            .filter(name => name !== "");

        // Combine both arrays and ensure uniqueness
        var updatedOrgNames = Array.from(new Set(existingOrgs.concat(newOrgs))).join(', ');

        // Prepare the update data
        var updateData = {
            "ticket": {
                "custom_fields": [
                    {
                        "id": 31859992610573, // Custom field ID for organization names (multi-line)
                        "value": updatedOrgNames
                    },
                    {
                        "id": 31860050947085, // Custom field ID for ARR (numeric)
                        "value": totalARR
                    }
                ]
            }
        };

        // Update the ticket with the cleaned organization names and ARR values
        var updateTicket = {
            url: '/api/v2/tickets/' + ticket + '.json',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(updateData)
        };

        client.request(updateTicket).then(function(response) {
            console.log('Problem ticket fields updated successfully with cleaned organization names.');
        }, function(response) {
            showError(response);
        });
    }, function(response) {
        showError(response);
    });
}
