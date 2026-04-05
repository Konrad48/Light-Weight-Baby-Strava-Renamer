# Light-Weight-Baby-Strava-Renamer
Are you tired of boring Strava activity names like "Lunch Run" or "Evening hike"?

Well, look no further. This Google Apps Script automatically renames your Strava activities in [Ronnie Coleman](https://www.youtube.com/watch?v=8BNP126zgPU) style.

New activity name is a combination of words from two lists of strings. It avoids renaming the same activity more than once. Lists:
```javascript
const listOne = ["Oooh", "Yeah", "Yep", "Light Weight", "Pow", "Let's Gooo", "Gotta Get Good", "Come On"];
const listTwo = ["Buddy", "Baby"];
```

## Steps to Set Up the Script

### 1. **Authenticate with the Strava API**

- Go to the [Strava Developers Portal](https://developers.strava.com/docs/getting-started).
- Create a new application and generate your API credentials.
- Obtain initial 'refresh_token' by authorizing your application via OAuth 2.0 for API access. Importat, you'll need the following permissions: **read,activity:read,activity:write**

---

### 2. **Create the Script in Google Apps Script**

#### a. Create a New Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com/).
2. Create a new project by clicking on **New Project**.

#### b. Add the Script Code

1. Copy the entire code from this repository into the editor.
2. Replace the following variables with the ones obtained for your account.

```javascript
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const INITIAL_REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN';
```
#### c. Add activity types for renaming (optional)

For example if you only want to rename your "Heavy Stone Lift, Make Sad Head Voice Quiet" activities, fill it like this:

```javascript
const ACTIVITY_TYPES_TO_RENAME = ['WeightTraining'];
```

#### d. Save the Script

### 3. Set Up the Hourly Trigger
The script includes a function createHourlyTrigger to set up a trigger for running the renameStravaActivitiesHourly function every hour.

1. In the Google Apps Script editor, select the createHourlyTrigger function from the dropdown.
2. Run the function, it will create hourly trigger for you.

## Now you can flex with your perfectly named Strava activities 🏅
![Ronnie](./light_weight.png)

