const User = require("../models/user.model");

function getFieldFrequency(searchField, arrayOfObjects) {
    return arrayOfObjects.reduce((acc, currentObject) => (acc[currentObject[searchField]] = (acc[currentObject[searchField]] || 0) + 1, acc), {})
}

async function getSortedFieldFrequency(fieldName, arrayOfObjects) {
    const frequencyMap = getFieldFrequency(fieldName, arrayOfObjects);
    const sortedResult = Object.entries(frequencyMap).sort(([,a]  , [,b]) => b - a);
    return sortedResult;
}


module.exports.getSortedFieldFrequency = getSortedFieldFrequency;