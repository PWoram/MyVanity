var AWS = require('aws-sdk');
var docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
	var phoneNumber = event.Details.ContactData.CustomerEndpoint.Address;
	var paramsQuery = {
		TableName: 'vanityNumbersTable',
		KeyConditionExpression: 'phoneNumber = :varNumber',
		IndexName: 'phoneNumber-index',

		ExpressionAttributeValues: {
			':varNumber': phoneNumber,
		},
	};

	docClient.query(paramsQuery, function (err, data) {
		if (err) {
			console.log(err); // an error occurred
			context.fail(buildResponse(false));
		} else {
			console.log('DynamoDB Query Results:' + JSON.stringify(data));

			if (data.Items.length === 1) {
				console.log(data.Items[0].vanityName);
				var vanityName = data.Items[0].vanityName;
				callback(null, buildResponse(true, vanityName));
			} else {
				console.log('PhoneNumber not found');
				callback(null, buildResponse(true, 'none'));
			}
		}
	});
};

function buildResponse(isSuccess, vanityName) {
	if (isSuccess) {
		return {
			vanityName: vanityName,
			lambdaResult: 'Success',
		};
	} else {
		console.log('Lambda returned error to Connect');
		return { lambdaResult: 'Error' };
	}
}
