# MyGrade

School marks, student reports, and picture capture with on-device reading and a Gemini fallback.
See [picture reader setup](supabase/functions/read-mark/README.md) for the required
Supabase secret and function deployment. Run its checks with
`node tests/mark-reader.test.mjs` and `node tests/capture-marks.test.mjs`.

Capture marks from the scan button beside the intended student. The screen shows
the student name and ID, class, subject and term. Every photo in that session is
assigned to that student; switching students starts a fresh session. The reader
does not identify a student from the paper. Class ownership and the current term
are checked again when saving the combined total.

Crop around one awarded page total. Photos are queued without Base64 data,
resized to at most 1280 pixels on the long edge, then read with ML Kit on the
phone when its native module is available. Only an isolated number/fraction or
an explicit total label is accepted locally; ambiguous output falls back to
Gemini. All suggestions still require teacher confirmation. Two pages can be
processed concurrently, and a failed page can be entered manually.

On-device reading needs an Android/iOS development or production build containing
`@react-native-ml-kit/text-recognition`. Expo Go and web use Gemini instead.
Rebuild the native app after installing `expo-image-manipulator`. Local reading
avoids a cloud request but handwriting accuracy and actual latency must be
measured on representative scripts and target phones; no speed guarantee has
been established by the mock tests.

## Expo development

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
