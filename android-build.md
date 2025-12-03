# Building Android APK with Capacitor

This guide will help you convert the React Native web application to an Android APK using Capacitor.

## Prerequisites

1. Install Android Studio
2. Install JDK 11 or newer
3. Set up Android SDK and environment variables

## Steps to Build Android APK

### 1. Install Required Dependencies

First, make sure you have all the required dependencies installed:

```bash
npm install @capacitor/core @capacitor/android
npm install -g @capacitor/cli
```

### 2. Build the React Native Web App

Build your React Native web application:

```bash
npm run build
```

This will create a `build` folder with the compiled web application.

### 3. Initialize Capacitor

If you haven't already initialized Capacitor (the capacitor.config.js file is already created in this project):

```bash
npx cap init
```

### 4. Add Android Platform

Add the Android platform to your project:

```bash
npx cap add android
```

### 5. Update Android Project with Web Code

Copy the latest web code to the Android project:

```bash
npx cap copy android
```

### 6. Update Native Plugins

Sync any plugins you've installed:

```bash
npx cap sync android
```

### 7. Open in Android Studio

Open the Android project in Android Studio:

```bash
npx cap open android
```

### 8. Build the APK in Android Studio

1. In Android Studio, go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`
2. Wait for the build to complete
3. Click on the notification that appears or navigate to the APK location

The APK will typically be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### 9. Create a Release Build (Optional)

For a release build:

1. In Android Studio, go to `Build > Generate Signed Bundle / APK`
2. Select APK
3. Create or use an existing keystore
4. Fill in the required information
5. Select release build type
6. Click Finish

## Troubleshooting

- If you encounter any issues with the Android build, make sure your Android SDK is properly set up
- Check that you have the correct JDK version installed
- Ensure all Capacitor plugins are compatible with your project

## Testing the APK

You can test the APK by:

1. Installing it directly on an Android device
2. Using an Android emulator in Android Studio

## API Configuration

Make sure to update the API URL in `src/config.js` to point to your backend server's public IP or domain when building for Android.