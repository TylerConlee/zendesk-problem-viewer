# Zendesk Problem Ticket Summary

This is a Zendesk App that shows the summary of associated tickets marked as Incident on a given problem. This includes the organizations associated with the incident and their MRR.

### The following information is displayed:

* Number of Organizations
* Names of Organizations
* Associated Ticket
* Total Combined ARR


This app now updates fields only on problem tickets. Within `main.js`, be sure to update the field IDs with the custom fields that represent the number of affected customers, the names of the organizations, and the ARR of the customers in question. 

Please submit bug reports to [the Issues page](https://github.com/TylerConlee/zendesk-problem-viewer/issues). Pull requests are welcome.


