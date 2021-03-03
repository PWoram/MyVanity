const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({
	region: 'us-east-1',
	apiVersion: '2012-08-10',
});
var checkWord = require('check-word'),
	words = checkWord('en');

const phoneDigitsToLetters = {
	0: '0',
	1: '1',
	2: 'abc',
	3: 'def',
	4: 'ghi',
	5: 'jkl',
	6: 'mno',
	7: 'pqrs',
	8: 'tuv',
	9: 'wxyz',
};

//helper function to return substrings from a phone number
const numberSubStrings = function (phoneNumber) {
	var subStrings = [];

	for (var i = 0; i < phoneNumber.length; i++) {
		subStrings.push(phoneNumber.slice(i));
	}
	return subStrings;
};

//primary function to convert a number string into words
const generateWords = function (numberString) {
	if (!numberString.length) {
		return [''];
	}

	var digitsArray = numberString.split('');
	var results = [];

	//inner recursive function to generate letter combinations from phone number digits
	var lettersFromDigits = function (word, digitsArray) {
		//base case: if no digits remain, check whether a word is formed and if so push to results array
		if (!digitsArray.length) {
			if (words.check(word)) {
				results.push(word);
			}
			return;
		}
		//recursive case: take current digit from digitsArray
		var letters = phoneDigitsToLetters[digitsArray[0]];

		for (var i = 0; i < letters.length; i++) {
			lettersFromDigits(word + letters[i], digitsArray.slice(1));
		}
	};
	lettersFromDigits('', digitsArray);

	return results;
};

//handler method to store data in dynamoDB table
module.exports.handler = (event, context, callback) => {
	var inputNumber = event.Details.ContactData.CustomerEndpoint.Address.slice(8);
	var subStrings = numberSubStrings(inputNumber);
	subStrings = subStrings.slice(0, 4);
	var vanityNumbers = [];
	subStrings.forEach((subString) =>
		vanityNumbers.push(generateWords(subString))
	);
	var results = vanityNumbers.flat();
	//loop through results array to make sure the first five indicies are defined
	for (var i = 0; i < 5; i++) {
		if (results[i]) {
			continue;
		} else {
			results[i] = 'none';
		}
	}

	const params = {
		Item: {
			phoneNumber: {
				S: event.Details.ContactData.CustomerEndpoint.Address,
			},
			vanityName: {
				S: results[0],
			},
			vanityNameTwo: {
				S: results[1],
			},
			VanityNameThree: {
				S: results[2],
			},
			VanityNameFour: {
				S: results[3],
			},
			VanityNameFive: {
				S: results[4],
			},
		},
		TableName: 'vanityNumbersTable',
	};
	dynamodb.putItem(params, function (err, data) {
		if (err) {
			console.log('there was an error:', err);
			callback(err);
		} else {
			console.log(data);
			callback(null, data);
		}
	});
};

// console.log('Vanity numbers: ', vanityNumbers.flat());
