/*************************************************
 * USER MUST PROVIDE THESE VALUES (see instructions)
 *************************************************/
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const INITIAL_REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN';

/*************************************************
 * ACTIVITY TYPE FILTER
 * Leave empty [] to rename ALL activity types.
 * Fill with Strava activity types to rename only those.
 * Examples: 'Run', 'Ride', 'Swim', 'Walk', 'Hike',
 *           'WeightTraining', 'Workout', 'Yoga', etc.
 *************************************************/
const ACTIVITY_TYPES_TO_RENAME = []; // e.g. ['WeightTraining']

/**************************************
 * MAIN FUNCTION (Scheduled hourly)
 **************************************/
function renameStravaActivitiesHourly() {
  try {
    // 1. Get a valid access token (refresh if needed)
    const accessToken = getStravaAccessToken();

    // 2. Get recent activities (last 24h)
    const recentActivities = getRecentActivities(accessToken);

    // 3. Rename if not already renamed
    renameUnchangedActivities(recentActivities, accessToken);

  } catch (error) {
    Logger.log("Error in renameStravaActivitiesHourly: " + error);
  }
}

/************************************************
 * HELPER: Retrieve a valid access token
 *         Refresh if it's expired or missing
 ************************************************/
function getStravaAccessToken() {
  const scriptProperties = PropertiesService.getScriptProperties();

  // Attempt to load existing tokens and expiry from script properties
  let accessToken = scriptProperties.getProperty("STRAVA_ACCESS_TOKEN");
  let refreshToken = scriptProperties.getProperty("STRAVA_REFRESH_TOKEN");
  let expiresAt = scriptProperties.getProperty("STRAVA_EXPIRES_AT");

  // If we have no prior stored tokens, use the user-provided INITIAL_REFRESH_TOKEN
  if (!accessToken || !refreshToken || !expiresAt) {
    Logger.log("No stored token data found. Using INITIAL_REFRESH_TOKEN to get tokens...");
    refreshToken = INITIAL_REFRESH_TOKEN;
    return refreshAccessToken(refreshToken);
  }

  // Convert stored expiresAt string to a number
  expiresAt = Number(expiresAt);
  const now = Math.floor(Date.now() / 1000);

  // If current time is past the token expiration, refresh
  if (now >= expiresAt) {
    Logger.log("Access token expired at " + expiresAt + ". Refreshing...");
    return refreshAccessToken(refreshToken);
  }

  // Otherwise, return valid token
  return accessToken;
}

/************************************************
 * HELPER: Refresh the access token
 ************************************************/
function refreshAccessToken(oldRefreshToken) {
  // Strava OAuth token endpoint
  const tokenUrl = 'https://www.strava.com/api/v3/oauth/token';

  // Build payload for refresh
  const payload = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: oldRefreshToken
  };

  const options = {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(tokenUrl, options);
  if (response.getResponseCode() !== 200) {
    throw new Error("Failed to refresh Strava token: " + response.getContentText());
  }

  const data = JSON.parse(response.getContentText());

  /*
    Example response structure:
    {
      "token_type": "Bearer",
      "access_token": "example_access_token",
      "expires_at": 1735915347,
      "expires_in": 21532,
      "refresh_token": "example_refresh_token"
    }
  */

  // Save new tokens in script properties
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty("STRAVA_ACCESS_TOKEN", data.access_token);
  scriptProperties.setProperty("STRAVA_REFRESH_TOKEN", data.refresh_token);
  scriptProperties.setProperty("STRAVA_EXPIRES_AT", String(data.expires_at));

  Logger.log("Refreshed Access Token. Expires at: " + data.expires_at);

  return data.access_token;
}

/************************************************
 * HELPER: Get the recent (last 24h) activities
 ************************************************/
function getRecentActivities(accessToken) {
  // Unix timestamp for 24 hours ago
  const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  const url = `https://www.strava.com/api/v3/athlete/activities?after=${oneDayAgo}`;

  const options = {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    return JSON.parse(response.getContentText());
  } else {
    throw new Error('Error fetching activities: ' + response.getContentText());
  }
}

/************************************************
 * HELPER: Rename Activities If Not Renamed Yet
 ************************************************/
function renameUnchangedActivities(activities, accessToken) {
  // Two lists of words to pick from
  const listOne = ["Oooh", "Yeah", "Yep", "Light Weight", "Pow", "Let's Gooo", "Gotta Get Good", "Come On"];
  const listTwo = ["Buddy", "Baby"];

  // Retrieve or create a property to track renamed IDs
  const scriptProperties = PropertiesService.getScriptProperties();
  const renamedActivityIdsString = scriptProperties.getProperty('renamedActivityIds') || '[]';
  let renamedActivityIds = JSON.parse(renamedActivityIdsString);

  // For each activity in the last 24h
  for (const activity of activities) {
    const activityId = activity.id;
    const currentName = activity.name;
    const activityType = activity.sport_type || activity.type;

    // Skip if activity type filter is set and this type isn't in the list
    if (ACTIVITY_TYPES_TO_RENAME.length > 0 && !ACTIVITY_TYPES_TO_RENAME.includes(activityType)) {
      Logger.log(`Skipping activity ID ${activityId} — type "${activityType}" not in filter`);
      continue;
    }

    // Skip if we've already renamed this activity
    if (renamedActivityIds.includes(activityId)) {
      continue;
    }

    // Generate the new name
    // e.g., "Oooh Baby" or "Light Weight Buddy"
    const randomIndexOne = Math.floor(Math.random() * listOne.length);
    const randomIndexTwo = Math.floor(Math.random() * listTwo.length);
    const newName = listOne[randomIndexOne] + " " + listTwo[randomIndexTwo];

    // Call Strava API to update the activity name
    const updateUrl = `https://www.strava.com/api/v3/activities/${activityId}`;
    const options = {
      method: 'put',
      payload: {
        name: newName
      },
      headers: {
        Authorization: 'Bearer ' + accessToken
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(updateUrl, options);
    if (response.getResponseCode() === 200) {
      // Mark this activity as renamed
      renamedActivityIds.push(activityId);
      Logger.log(`Renamed activity ID ${activityId} from "${currentName}" to "${newName}"`);
    } else {
      Logger.log(`Failed to rename activity ID ${activityId}: ` + response.getContentText());
    }
  }

  // Save the updated list of renamed IDs
  scriptProperties.setProperty('renamedActivityIds', JSON.stringify(renamedActivityIds));
}

/************************************************
 * OPTIONAL: Create a time-based trigger (once)
 ************************************************/
// Run this function once manually to set up an hourly trigger
function createHourlyTrigger() {
  ScriptApp.newTrigger('renameStravaActivitiesHourly')
    .timeBased()
    .everyHours(1)
    .create();
}
