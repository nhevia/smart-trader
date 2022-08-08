**DEPRECATED; just run npm run pub-build**

Steps for building and packaging: (needs improvement, but it works rn)

1. **npm run build:** webpack will bundle the whole _app folder_ (which includes the react frontend) into `app.bundle.js`. Output is `./public`.
   This will create the bundle for the frontend.
2. Copy express app, electron and configs from project to `./public` (app.js, electron.js, env.json, package.json, preload.js, routes and util folders)
   In public we just had the frontend, so now we're copying the whole backend application and build configurations.
3. `cd ./public` and **npm install**, since public is missing dependencies _node_modules_, we need to install them.
   This can be cached, but if adding a new package to the backend I need to update it.
4. **npm run package** creates the package with executable
