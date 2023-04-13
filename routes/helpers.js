const User = require("../models/user.model");

function getFieldFrequency(searchField, arrayOfObjects) {
    return arrayOfObjects.reduce((acc, currentObject) => (acc[currentObject[searchField]] = (acc[currentObject[searchField]] || 0) + 1, acc), {})
}

async function getProfilesOfPeopleInFrequencyMap(frequencyMap) {
    return await User.find({
        username: {$in: Object.keys(frequencyMap)}
    }, {_id: 0, picture: 1, displayName: 1, username: 1}).lean();
}

function addFieldFrequencyToProfiles(frequencyName, profileArray, frequencyMap){
    return profileArray.map((profile) => ({
        ...profile,
        [frequencyName]: frequencyMap[profile.username],
    }));
}

async function getFieldFrequencyAndProfilesSorted(fieldName, frequencyName, arrayOfObjects) {
    const frequencyMap = getFieldFrequency(fieldName, arrayOfObjects);
    const profilesInMap = await getProfilesOfPeopleInFrequencyMap(frequencyMap);
    const countsAndProfile = addFieldFrequencyToProfiles(frequencyName, profilesInMap, frequencyMap);
    const sortedResult = countsAndProfile.sort((a , b) => b[frequencyName] - a[frequencyName]);
    return sortedResult;
}

async function getProfileInformationFromArrayOfUsernames(usernames) {
    return await User.find({
        username: {$in : usernames}
    }, {_id: 0, picture: 1, displayName: 1, username: 1}).lean();
}

function getObjectWithMapping(arrayOfProfiles) {
    return arrayOfProfiles.reduce((map, obj) => (map[obj.username] = obj, map), {})
}

async function appendProfileInformationToArrayOfObjectsWithUsername(arrayOfObjects, usernames) {
    const profiles = await getProfileInformationFromArrayOfUsernames(usernames)

    const profileInformationDictionary = getObjectWithMapping(profiles);

    return arrayOfObjects.map((object) => ({
        ...object,
        picture: profileInformationDictionary[object.username]["picture"],
        displayName: profileInformationDictionary[object.username]["displayName"]
    }))
}

module.exports.getFieldFrequencyAndProfilesSorted = getFieldFrequencyAndProfilesSorted;
module.exports.appendProfileInformationToArrayOfObjectsWithUsername = appendProfileInformationToArrayOfObjectsWithUsername;