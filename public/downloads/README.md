# Desktop Application Downloads

Place your application executable here:
- `MyAppSetup.exe` - Main desktop application installer

When the Angular app is built and hosted, files in the `public/` folder are served at the root level.
So `public/downloads/MyAppSetup.exe` will be accessible at `/downloads/MyAppSetup.exe`

## Building & Hosting

When deploying:
1. Ensure `MyAppSetup.exe` is placed in this directory
2. Build the Angular app: `npm run build`
3. The `dist/` folder will be your deployable application
4. The `public/downloads/` contents will be included in the build output
5. When hosted, users can download from `/downloads/MyAppSetup.exe`
